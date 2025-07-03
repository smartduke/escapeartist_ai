import prompts from '@/lib/prompts';
import MetaSearchAgent from '@/lib/search/metaSearchAgent';
import crypto from 'crypto';
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { EventEmitter } from 'stream';
import {
  chatModelProviders,
  embeddingModelProviders,
  getAvailableChatModelProviders,
  getAvailableEmbeddingModelProviders,
} from '@/lib/providers';
import db from '@/lib/db';
import { chats, messages as messagesSchema } from '@/lib/db/schema';
import { and, eq, gt } from 'drizzle-orm';
import { getFileDetails } from '@/lib/utils/files';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';
import {
  getCustomOpenaiApiKey,
  getCustomOpenaiApiUrl,
  getCustomOpenaiModelName,
} from '@/lib/config';
import { searchHandlers } from '@/lib/search';
import { trackUsage, checkUsageLimit } from '@/lib/usage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Message = {
  messageId: string;
  chatId: string;
  content: string;
};

type ChatModel = {
  provider: string;
  name: string;
};

type EmbeddingModel = {
  provider: string;
  name: string;
};

type Body = {
  message: Message;
  optimizationMode: 'speed' | 'balanced' | 'quality'; // speed = Search, balanced = Deep Search
  focusMode: string;
  history: Array<[string, string]>;
  files: Array<string>;
  chatModel: ChatModel;
  embeddingModel: EmbeddingModel;
  systemInstructions: string;
  userId?: string;
  guestId?: string;
};

// Function to estimate token usage based on text length
const estimateTokens = (text: string): number => {
  // Rough estimation: 1 token ≈ 4 characters (conservative estimate)
  return Math.ceil(text.length / 4);
};

const handleEmitterEvents = async (
  stream: EventEmitter,
  writer: WritableStreamDefaultWriter,
  encoder: TextEncoder,
  aiMessageId: string,
  chatId: string,
  userId: string | undefined,
  modelName: string,
  userQuery: string,
) => {
  let recievedMessage = '';
  let sources: any[] = [];

  // Send initial message to establish streaming connection
  writer.write(
    encoder.encode(
      JSON.stringify({
        type: 'init',
        data: 'Connected',
        messageId: aiMessageId,
      }) + '\n',
    ),
  );

  stream.on('data', (data) => {
    const parsedData = JSON.parse(data);
    if (parsedData.type === 'response') {
      const chunk = encoder.encode(
        JSON.stringify({
          type: 'message',
          data: parsedData.data,
          messageId: aiMessageId,
        }) + '\n',
      );
      writer.write(chunk);
      // Force flush - this is crucial for server streaming
      
      recievedMessage += parsedData.data;
    } else if (parsedData.type === 'sources') {
      const chunk = encoder.encode(
        JSON.stringify({
          type: 'sources',
          data: parsedData.data,
          messageId: aiMessageId,
        }) + '\n',
      );
      writer.write(chunk);
      
      sources = parsedData.data;
    }
  });
  
  stream.on('end', async () => {
    writer.write(
      encoder.encode(
        JSON.stringify({
          type: 'messageEnd',
          messageId: aiMessageId,
        }) + '\n',
      ),
    );
    writer.close();

    // Save the message to database
    const metadata = {
      createdAt: new Date(),
      ...(sources && sources.length > 0 && { sources }),
    };
    
    // Debug: Log what we're saving
    console.log('Saving message to DB:', {
      messageId: aiMessageId,
      chatId: chatId,
      hasSources: !!sources,
      sourcesLength: sources?.length || 0,
      metadata: metadata
    });
    
    await db.insert(messagesSchema)
      .values({
        content: recievedMessage,
        chatId: chatId,
        messageId: aiMessageId,
        role: 'assistant',
        metadata: metadata,
      })
      .execute();

    // Track usage if user is authenticated
    if (userId && recievedMessage) {
      try {
        // Estimate tokens: input query + output response
        const inputTokens = estimateTokens(userQuery);
        const outputTokens = estimateTokens(recievedMessage);
        const totalTokens = inputTokens + outputTokens;

        console.log(`Tracking usage: ${modelName}, User: ${userId}, Tokens: ${totalTokens}`);
        
        await trackUsage(userId, modelName, totalTokens);
      } catch (error) {
        console.error('Failed to track usage:', error);
      }
    }
  });
  
  stream.on('error', (data) => {
    const parsedData = JSON.parse(data);
    writer.write(
      encoder.encode(
        JSON.stringify({
          type: 'error',
          data: parsedData.data,
        }),
      ),
    );
    writer.close();
  });
};

const handleHistorySave = async (
  message: Message,
  humanMessageId: string,
  focusMode: string,
  files: string[],
  userId?: string,
  guestId?: string,
) => {
  const chat = await db.query.chats.findFirst({
    where: eq(chats.id, message.chatId),
  });

  if (!chat) {
    await db
      .insert(chats)
      .values({
        id: message.chatId,
        title: message.content,
        focusMode: focusMode,
        files: files.map(getFileDetails),
        userId: userId || null,
        guestId: guestId || null,
      })
      .execute();
  }

  const messageExists = await db.query.messages.findFirst({
    where: eq(messagesSchema.messageId, humanMessageId),
  });

  if (!messageExists) {
    await db
      .insert(messagesSchema)
      .values({
        content: message.content,
        chatId: message.chatId,
        messageId: humanMessageId,
        role: 'user',
        metadata: {
          createdAt: new Date(),
        },
      })
      .execute();
  } else {
    await db
      .delete(messagesSchema)
      .where(
        and(
          gt(messagesSchema.id, messageExists.id),
          eq(messagesSchema.chatId, message.chatId),
        ),
      )
      .execute();
  }
};

export const POST = async (req: Request) => {
  try {
    const body = (await req.json()) as Body;
    const { message } = body;

    if (message.content === '') {
      return Response.json(
        {
          message: 'Please provide a message to process',
        },
        { status: 400 },
      );
    }

    // Check usage limits for authenticated users
    if (body.userId) {
      const modelName = body.chatModel?.name || 'gpt_4o'; // Default model
      const estimatedTokens = estimateTokens(message.content) + 1000; // Estimate input + average response
      
      try {
        const usageCheck = await checkUsageLimit(body.userId, modelName);
        
        if (!usageCheck.canUse) {
          return Response.json(
            {
              error: 'Usage limit exceeded',
              details: {
                message: `You have exceeded your ${modelName.replace(/_/g, '-')} usage limit for this month.`,
                currentUsage: usageCheck.currentUsage,
                limit: usageCheck.limit,
                remaining: usageCheck.remaining,
                model: modelName,
              },
            },
            { status: 429 }
          );
        }

        // Check if estimated usage would exceed limit
        if (usageCheck.remaining < estimatedTokens) {
          return Response.json(
            {
              error: 'Estimated usage would exceed limit',
              details: {
                message: `This request would exceed your remaining ${modelName.replace(/_/g, '-')} tokens (${usageCheck.remaining} remaining, ~${estimatedTokens} needed).`,
                estimatedTokens,
                remaining: usageCheck.remaining,
                model: modelName,
              },
            },
            { status: 429 }
          );
        }
      } catch (error) {
        console.error('Usage limit check failed:', error);
        // Continue processing - don't block on usage check errors
      }
    }

    const [chatModelProviders, embeddingModelProviders] = await Promise.all([
      getAvailableChatModelProviders(),
      getAvailableEmbeddingModelProviders(),
    ]);

    const chatModelProvider =
      chatModelProviders[
        body.chatModel?.provider || Object.keys(chatModelProviders)[0]
      ];
    const chatModel =
      chatModelProvider[
        body.chatModel?.name || Object.keys(chatModelProvider)[0]
      ];

    const embeddingProvider =
      embeddingModelProviders[
        body.embeddingModel?.provider || Object.keys(embeddingModelProviders)[0]
      ];
    const embeddingModel =
      embeddingProvider[
        body.embeddingModel?.name || Object.keys(embeddingProvider)[0]
      ];

    let llm: BaseChatModel | undefined;
    let embedding = embeddingModel.model;

    if (body.chatModel?.provider === 'custom_openai') {
      llm = new ChatOpenAI({
        openAIApiKey: getCustomOpenaiApiKey(),
        modelName: getCustomOpenaiModelName(),
        temperature: 0.7,
        configuration: {
          baseURL: getCustomOpenaiApiUrl(),
        },
      }) as unknown as BaseChatModel;
    } else if (chatModelProvider && chatModel) {
      llm = chatModel.model;
    }

    if (!llm) {
      return Response.json({ error: 'Invalid chat model' }, { status: 400 });
    }

    if (!embedding) {
      return Response.json(
        { error: 'Invalid embedding model' },
        { status: 400 },
      );
    }

    const humanMessageId =
      message.messageId ?? crypto.randomBytes(7).toString('hex');
    const aiMessageId = crypto.randomBytes(7).toString('hex');

    const history: BaseMessage[] = body.history.map((msg) => {
      if (msg[0] === 'human') {
        return new HumanMessage({
          content: msg[1],
        });
      } else {
        return new AIMessage({
          content: msg[1],
        });
      }
    });

    const handler = searchHandlers[body.focusMode];

    if (!handler) {
      return Response.json(
        {
          message: 'Invalid focus mode',
        },
        { status: 400 },
      );
    }

    const stream = await handler.searchAndAnswer(
      message.content,
      history,
      llm,
      embedding,
      body.optimizationMode,
      body.files,
      body.systemInstructions,
    );

    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    const encoder = new TextEncoder();

    // Get the model name for tracking
    const modelName = body.chatModel?.name || Object.keys(chatModelProvider)[0];

    handleEmitterEvents(stream, writer, encoder, aiMessageId, message.chatId, body.userId, modelName, message.content);
    handleHistorySave(message, humanMessageId, body.focusMode, body.files, body.userId, body.guestId);

    return new Response(responseStream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache, no-store, no-transform',
        'X-Accel-Buffering': 'no', // Disable Nginx buffering
        'X-Content-Type-Options': 'nosniff',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (err) {
    console.error('An error occurred while processing chat request:', err);
    return Response.json(
      { message: 'An error occurred while processing chat request' },
      { status: 500 },
    );
  }
};
