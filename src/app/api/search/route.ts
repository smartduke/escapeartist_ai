import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import { ChatOpenAI } from '@langchain/openai';
import {
  getAvailableChatModelProviders,
  getAvailableEmbeddingModelProviders,
} from '@/lib/providers';
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { MetaSearchAgentType } from '@/lib/search/metaSearchAgent';
import {
  getCustomOpenaiApiKey,
  getCustomOpenaiApiUrl,
  getCustomOpenaiModelName,
} from '@/lib/config';
import { searchHandlers } from '@/lib/search';
import { trackUsage } from '@/lib/usage';
import { getServerUserFromRequest } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

interface chatModel {
  provider: string;
  name: string;
  customOpenAIKey?: string;
  customOpenAIBaseURL?: string;
}

interface embeddingModel {
  provider: string;
  name: string;
}

interface ChatRequestBody {
  optimizationMode: 'speed' | 'balanced';
  focusMode: string;
  chatModel?: chatModel;
  embeddingModel?: embeddingModel;
  query: string;
  history: Array<[string, string]>;
  stream?: boolean;
  systemInstructions?: string;
}

// Function to estimate token usage based on text length
const estimateTokens = (text: string): number => {
  // Rough estimation: 1 token ≈ 4 characters (conservative estimate)
  return Math.ceil(text.length / 4);
};

export const POST = async (req: NextRequest) => {
  try {
    const body: ChatRequestBody = await req.json();

    if (!body.focusMode || !body.query) {
      return Response.json(
        { message: 'Missing focus mode or query' },
        { status: 400 },
      );
    }

    // Get authenticated user for usage tracking
    const user = await getServerUserFromRequest(req);

    body.history = body.history || [];
    body.optimizationMode = body.optimizationMode || 'balanced';
    body.stream = body.stream || false;

    const history: BaseMessage[] = body.history.map((msg) => {
      return msg[0] === 'human'
        ? new HumanMessage({ content: msg[1] })
        : new AIMessage({ content: msg[1] });
    });

    const [chatModelProviders, embeddingModelProviders] = await Promise.all([
      getAvailableChatModelProviders(),
      getAvailableEmbeddingModelProviders(),
    ]);

    const chatModelProvider =
      body.chatModel?.provider || Object.keys(chatModelProviders)[0];
    const chatModel =
      body.chatModel?.name ||
      Object.keys(chatModelProviders[chatModelProvider])[0];

    const embeddingModelProvider =
      body.embeddingModel?.provider || Object.keys(embeddingModelProviders)[0];
    const embeddingModel =
      body.embeddingModel?.name ||
      Object.keys(embeddingModelProviders[embeddingModelProvider])[0];

    let llm: BaseChatModel | undefined;
    let embeddings: Embeddings | undefined;

    if (body.chatModel?.provider === 'custom_openai') {
      llm = new ChatOpenAI({
        modelName: body.chatModel?.name || getCustomOpenaiModelName(),
        openAIApiKey:
          body.chatModel?.customOpenAIKey || getCustomOpenaiApiKey(),
        temperature: 0.7,
        configuration: {
          baseURL:
            body.chatModel?.customOpenAIBaseURL || getCustomOpenaiApiUrl(),
        },
      }) as unknown as BaseChatModel;
    } else if (
      chatModelProviders[chatModelProvider] &&
      chatModelProviders[chatModelProvider][chatModel]
    ) {
      llm = chatModelProviders[chatModelProvider][chatModel]
        .model as unknown as BaseChatModel | undefined;
    }

    if (
      embeddingModelProviders[embeddingModelProvider] &&
      embeddingModelProviders[embeddingModelProvider][embeddingModel]
    ) {
      embeddings = embeddingModelProviders[embeddingModelProvider][
        embeddingModel
      ].model as Embeddings | undefined;
    }

    if (!llm || !embeddings) {
      return Response.json(
        { message: 'Invalid model selected' },
        { status: 400 },
      );
    }

    const searchHandler: MetaSearchAgentType = searchHandlers[body.focusMode];

    if (!searchHandler) {
      return Response.json({ message: 'Invalid focus mode' }, { status: 400 });
    }

    const emitter = await searchHandler.searchAndAnswer(
      body.query,
      history,
      llm,
      embeddings,
      body.optimizationMode,
      [],
      body.systemInstructions || '',
    );

    if (!body.stream) {
      return new Promise(
        (
          resolve: (value: Response) => void,
          reject: (value: Response) => void,
        ) => {
          let message = '';
          let sources: any[] = [];

          emitter.on('data', (data: string) => {
            try {
              const parsedData = JSON.parse(data);
              if (parsedData.type === 'response') {
                message += parsedData.data;
              } else if (parsedData.type === 'sources') {
                sources = parsedData.data;
              }
            } catch (error) {
              reject(
                Response.json(
                  { message: 'Error parsing data' },
                  { status: 500 },
                ),
              );
            }
          });

          emitter.on('end', async () => {
            // Track usage for non-streaming mode
            if (user && message) {
              try {
                const inputTokens = estimateTokens(body.query);
                const outputTokens = estimateTokens(message);
                const totalTokens = inputTokens + outputTokens;
                const modelName = body.chatModel?.name || chatModel;

                console.log(`Tracking search usage: ${modelName}, User: ${user.id}, Tokens: ${totalTokens}`);
                await trackUsage(user.id, modelName, totalTokens);
              } catch (error) {
                console.error('Failed to track search usage:', error);
              }
            }
            
            resolve(Response.json({ message, sources }, { status: 200 }));
          });

          emitter.on('error', (error: any) => {
            reject(
              Response.json(
                { message: 'Search error', error },
                { status: 500 },
              ),
            );
          });
        },
      );
    }

    const encoder = new TextEncoder();

    const abortController = new AbortController();
    const { signal } = abortController;

    const stream = new ReadableStream({
      start(controller) {
        let sources: any[] = [];
        let fullMessage = '';

        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: 'init',
              data: 'Stream connected',
            }) + '\n',
          ),
        );

        signal.addEventListener('abort', () => {
          emitter.removeAllListeners();

          try {
            controller.close();
          } catch (error) {}
        });

        emitter.on('data', (data: string) => {
          if (signal.aborted) return;

          try {
            const parsedData = JSON.parse(data);

            if (parsedData.type === 'response') {
              fullMessage += parsedData.data;
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: 'response',
                    data: parsedData.data,
                  }) + '\n',
                ),
              );
            } else if (parsedData.type === 'sources') {
              sources = parsedData.data;
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: 'sources',
                    data: sources,
                  }) + '\n',
                ),
              );
            }
          } catch (error) {
            controller.error(error);
          }
        });

        emitter.on('end', async () => {
          if (signal.aborted) return;

          // Track usage for streaming mode
          if (user && fullMessage) {
            try {
              const inputTokens = estimateTokens(body.query);
              const outputTokens = estimateTokens(fullMessage);
              const totalTokens = inputTokens + outputTokens;
              const modelName = body.chatModel?.name || chatModel;

              console.log(`Tracking search stream usage: ${modelName}, User: ${user.id}, Tokens: ${totalTokens}`);
              await trackUsage(user.id, modelName, totalTokens);
            } catch (error) {
              console.error('Failed to track search stream usage:', error);
            }
          }

          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'done',
              }) + '\n',
            ),
          );
          controller.close();
        });

        emitter.on('error', (error: any) => {
          if (signal.aborted) return;

          controller.error(error);
        });
      },
      cancel() {
        abortController.abort();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err: any) {
    console.error(`Error in getting search results: ${err.message}`);
    return Response.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
};
