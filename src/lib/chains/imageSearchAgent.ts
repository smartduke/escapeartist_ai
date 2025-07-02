import {
  RunnableSequence,
  RunnableMap,
  RunnableLambda,
} from '@langchain/core/runnables';
import { PromptTemplate } from '@langchain/core/prompts';
import formatChatHistoryAsString from '../utils/formatHistory';
import { BaseMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { searchSearxng } from '../searxng';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

const imageSearchChainPrompt = `
You will be given a conversation below and a follow up question. You need to rephrase the follow-up question so it is a standalone question that can be used by the LLM to search the web for images.
You need to make sure the rephrased question agrees with the conversation and is relevant to the conversation.

Example:
1. Follow up question: What is a cat?
Rephrased: A cat

2. Follow up question: What is a car? How does it works?
Rephrased: Car working

3. Follow up question: How does an AC work?
Rephrased: AC working

Conversation:
{chat_history}

Follow up question: {query}
Rephrased question:
`;

type ImageSearchChainInput = {
  chat_history: BaseMessage[];
  query: string;
  focusMode?: string;
};

interface ImageSearchResult {
  img_src: string;
  url: string;
  title: string;
}

const strParser = new StringOutputParser();

const createImageSearchChain = (llm: BaseChatModel, focusMode?: string) => {
  return RunnableSequence.from([
    RunnableMap.from({
      chat_history: (input: ImageSearchChainInput) => {
        return formatChatHistoryAsString(input.chat_history);
      },
      query: (input: ImageSearchChainInput) => {
        return input.query;
      },
    }),
    PromptTemplate.fromTemplate(imageSearchChainPrompt),
    llm,
    strParser,
    RunnableLambda.from(async (input: string) => {
      try {
        input = input.replace(/<think>.*?<\/think>/g, '').trim();

        console.log(`Image search query: "${input}" with focus mode: ${focusMode}`);

        // Only search escapeartist.com for images
        let searchQueries = [`${input} site:escapeartist.com`];

        const images: ImageSearchResult[] = [];

        for (const searchQuery of searchQueries) {
          if (images.length >= 10) break;

          try {
            const res = await searchSearxng(searchQuery, {
              engines: ['bing images', 'google images'],
              language: 'en',
            });

            console.log(`Search "${searchQuery}" returned ${res.results.length} results`);

            res.results.forEach((result) => {
              if (images.length >= 10) return;

              // More flexible validation - allow items with img_src or thumbnail
              const imageUrl = result.img_src || result.thumbnail_src || result.thumbnail;
              const sourceUrl = result.url;
              const title = result.title || 'Untitled Image';

              if (imageUrl && sourceUrl) {
                // Only include escapeartist.com images
                if (sourceUrl.includes('escapeartist.com')) {
                  images.push({
                    img_src: imageUrl,
                    url: sourceUrl,
                    title: title,
                  });
                }
              }
            });

            // Since we only search escapeartist.com, no need to break early
          } catch (searchError) {
            console.error(`Failed to search with query "${searchQuery}":`, searchError);
            continue;
          }
        }

        console.log(`Final image results: ${images.length} images found`);
        return images.slice(0, 10);

      } catch (error) {
        console.error('Image search failed:', error);
        return []; // Return empty array instead of throwing
      }
    }),
  ]);
};

const handleImageSearch = (
  input: ImageSearchChainInput,
  llm: BaseChatModel,
) => {
  const imageSearchChain = createImageSearchChain(llm, input.focusMode);
  return imageSearchChain.invoke(input);
};

export default handleImageSearch;
