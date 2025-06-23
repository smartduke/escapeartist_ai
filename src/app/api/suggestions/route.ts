import generateSuggestions from '@/lib/chains/suggestionGeneratorAgent';
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

interface SuggestionsGenerationBody {
  chatHistory: any[];
  chatModel?: ChatModel;
}

export const POST = async (req: Request) => {
  try {
    const body: SuggestionsGenerationBody = await req.json();

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

    let suggestions;
    try {
      suggestions = await generateSuggestions(
        {
          chat_history: chatHistory,
        },
        llm,
      );
    } catch (error) {
      console.log(`Primary model failed for suggestions, trying fallback. Error: ${error}`);
      
      // Fallback to GPT-4o-mini for suggestions if primary model fails
      const fallbackProvider = chatModelProviders['openai'];
      const fallbackModel = fallbackProvider?.['gpt-4o-mini'];
      
      if (fallbackModel) {
        console.log('Using GPT-4o-mini as fallback for suggestions');
        try {
          suggestions = await generateSuggestions(
            {
              chat_history: chatHistory,
            },
            fallbackModel.model,
          );
        } catch (fallbackError) {
          console.error('Fallback model also failed for suggestions:', fallbackError);
          return Response.json(
            { message: 'Unable to generate suggestions at this time' },
            { status: 500 },
          );
        }
      } else {
        console.error('No fallback model available for suggestions');
        return Response.json(
          { message: 'Unable to generate suggestions at this time' },
          { status: 500 },
        );
      }
    }

    return Response.json({ suggestions }, { status: 200 });
  } catch (err) {
    console.error(`An error occurred while generating suggestions: ${err}`);
    return Response.json(
      { message: 'An error occurred while generating suggestions' },
      { status: 500 },
    );
  }
};
