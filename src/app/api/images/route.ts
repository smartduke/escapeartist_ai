import handleImageSearch from '@/lib/chains/imageSearchAgent';
import {
  getCustomOpenaiApiKey,
  getCustomOpenaiApiUrl,
  getCustomOpenaiModelName,
} from '@/lib/config';
import { getAvailableChatModelProviders } from '@/lib/providers';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';

interface ChatModel {
  provider: string;
  model: string;
}

interface ImageSearchBody {
  query: string;
  chatHistory: any[];
  chatModel?: ChatModel;
  focusMode?: string;
}

export const POST = async (req: Request) => {
  try {
    const body: ImageSearchBody = await req.json();

    console.log(`Image search API called with query: "${body.query}" and focus mode: ${body.focusMode || 'escapeArtistSearch'}`);

    if (!body.query || body.query.trim() === '') {
      console.error('Empty query provided for image search');
      return Response.json({ error: 'Query is required' }, { status: 400 });
    }

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
      console.error('No valid chat model found for image search');
      return Response.json({ error: 'Invalid chat model' }, { status: 400 });
    }

    console.log(`Using model: ${body.chatModel?.provider || 'default'}/${body.chatModel?.model || 'default'}`);

    const images = await handleImageSearch(
      {
        chat_history: chatHistory,
        query: body.query,
        focusMode: body.focusMode || 'escapeArtistSearch',
      },
      llm,
    );

    console.log(`Image search completed, returning ${images?.length || 0} images`);

    return Response.json({ images: images || [] }, { status: 200 });
  } catch (err) {
    console.error(`An error occurred while searching images:`, err);
    return Response.json(
      { 
        error: 'An error occurred while searching images',
        details: err instanceof Error ? err.message : 'Unknown error'
      },
      { status: 500 },
    );
  }
};
