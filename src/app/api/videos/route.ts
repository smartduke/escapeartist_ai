import handleVideoSearch from '@/lib/chains/videoSearchAgent';
import {
  getCustomOpenaiApiKey,
  getCustomOpenaiApiUrl,
  getCustomOpenaiModelName,
} from '@/lib/config';
import { getAvailableChatModelProviders } from '@/lib/providers';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { trackUsage } from '@/lib/usage';
import { getServerUserFromRequest } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

interface ChatModel {
  provider: string;
  model: string;
}

interface VideoSearchBody {
  query: string;
  chatHistory: any[];
  chatModel?: ChatModel;
}

// Function to estimate token usage based on text length
const estimateTokens = (text: string): number => {
  // Rough estimation: 1 token ≈ 4 characters (conservative estimate)
  return Math.ceil(text.length / 4);
};

export const POST = async (req: NextRequest) => {
  try {
    const body: VideoSearchBody = await req.json();

    // Get authenticated user for usage tracking
    const user = await getServerUserFromRequest(req);

    const chatHistory = body.chatHistory
      .map((msg: any) => {
        if (msg.role === 'user') {
          return new HumanMessage(msg.content);
        } else if (msg.role === 'assistant') {
          return new AIMessage(msg.content);
        }
      })
      .filter((msg) => msg !== undefined) as BaseMessage[];

    const chatModelProviders = await getAvailableChatModelProviders();

    const chatModelProvider =
      chatModelProviders[
        body.chatModel?.provider || Object.keys(chatModelProviders)[0]
      ];
    const chatModel =
      chatModelProvider[
        body.chatModel?.model || Object.keys(chatModelProvider)[0]
      ];

    let llm: BaseChatModel | undefined;

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

    const videos = await handleVideoSearch(
      {
        chat_history: chatHistory,
        query: body.query,
      },
      llm,
    );

    // Track usage for video search
    if (user && videos) {
      try {
        const inputTokens = estimateTokens(body.query);
        // Estimate output tokens based on video results (titles, descriptions)
        const videoText = videos.map((video: any) => 
          `${video.title || ''} ${video.description || ''}`
        ).join(' ');
        const outputTokens = estimateTokens(videoText);
        const totalTokens = inputTokens + outputTokens;
        const modelName = body.chatModel?.model || Object.keys(chatModelProvider)[0];

        console.log(`Tracking video search usage: ${modelName}, User: ${user.id}, Tokens: ${totalTokens}`);
        await trackUsage(user.id, modelName, totalTokens);
      } catch (error) {
        console.error('Failed to track video search usage:', error);
      }
    }

    return Response.json({ videos }, { status: 200 });
  } catch (err) {
    console.error(`An error occurred while searching videos: ${err}`);
    return Response.json(
      { message: 'An error occurred while searching videos' },
      { status: 500 },
    );
  }
};
