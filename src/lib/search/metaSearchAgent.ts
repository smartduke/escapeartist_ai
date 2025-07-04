import { ChatOpenAI } from '@langchain/openai';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
  PromptTemplate,
} from '@langchain/core/prompts';
import {
  RunnableLambda,
  RunnableMap,
  RunnableSequence,
} from '@langchain/core/runnables';
import { BaseMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import LineListOutputParser from '../outputParsers/listLineOutputParser';
import LineOutputParser from '../outputParsers/lineOutputParser';
import { getDocumentsFromLinks } from '../utils/documents';
import { Document } from 'langchain/document';
import { searchSearxng } from '../searxng';
import path from 'node:path';
import fs from 'node:fs';
import computeSimilarity from '../utils/computeSimilarity';
import formatChatHistoryAsString from '../utils/formatHistory';
import eventEmitter from 'events';
import { StreamEvent } from '@langchain/core/tracers/log_stream';

export interface MetaSearchAgentType {
  searchAndAnswer: (
    message: string,
    history: BaseMessage[],
    llm: BaseChatModel,
    embeddings: Embeddings,
    optimizationMode: 'speed' | 'balanced' | 'quality',
    fileIds: string[],
    systemInstructions: string,
  ) => Promise<eventEmitter>;
}

interface Config {
  searchWeb: boolean;
  rerank: boolean;
  summarizer: boolean;
  rerankThreshold: number;
  queryGeneratorPrompt: string;
  responsePrompt: string;
  activeEngines: string[];
}

type BasicChainInput = {
  chat_history: BaseMessage[];
  query: string;
};

class MetaSearchAgent implements MetaSearchAgentType {
  private config: Config;
  private strParser = new StringOutputParser();
  private currentSources: Document[] = [];

  constructor(config: Config) {
    this.config = config;
  }

  private async createSearchRetrieverChain(llm: BaseChatModel) {
    (llm as unknown as ChatOpenAI).temperature = 0;

    return RunnableSequence.from([
      PromptTemplate.fromTemplate(this.config.queryGeneratorPrompt),
      llm,
      this.strParser,
      RunnableLambda.from(async (input: string) => {
        const linksOutputParser = new LineListOutputParser({
          key: 'links',
        });

        const questionOutputParser = new LineOutputParser({
          key: 'question',
        });

        const links = await linksOutputParser.parse(input);
        let question = this.config.summarizer
          ? await questionOutputParser.parse(input)
          : input;

        if (question === 'not_needed') {
          return { query: '', docs: [] };
        }

        if (links.length > 0) {
          if (question.length === 0) {
            question = 'summarize';
          }

          let docs: Document[] = [];

          const linkDocs = await getDocumentsFromLinks({ links });

          const docGroups: Document[] = [];

          linkDocs.map((doc) => {
            const URLDocExists = docGroups.find(
              (d) =>
                d.metadata.url === doc.metadata.url &&
                d.metadata.totalDocs < 10,
            );

            if (!URLDocExists) {
              docGroups.push({
                ...doc,
                metadata: {
                  ...doc.metadata,
                  totalDocs: 1,
                },
              });
            }

            const docIndex = docGroups.findIndex(
              (d) =>
                d.metadata.url === doc.metadata.url &&
                d.metadata.totalDocs < 10,
            );

            if (docIndex !== -1) {
              docGroups[docIndex].pageContent =
                docGroups[docIndex].pageContent + `\n\n` + doc.pageContent;
              docGroups[docIndex].metadata.totalDocs += 1;
            }
          });

          await Promise.all(
            docGroups.map(async (doc) => {
              const res = await llm.invoke(`
            You are a web search summarizer, tasked with summarizing a piece of text retrieved from a web search. Your job is to summarize the 
            text into a detailed, 2-4 paragraph explanation that captures the main ideas and provides a comprehensive answer to the query.
            If the query is \"summarize\", you should provide a detailed summary of the text. If the query is a specific question, you should answer it in the summary.
            
            - **Journalistic tone**: The summary should sound professional and journalistic, not too casual or vague.
            - **Thorough and detailed**: Ensure that every key point from the text is captured and that the summary directly answers the query.
            - **Not too lengthy, but detailed**: The summary should be informative but not excessively long. Focus on providing detailed information in a concise format.

            The text will be shared inside the \`text\` XML tag, and the query inside the \`query\` XML tag.

            <example>
            1. \`<text>
            Docker is a set of platform-as-a-service products that use OS-level virtualization to deliver software in packages called containers. 
            It was first released in 2013 and is developed by Docker, Inc. Docker is designed to make it easier to create, deploy, and run applications 
            by using containers.
            </text>

            <query>
            What is Docker and how does it work?
            </query>

            Response:
            Docker is a revolutionary platform-as-a-service product developed by Docker, Inc., that uses container technology to make application 
            deployment more efficient. It allows developers to package their software with all necessary dependencies, making it easier to run in 
            any environment. Released in 2013, Docker has transformed the way applications are built, deployed, and managed.
            \`
            2. \`<text>
            The theory of relativity, or simply relativity, encompasses two interrelated theories of Albert Einstein: special relativity and general
            relativity. However, the word "relativity" is sometimes used in reference to Galilean invariance. The term "theory of relativity" was based
            on the expression "relative theory" used by Max Planck in 1906. The theory of relativity usually encompasses two interrelated theories by
            Albert Einstein: special relativity and general relativity. Special relativity applies to all physical phenomena in the absence of gravity.
            General relativity explains the law of gravitation and its relation to other forces of nature. It applies to the cosmological and astrophysical
            realm, including astronomy.
            </text>

            <query>
            summarize
            </query>

            Response:
            The theory of relativity, developed by Albert Einstein, encompasses two main theories: special relativity and general relativity. Special
            relativity applies to all physical phenomena in the absence of gravity, while general relativity explains the law of gravitation and its
            relation to other forces of nature. The theory of relativity is based on the concept of "relative theory," as introduced by Max Planck in
            1906. It is a fundamental theory in physics that has revolutionized our understanding of the universe.
            \`
            </example>

            Everything below is the actual data you will be working with. Good luck!

            <query>
            ${question}
            </query>

            <text>
            ${doc.pageContent}
            </text>

            Make sure to answer the query in the summary.
          `);

              const document = new Document({
                pageContent: res.content as string,
                metadata: {
                  title: doc.metadata.title,
                  url: doc.metadata.url,
                },
              });

              docs.push(document);
            }),
          );

          return { query: question, docs: docs };
        } else {
          question = question.replace(/<think>.*?<\/think>/g, '');

          const res = await searchSearxng(question, {
            language: 'en',
            engines: this.config.activeEngines,
          });

          const documents = res.results.map(
            (result) =>
              new Document({
                pageContent:
                  result.content ||
                  (this.config.activeEngines.includes('youtube')
                    ? result.title
                    : '') /* Todo: Implement transcript grabbing using Youtubei (source: https://www.npmjs.com/package/youtubei) */,
                metadata: {
                  title: result.title,
                  url: result.url,
                  ...(result.img_src && { img_src: result.img_src }),
                },
              }),
          );

          return { query: question, docs: documents };
        }
      }),
    ]);
  }

  private async createAnsweringChain(
    llm: BaseChatModel,
    fileIds: string[],
    embeddings: Embeddings,
    optimizationMode: 'speed' | 'balanced' | 'quality',
    systemInstructions: string,
  ) {
    // Enhance the response prompt for Deep Search (balanced) mode
    const enhancedPrompt = optimizationMode === 'balanced' 
      ? this.enhancePromptForDeepSearch(this.config.responsePrompt)
      : this.config.responsePrompt;



    return RunnableSequence.from([
      RunnableMap.from({
        systemInstructions: () => systemInstructions,
        query: (input: BasicChainInput) => input.query,
        chat_history: (input: BasicChainInput) => input.chat_history,
        date: () => new Date().toISOString(),
        context: RunnableLambda.from(async (input: BasicChainInput) => {
          const processedHistory = formatChatHistoryAsString(
            input.chat_history,
          );

          let docs: Document[] | null = null;
          let query = input.query;

          if (this.config.searchWeb) {
            const searchRetrieverChain =
              await this.createSearchRetrieverChain(llm);

            const searchRetrieverResult = await searchRetrieverChain.invoke({
              chat_history: processedHistory,
              query,
            });

            query = searchRetrieverResult.query;
            docs = searchRetrieverResult.docs;
          }

          const sortedDocs = await this.rerankDocs(
            query,
            docs ?? [],
            fileIds,
            embeddings,
            optimizationMode,
          );

          // Store sources for emission
          this.currentSources = sortedDocs;
          console.log(`[MetaSearchAgent] Retrieved ${sortedDocs.length} sources for ${optimizationMode} mode`);
          console.log(`[MetaSearchAgent] Sources:`, sortedDocs.map((doc, i) => `${i+1}. ${doc.metadata.title}`));

          return this.processDocs(sortedDocs);
        }).withConfig({
          runName: 'FinalSourceRetriever',
        }),
      }),
      ChatPromptTemplate.fromMessages([
        ['system', enhancedPrompt],
        new MessagesPlaceholder('chat_history'),
        ['user', '{query}'],
      ]),
      llm,
      this.strParser,
    ]).withConfig({
      runName: 'FinalResponseGenerator',
    });
  }

  private async rerankDocs(
    query: string,
    docs: Document[],
    fileIds: string[],
    embeddings: Embeddings,
    optimizationMode: 'speed' | 'balanced' | 'quality',
  ) {
    if (docs.length === 0 && fileIds.length === 0) {
      return docs;
    }

    const filesData = fileIds
      .map((file) => {
        const filePath = path.join(process.cwd(), 'uploads', file);

        const contentPath = filePath + '-extracted.json';
        const embeddingsPath = filePath + '-embeddings.json';

        const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
        const embeddings = JSON.parse(fs.readFileSync(embeddingsPath, 'utf8'));

        const fileSimilaritySearchObject = content.contents.map(
          (c: string, i: number) => {
            return {
              fileName: content.title,
              content: c,
              embeddings: embeddings.embeddings[i],
            };
          },
        );

        return fileSimilaritySearchObject;
      })
      .flat();

    if (query.toLocaleLowerCase() === 'summarize') {
      return docs.slice(0, 15);
    }

    const docsWithContent = docs.filter(
      (doc) => doc.pageContent && doc.pageContent.length > 0,
    );

    if (optimizationMode === 'speed' || this.config.rerank === false) {
      if (filesData.length > 0) {
        const [queryEmbedding] = await Promise.all([
          embeddings.embedQuery(query),
        ]);

        const fileDocs = filesData.map((fileData) => {
          return new Document({
            pageContent: fileData.content,
            metadata: {
              title: fileData.fileName,
              url: `File`,
            },
          });
        });

        const similarity = filesData.map((fileData, i) => {
          const sim = computeSimilarity(queryEmbedding, fileData.embeddings);

          return {
            index: i,
            similarity: sim,
          };
        });

        let sortedDocs = similarity
          .filter(
            (sim) => sim.similarity > (this.config.rerankThreshold ?? 0.3),
          )
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 15)
          .map((sim) => fileDocs[sim.index]);

        sortedDocs =
          docsWithContent.length > 0 ? sortedDocs.slice(0, 8) : sortedDocs;

        return [
          ...sortedDocs,
          ...docsWithContent.slice(0, 15 - sortedDocs.length),
        ];
      } else {
        return docsWithContent.slice(0, 15);
      }
    } else if (optimizationMode === 'balanced') {
      // Deep Search mode - get more sources with lower threshold for comprehensive coverage
      const [docEmbeddings, queryEmbedding] = await Promise.all([
        embeddings.embedDocuments(
          docsWithContent.map((doc) => doc.pageContent),
        ),
        embeddings.embedQuery(query),
      ]);

      docsWithContent.push(
        ...filesData.map((fileData) => {
          return new Document({
            pageContent: fileData.content,
            metadata: {
              title: fileData.fileName,
              url: `File`,
            },
          });
        }),
      );

      docEmbeddings.push(...filesData.map((fileData) => fileData.embeddings));

      const similarity = docEmbeddings.map((docEmbedding, i) => {
        const sim = computeSimilarity(queryEmbedding, docEmbedding);

        return {
          index: i,
          similarity: sim,
        };
      });

      // For Deep Search: Lower threshold (0.1 vs 0.3) and more sources (25 vs 15)
      const sortedDocs = similarity
        .filter((sim) => sim.similarity > 0.1) // Lower threshold for more diverse sources
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 25) // More sources for comprehensive Deep Search
        .map((sim) => docsWithContent[sim.index]);

      return sortedDocs;
    }

    return [];
  }

  private processDocs(docs: Document[]) {
    if (docs.length === 0) {
      return `NO SOURCES AVAILABLE: No relevant sources were found for this query. Please provide a helpful response based on your general knowledge without using any citation numbers [1], [2], etc.`;
    }
    
    const processedDocs = docs
      .map(
        (_, index) =>
          `${index + 1}. ${docs[index].metadata.title} ${docs[index].pageContent}`,
      )
      .join('\n');
    
    // Add a header that tells the AI exactly how many sources are available
    return `AVAILABLE SOURCES (Total: ${docs.length} sources - ONLY use citations [1] through [${docs.length}]):\n\n${processedDocs}`;
  }

  private enhancePromptForDeepSearch(originalPrompt: string): string {
    // Add Deep Search specific instructions to the original prompt
    const deepSearchEnhancement = `
    
    ### DEEP SEARCH MODE - COMPREHENSIVE RESPONSE REQUIREMENTS
    
    You are now operating in Deep Search mode. Your response must be exceptionally detailed and comprehensive:
    
    **Length Requirements:**
    - Provide a response that is 20-25 paragraphs long
    - Each paragraph should be substantial (4-6 sentences minimum)
    - Total response should be approximately 2000-3000 words
    
    **Content Depth Requirements:**
    - Explore multiple perspectives and angles of the topic
    - Include historical context, background information, and evolution of the subject
    - Provide detailed explanations of technical concepts, breaking them down for general understanding
    - Include relevant examples, case studies, and real-world applications
    - Discuss implications, consequences, and future outlook where applicable
    - Address potential counterarguments or alternative viewpoints
    - Include statistical data, research findings, and expert opinions when available
    
    **Structure Requirements:**
    - Use multiple detailed sections with descriptive headings
    - Include subsections where appropriate to organize complex information
    - Provide smooth transitions between topics and sections
    - Create a logical flow that builds understanding progressively
    
    **Analysis Requirements:**
    - Go beyond surface-level information to provide deep analysis
    - Explain the "why" and "how" behind facts and phenomena
    - Connect different aspects of the topic to show relationships and dependencies
    - Provide context about significance and relevance
    - Include comparative analysis where relevant
    
    **CRITICAL CITATION REQUIREMENTS FOR DEEP SEARCH:**
    - EVERY SINGLE SENTENCE must include at least one citation using [number] notation
    - ONLY use citation numbers that correspond to actual sources in the provided context
    - Count the numbered sources in the context section - do NOT exceed this number
    - If you see sources numbered 1-10, only use citations [1] through [10]
    - Use multiple citations per sentence when information comes from multiple sources: [1][2][3]
    - Reuse citation numbers throughout your response - each source can be cited multiple times
    - For detailed explanations, cite multiple relevant sources from the available set
    - When providing examples or case studies, always cite from the available sources
    - Historical information, statistics, and expert opinions MUST be cited from available sources
    - If making connections between concepts, cite available sources for each concept mentioned
    - NEVER invent citation numbers - only use what's actually provided in the context
    - DO NOT include a "Sources:" or "References:" section at the end of your response
    - DO NOT list sources manually - only use inline [number] citations
    - The citation system will automatically handle source display
    
    Remember: This is Deep Search mode - users expect extensive, thoroughly cited coverage with every claim backed by AVAILABLE sources. Only cite sources that actually exist in the context. Never manually list sources.`;

    return originalPrompt + deepSearchEnhancement;
  }

  private async handleStream(
    stream: AsyncGenerator<StreamEvent, any, any>,
    emitter: eventEmitter,
  ) {
    let buffer = '';
    let totalChunksEmitted = 0;
    
    // Progressive streaming: start fast, then slow down for better readability
    const getStreamDelay = (chunkCount: number) => {
      if (chunkCount < 10) return 15; // Very fast start
      if (chunkCount < 30) return 25; // Medium speed
      return 40; // Comfortable reading speed for longer content
    };
    
    // Dynamic chunk size based on content flow
    const getChunkSize = (buffer: string, chunkCount: number) => {
      // Start with smaller chunks for immediate responsiveness
      if (chunkCount < 5) return 3;
      if (chunkCount < 15) return 8;
      return 15; // Larger chunks for efficiency
    };

    for await (const event of stream) {
      if (
        event.event === 'on_chain_end' &&
        event.name === 'FinalSourceRetriever'
      ) {
        // Emit the stored sources
        console.log(`[MetaSearchAgent] Emitting ${this.currentSources.length} sources`);
        emitter.emit(
          'data',
          JSON.stringify({ type: 'sources', data: this.currentSources }),
        );
      }
      if (
        event.event === 'on_chain_stream' &&
        event.name === 'FinalResponseGenerator'
      ) {
        // Accumulate the chunk in the buffer
        buffer += event.data.chunk;
        
        // Get dynamic chunk size
        const currentChunkSize = getChunkSize(buffer, totalChunksEmitted);
        
        // If we have enough characters, emit them
        while (buffer.length >= currentChunkSize) {
          let chunk = buffer.slice(0, currentChunkSize);
          
          // Try to break at word boundaries for better readability
          if (buffer.length > currentChunkSize) {
            const spaceIndex = chunk.lastIndexOf(' ');
            const newlineIndex = chunk.lastIndexOf('\n');
            const boundaryIndex = Math.max(spaceIndex, newlineIndex);
            
            // If we find a good boundary and it's not too short, use it
            if (boundaryIndex > currentChunkSize * 0.6) {
              chunk = buffer.slice(0, boundaryIndex + 1);
              buffer = buffer.slice(boundaryIndex + 1);
            } else {
              buffer = buffer.slice(currentChunkSize);
            }
          } else {
            buffer = buffer.slice(currentChunkSize);
          }
          
          // Emit the chunk
          emitter.emit(
            'data',
            JSON.stringify({ type: 'response', data: chunk })
          );
          
          totalChunksEmitted++;
          
          // Progressive delay for natural reading rhythm
          const delay = getStreamDelay(totalChunksEmitted);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      if (
        event.event === 'on_chain_end' &&
        event.name === 'FinalResponseGenerator'
      ) {
        // Emit any remaining buffer content
        if (buffer.length > 0) {
          emitter.emit(
            'data',
            JSON.stringify({ type: 'response', data: buffer })
          );
        }
        emitter.emit('end');
      }
    }
  }

  async searchAndAnswer(
    message: string,
    history: BaseMessage[],
    llm: BaseChatModel,
    embeddings: Embeddings,
    optimizationMode: 'speed' | 'balanced' | 'quality',
    fileIds: string[],
    systemInstructions: string,
  ) {
    const emitter = new eventEmitter();

    const answeringChain = await this.createAnsweringChain(
      llm,
      fileIds,
      embeddings,
      optimizationMode,
      systemInstructions,
    );

    const stream = answeringChain.streamEvents(
      {
        chat_history: history,
        query: message,
      },
      {
        version: 'v1',
      },
    );

    this.handleStream(stream, emitter);

    return emitter;
  }
}

export default MetaSearchAgent;
