'use client';

/* eslint-disable @next/next/no-img-element */
import React, { MutableRefObject, useEffect, useState, useRef } from 'react';
import { Message } from './ChatWindow';
import { cn } from '@/lib/utils';
import {
  BookCopy,
  Disc3,
  ImagesIcon,
  Volume2,
  StopCircle,
  Layers3,
  Plus,
  Edit3,
  VideoIcon,
  Bot,
  Sparkles,
  Zap,
  BrainCircuit,
  MessageSquare,
  Lightbulb,
  Stars,
  Disc,
  RotateCw,
  Target,
  Compass,
  Loader,
  Circle,
  RefreshCw,
  Loader2,
  Settings,
  Cpu,
  Atom,
} from 'lucide-react';
import Markdown, { MarkdownToJSX } from 'markdown-to-jsx';
import Copy from './MessageActions/Copy';
import Rewrite from './MessageActions/Rewrite';
import RichTextEditor from './MessageActions/RichTextEditor';
import MessageSources from './MessageSources';
import SearchImages from './SearchImages';
import SearchVideos from './SearchVideos';
import { useSpeech } from 'react-text-to-speech';
import ThinkBox from './ThinkBox';
import SourcesSidebar from './SourcesSidebar';
import { Document } from '@langchain/core/documents';

const ThinkTagProcessor = ({ children }: { children: React.ReactNode }) => {
  return <ThinkBox content={children as string} />;
};

const MessageBox = ({
  message,
  messageIndex,
  history,
  loading,
  dividerRef,
  isLast,
  rewrite,
  sendMessage,
  onMessageUpdate,
  isEditing,
  onEditStart,
  onEditEnd,
}: {
  message: Message;
  messageIndex: number;
  history: Message[];
  loading: boolean;
  dividerRef?: MutableRefObject<HTMLDivElement | null>;
  isLast: boolean;
  rewrite: (messageId: string) => void;
  sendMessage: (message: string) => void;
  onMessageUpdate?: (messageId: string, newContent: string) => void;
  isEditing?: boolean;
  onEditStart?: () => void;
  onEditEnd?: () => void;
}) => {
  const [parsedMessage, setParsedMessage] = useState(message.content);
  const [speechMessage, setSpeechMessage] = useState(message.content);
  const [showSourcesSidebar, setShowSourcesSidebar] = useState(false);
  const [sidebarSources, setSidebarSources] = useState<Document[]>([]);
  const [sidebarMessageIndex, setSidebarMessageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('answer');
  const tabNavRef = useRef<HTMLDivElement>(null);

  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
    tabNavRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const citationRegex = /\[([^\]]+)\]/g;
    const regex = /\[(\d+)\]/g;
    let processedMessage = message.content;

    if (message.role === 'assistant' && message.content.includes('<think>')) {
      const openThinkTag = processedMessage.match(/<think>/g)?.length || 0;
      const closeThinkTag = processedMessage.match(/<\/think>/g)?.length || 0;

      if (openThinkTag > closeThinkTag) {
        processedMessage += '</think> <a> </a>'; // The extra <a> </a> is to prevent the the think component from looking bad
      }
    }

    if (
      message.role === 'assistant' &&
      message?.sources &&
      message.sources.length > 0
    ) {
      console.log(`[MessageBox] Processing ${message.sources.length} sources for citations`);
      console.log(`[MessageBox] Sources:`, message.sources.map((s, i) => `${i+1}. ${s.metadata?.title}`));
      setParsedMessage(
        processedMessage.replace(
          citationRegex,
          (_, capturedContent: string) => {
            const numbers = capturedContent
              .split(',')
              .map((numStr) => numStr.trim());

            const linksHtml = numbers
              .map((numStr) => {
                const number = parseInt(numStr);

                if (isNaN(number) || number <= 0) {
                  return `[${numStr}]`;
                }

                const source = message.sources?.[number - 1];
                const url = source?.metadata?.url;

                if (url) {
                  return `<a href="${url}" target="_blank" className="bg-light-secondary dark:bg-dark-secondary px-1 rounded ml-1 no-underline text-xs text-black/70 dark:text-white/70 relative">${numStr}</a>`;
                } else {
                  return `[${numStr}]`;
                }
              })
              .join('');

            return linksHtml;
          },
        ),
      );
      setSpeechMessage(message.content.replace(regex, ''));
      return;
    }

    setSpeechMessage(message.content.replace(regex, ''));
    setParsedMessage(processedMessage);
  }, [message.content, message.sources, message.role]);

  const { speechStatus, start, stop } = useSpeech({ text: speechMessage });

  const handleViewSources = (sources: Document[], messageIndex: number) => {
    setSidebarSources(sources);
    setSidebarMessageIndex(messageIndex);
    setShowSourcesSidebar(true);
  };

  const handleCloseSidebar = () => {
    setShowSourcesSidebar(false);
  };

  const markdownOverrides: MarkdownToJSX.Options = {
    overrides: {
      think: {
        component: ThinkTagProcessor,
      },
    },
  };

  return (
    <div>
      {message.role === 'user' && (
        <div
          data-message-index={messageIndex}
          className={cn(
            'w-full',
            messageIndex === 0 ? 'pt-16' : 'pt-8',
            'break-words',
          )}
        >
          <h2 className="text-black dark:text-white font-medium text-3xl lg:w-9/12">
            {message.content}
          </h2>
        </div>
      )}

      {message.role === 'assistant' && (
        <div className="flex flex-col w-full">
          <div
            ref={dividerRef}
            className="w-full"
          >
            {/* Tab Navigation */}
            <div 
              ref={tabNavRef}
              className={cn(
                "bg-light-primary dark:bg-dark-primary border-b border-light-200 dark:border-dark-200 mb-6",
                isEditing ? "" : "sticky top-16 z-10"
              )}>
              <nav className="flex space-x-8">
                <button
                  onClick={() => handleTabClick('answer')}
                  className={cn(
                    'py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200',
                    activeTab === 'answer'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <Atom
                      className={cn(
                        isLast && loading ? 'animate-spin' : 'animate-none',
                      )}
                      size={18}
                    />
                    <span>AI Answer</span>
                  </div>
                </button>
                <button
                  onClick={() => handleTabClick('images')}
                  className={cn(
                    'py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200',
                    activeTab === 'images'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <ImagesIcon size={18} />
                    <span>Images</span>
                  </div>
                </button>
                <button
                  onClick={() => handleTabClick('videos')}
                  className={cn(
                    'py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200',
                    activeTab === 'videos'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <VideoIcon size={18} />
                    <span>Videos</span>
                  </div>
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'answer' && (
              <div className="flex flex-col space-y-4">
                {message.sources && message.sources.length > 0 && (
                  <div className="flex flex-col space-y-3">
                    <div className="flex flex-row items-center space-x-2">
                      <BookCopy className="text-black dark:text-white" size={20} />
                      <h3 className="text-black dark:text-white font-medium text-xl">
                        Sources
                      </h3>
                      <span className="text-xs text-gray-500">({message.sources.length} sources)</span>
                    </div>
                    <MessageSources 
                      sources={message.sources} 
                      messageIndex={messageIndex}
                      onViewSources={handleViewSources}
                    />
                  </div>
                )}
                <div className="flex flex-col space-y-2">
                  {isEditing && onMessageUpdate ? (
                    <RichTextEditor
                      messageId={message.messageId}
                      initialContent={message.content}
                      onUpdate={onMessageUpdate}
                      onEditStart={onEditStart}
                      onEditEnd={onEditEnd}
                      message={message}
                      history={history}
                    />
                  ) : (
                    <Markdown
                      className={cn(
                        'prose prose-h1:mb-3 prose-h2:mb-2 prose-h2:mt-6 prose-h2:font-[800] prose-h3:mt-4 prose-h3:mb-1.5 prose-h3:font-[600] dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 font-[400]',
                        'max-w-none break-words text-black dark:text-white',
                      )}
                      options={markdownOverrides}
                    >
                      {parsedMessage}
                    </Markdown>
                  )}
                  {loading && isLast ? null : (
                    <div className="flex flex-row items-center justify-between w-full text-black dark:text-white py-4 -mx-2">
                      <div className="flex flex-row items-center space-x-1">
                        <Rewrite rewrite={rewrite} messageId={message.messageId} />
                        {onEditStart && !isEditing && (
                          <button
                            onClick={onEditStart}
                            className="p-2 text-black/70 dark:text-white/70 rounded-xl hover:bg-light-secondary dark:hover:bg-dark-secondary transition duration-200 hover:text-black dark:hover:text-white"
                            title="Edit message"
                          >
                            <Edit3 size={18} />
                          </button>
                        )}
                      </div>
                      <div className="flex flex-row items-center space-x-1">
                        <Copy initialMessage={message.content} message={message} />
                        <button
                          onClick={() => {
                            if (speechStatus === 'started') {
                              stop();
                            } else {
                              start();
                            }
                          }}
                          className="p-2 text-black/70 dark:text-white/70 rounded-xl hover:bg-light-secondary dark:hover:bg-dark-secondary transition duration-200 hover:text-black dark:hover:text-white"
                        >
                          {speechStatus === 'started' ? (
                            <StopCircle size={18} />
                          ) : (
                            <Volume2 size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  {isLast &&
                    message.suggestions &&
                    message.suggestions.length > 0 &&
                    message.role === 'assistant' &&
                    !loading && (
                      <>
                        <div className="h-px w-full bg-light-secondary dark:bg-dark-secondary" />
                        <div className="flex flex-col space-y-3 text-black dark:text-white">
                          <div className="flex flex-row items-center space-x-2 mt-4">
                            <Layers3 />
                            <h3 className="text-xl font-medium">Related</h3>
                          </div>
                          <div className="flex flex-col space-y-3">
                            {message.suggestions.map((suggestion, i) => (
                              <div
                                className="flex flex-col space-y-3 text-sm"
                                key={i}
                              >
                                <div className="h-px w-full bg-light-secondary dark:bg-dark-secondary" />
                                <div
                                  onClick={() => {
                                    sendMessage(suggestion);
                                  }}
                                  className="cursor-pointer flex flex-row justify-between font-medium space-x-2 items-center"
                                >
                                  <p className="transition duration-200 hover:text-[#24A0ED]">
                                    {suggestion}
                                  </p>
                                  <Plus
                                    size={20}
                                    className="text-[#24A0ED] flex-shrink-0"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                </div>
              </div>
            )}

            {activeTab === 'images' && (
              <div className="w-full">
                <SearchImages
                  query={history[messageIndex - 1]?.content || ''}
                  chatHistory={history.slice(0, messageIndex - 1)}
                  messageId={message.messageId}
                  autoLoad={true}
                />
              </div>
            )}

            {activeTab === 'videos' && (
              <div className="w-full">
                <SearchVideos
                  chatHistory={history.slice(0, messageIndex - 1)}
                  query={history[messageIndex - 1]?.content || ''}
                  messageId={message.messageId}
                  autoLoad={true}
                />
              </div>
            )}
          </div>
        </div>
      )}


      
      {/* Sources Sidebar */}
      <SourcesSidebar
        sources={sidebarSources}
        isOpen={showSourcesSidebar}
        onClose={handleCloseSidebar}
        messageIndex={sidebarMessageIndex}
      />
    </div>
  );
};

export default MessageBox;
