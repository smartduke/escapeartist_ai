'use client';

import { useEffect, useRef, useState } from 'react';
import { Document } from '@langchain/core/documents';
import Navbar from './Navbar';
import Chat from './Chat';
import EmptyChat from './EmptyChat';

import BlogExportsPanel from './BlogExportsPanel';
import crypto from 'crypto';
import { toast } from 'sonner';
import { useSearchParams, useRouter } from 'next/navigation';
import { getSuggestions } from '@/lib/actions';
import { Settings } from 'lucide-react';
import Link from 'next/link';
import NextError from 'next/error';
import { useAuth } from '@/components/auth/AuthProvider';
import { AuthModal } from '@/components/auth/AuthModal';
import { GuestLimitWarning } from '@/components/auth/GuestLimitWarning';

export type Message = {
  messageId: string;
  chatId: string;
  createdAt: Date;
  content: string;
  role: 'user' | 'assistant';
  suggestions?: string[];
  sources?: Document[];
};

export interface File {
  fileName: string;
  fileExtension: string;
  fileId: string;
}

interface ChatModelProvider {
  name: string;
  provider: string;
}

interface EmbeddingModelProvider {
  name: string;
  provider: string;
}

const checkConfig = async (
  setChatModelProvider: (provider: ChatModelProvider) => void,
  setEmbeddingModelProvider: (provider: EmbeddingModelProvider) => void,
  setIsConfigReady: (ready: boolean) => void,
  setHasError: (hasError: boolean) => void,
) => {
  try {
    let chatModel = localStorage.getItem('chatModel');
    let chatModelProvider = localStorage.getItem('chatModelProvider');
    let embeddingModel = localStorage.getItem('embeddingModel');
    let embeddingModelProvider = localStorage.getItem('embeddingModelProvider');

    const autoImageSearch = localStorage.getItem('autoImageSearch');
    const autoVideoSearch = localStorage.getItem('autoVideoSearch');

    if (!autoImageSearch) {
      localStorage.setItem('autoImageSearch', 'true');
    }

    if (!autoVideoSearch) {
      localStorage.setItem('autoVideoSearch', 'false');
    }

    const providers = await fetch(`/api/models`, {
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(async (res) => {
      if (!res.ok)
        throw new Error(
          `Failed to fetch models: ${res.status} ${res.statusText}`,
        );
      return res.json();
    });

    if (
      !chatModel ||
      !chatModelProvider ||
      !embeddingModel ||
      !embeddingModelProvider
    ) {
      if (!chatModel || !chatModelProvider) {
        const chatModelProviders = providers.chatModelProviders;

        chatModelProvider =
          chatModelProvider || Object.keys(chatModelProviders)[0];

        chatModel = Object.keys(chatModelProviders[chatModelProvider])[0];

        if (!chatModelProviders || Object.keys(chatModelProviders).length === 0)
          return toast.error('No chat models available');
      }

      if (!embeddingModel || !embeddingModelProvider) {
        const embeddingModelProviders = providers.embeddingModelProviders;

        if (
          !embeddingModelProviders ||
          Object.keys(embeddingModelProviders).length === 0
        )
          return toast.error('No embedding models available');

        embeddingModelProvider = Object.keys(embeddingModelProviders)[0];
        embeddingModel = Object.keys(
          embeddingModelProviders[embeddingModelProvider],
        )[0];
      }

      localStorage.setItem('chatModel', chatModel!);
      localStorage.setItem('chatModelProvider', chatModelProvider);
      localStorage.setItem('embeddingModel', embeddingModel!);
      localStorage.setItem('embeddingModelProvider', embeddingModelProvider);
    } else {
      const chatModelProviders = providers.chatModelProviders;
      const embeddingModelProviders = providers.embeddingModelProviders;

      if (
        Object.keys(chatModelProviders).length > 0 &&
        !chatModelProviders[chatModelProvider]
      ) {
        const chatModelProvidersKeys = Object.keys(chatModelProviders);
        chatModelProvider =
          chatModelProvidersKeys.find(
            (key) => Object.keys(chatModelProviders[key]).length > 0,
          ) || chatModelProvidersKeys[0];

        localStorage.setItem('chatModelProvider', chatModelProvider);
      }

      if (
        chatModelProvider &&
        !chatModelProviders[chatModelProvider][chatModel]
      ) {
        chatModel = Object.keys(
          chatModelProviders[
            Object.keys(chatModelProviders[chatModelProvider]).length > 0
              ? chatModelProvider
              : Object.keys(chatModelProviders)[0]
          ],
        )[0];
        localStorage.setItem('chatModel', chatModel);
      }

      if (
        Object.keys(embeddingModelProviders).length > 0 &&
        !embeddingModelProviders[embeddingModelProvider]
      ) {
        embeddingModelProvider = Object.keys(embeddingModelProviders)[0];
        localStorage.setItem('embeddingModelProvider', embeddingModelProvider);
      }

      if (
        embeddingModelProvider &&
        !embeddingModelProviders[embeddingModelProvider][embeddingModel]
      ) {
        embeddingModel = Object.keys(
          embeddingModelProviders[embeddingModelProvider],
        )[0];
        localStorage.setItem('embeddingModel', embeddingModel);
      }
    }

    setChatModelProvider({
      name: chatModel!,
      provider: chatModelProvider,
    });

    setEmbeddingModelProvider({
      name: embeddingModel!,
      provider: embeddingModelProvider,
    });

    setIsConfigReady(true);
  } catch (err) {
    console.error('An error occurred while checking the configuration:', err);
    setIsConfigReady(false);
    setHasError(true);
  }
};

const loadMessages = async (
  chatId: string,
  setMessages: (messages: Message[]) => void,
  setIsMessagesLoaded: (loaded: boolean) => void,
  setChatHistory: (history: [string, string][]) => void,
  setFocusMode: (mode: string) => void,
  setNotFound: (notFound: boolean) => void,
  setFiles: (files: File[]) => void,
  setFileIds: (fileIds: string[]) => void,
) => {
  const res = await fetch(`/api/chats/${chatId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (res.status === 404) {
    setNotFound(true);
    setIsMessagesLoaded(true);
    return;
  }

  const data = await res.json();

  const messages = data.messages.map((msg: any) => {
    const parsedMetadata = typeof msg.metadata === 'string' ? JSON.parse(msg.metadata) : msg.metadata;
    
    // Debug: Log what's in the metadata for assistant messages
    if (msg.role === 'assistant') {
      console.log('Assistant message metadata:', {
        messageId: msg.messageId,
        hasMetadata: !!msg.metadata,
        metadataType: typeof msg.metadata,
        parsedMetadata,
        hasSources: !!parsedMetadata?.sources,
        sourcesLength: parsedMetadata?.sources?.length || 0
      });
    }
    
    // Ensure createdAt is a Date object
    const createdAt = msg.createdAt ? new Date(msg.createdAt) : new Date();
    
    return {
      ...msg,
      ...parsedMetadata,
      createdAt,
    };
  }) as Message[];

  setMessages(messages);

  const history = messages.map((msg) => {
    return [msg.role, msg.content];
  }) as [string, string][];

  console.debug(new Date(), 'app:messages_loaded');

  document.title = messages[0].content;

  const files = data.chat.files.map((file: any) => {
    return {
      fileName: file.name,
      fileExtension: file.name.split('.').pop(),
      fileId: file.fileId,
    };
  });

  setFiles(files);
  setFileIds(files.map((file: File) => file.fileId));

  setChatHistory(history);
  setFocusMode(data.chat.focusMode);
  setIsMessagesLoaded(true);
};

const ChatWindow = ({ id }: { id?: string }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMessage = searchParams.get('q');
  const templateParam = searchParams.get('template');
  const { user, guestId, guestChatCount, maxGuestChats, canCreateChat, incrementGuestChatCount, isLoading: authLoading } = useAuth();

  const [chatId, setChatId] = useState<string | undefined>(id);
  const [newChatCreated, setNewChatCreated] = useState(false);
  
  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  // Blog exports panel state
  const [showBlogExports, setShowBlogExports] = useState(false);
  const [hasExports, setHasExports] = useState(false);

  const [chatModelProvider, setChatModelProvider] = useState<ChatModelProvider>(
    {
      name: '',
      provider: '',
    },
  );

  const [embeddingModelProvider, setEmbeddingModelProvider] =
    useState<EmbeddingModelProvider>({
      name: '',
      provider: '',
    });

  const [isConfigReady, setIsConfigReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const [loading, setLoading] = useState(false);
  const [messageAppeared, setMessageAppeared] = useState(false);

  const [chatHistory, setChatHistory] = useState<[string, string][]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const [files, setFiles] = useState<File[]>([]);
  const [fileIds, setFileIds] = useState<string[]>([]);

  const [focusMode, setFocusMode] = useState(templateParam || 'escapeArtistSearch');
  const [optimizationMode, setOptimizationMode] = useState('speed');

  const [isMessagesLoaded, setIsMessagesLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Update focusMode when URL template parameter changes, but only for new chats
  useEffect(() => {
    // Only update focus mode from URL if:
    // 1. We're starting a new chat (newChatCreated) OR
    // 2. Messages haven't been loaded yet (meaning we're not restoring from chat history)
    if (newChatCreated || !isMessagesLoaded) {
      const newFocusMode = templateParam || 'escapeArtistSearch';
      if (newFocusMode !== focusMode) {
        setFocusMode(newFocusMode);
      }
    }
  }, [templateParam, focusMode, newChatCreated, isMessagesLoaded]);

  useEffect(() => {
    checkConfig(
      setChatModelProvider,
      setEmbeddingModelProvider,
      setIsConfigReady,
      setHasError,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for localStorage changes to update model selection in real-time
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'chatModel' || e.key === 'chatModelProvider') {
        // Re-check config when model selection changes
        checkConfig(
          setChatModelProvider,
          setEmbeddingModelProvider,
          setIsConfigReady,
          setHasError,
        );
      }
    };

    // Listen for storage events (changes from other tabs/windows)
    window.addEventListener('storage', handleStorageChange);

    // For same-tab localStorage changes, we need a custom event
    const handleLocalStorageChange = () => {
      checkConfig(
        setChatModelProvider,
        setEmbeddingModelProvider,
        setIsConfigReady,
        setHasError,
      );
    };

    // Listen for custom model change events
    window.addEventListener('modelSelectionChanged', handleLocalStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('modelSelectionChanged', handleLocalStorageChange);
    };
  }, []);

  useEffect(() => {
    if (
      chatId &&
      !newChatCreated &&
      !isMessagesLoaded &&
      messages.length === 0
    ) {
      loadMessages(
        chatId,
        setMessages,
        setIsMessagesLoaded,
        setChatHistory,
        setFocusMode,
        setNotFound,
        setFiles,
        setFileIds,
      );
    } else if (!chatId && !id) {
      // Only create new chat ID if we're on the home page (no id prop)
      setNewChatCreated(true);
      setIsMessagesLoaded(true);
      const newChatId = crypto.randomBytes(20).toString('hex');
      setChatId(newChatId);
    } else if (id) {
      // If we have an id prop but no chatId state, set it
      setChatId(id);
    }
  }, [chatId, id, newChatCreated, isMessagesLoaded, messages.length]);

  const messagesRef = useRef<Message[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (isMessagesLoaded && isConfigReady) {
      setIsReady(true);
      console.debug(new Date(), 'app:ready');
    } else {
      setIsReady(false);
    }
  }, [isMessagesLoaded, isConfigReady]);

  const sendMessage = async (message: string, messageId?: string) => {
    if (loading) return;
    if (!isConfigReady) {
      toast.error('Cannot send message before the configuration is ready');
      return;
    }

    // Check guest limits
    if (!user && !canCreateChat) {
      setAuthMode('login');
      setAuthModalOpen(true);
      return;
    }

    setLoading(true);
    setMessageAppeared(false);

    let sources: Document[] | undefined = undefined;
    let recievedMessage = '';
    let added = false;

    messageId = messageId ?? crypto.randomBytes(7).toString('hex');

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        content: message,
        messageId: messageId,
        chatId: chatId!,
        role: 'user',
        createdAt: new Date(),
      },
    ]);

    const messageHandler = async (data: any) => {
      if (data.type === 'error') {
        toast.error(data.data);
        setLoading(false);
        return;
      }

      if (data.type === 'sources') {
        sources = data.data;
        // Don't create a message here, wait for content
        setMessageAppeared(true);
      }

      if (data.type === 'message') {
        if (!added) {
          // Create the message only once when we get the first content
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              content: data.data,
              messageId: data.messageId,
              chatId: chatId!,
              role: 'assistant',
              sources: sources,
              createdAt: new Date(),
            },
          ]);
          added = true;
          
          // Update URL without page refresh if we're starting a new chat from homepage
          if (newChatCreated && messages.length === 0) {
            const templateParam = focusMode !== 'escapeArtistSearch' ? `?template=${focusMode}` : '';
            const newUrl = `/c/${chatId}${templateParam}`;
            window.history.replaceState(null, '', newUrl);
          }
        } else {
          // Update existing message content
          setMessages((prev) =>
            prev.map((message) => {
              if (message.messageId === data.messageId) {
                return { 
                  ...message, 
                  content: message.content + data.data,
                  sources: sources // Update sources if they arrived later
                };
              }
              return message;
            }),
          );
        }

        recievedMessage += data.data;
        setMessageAppeared(true);
      }

      if (data.type === 'messageEnd') {
        console.log('MessageEnd triggered!');

        setChatHistory((prevHistory) => [
          ...prevHistory,
          ['human', message],
          ['assistant', recievedMessage],
        ]);

        setLoading(false);

        const lastMsg = messagesRef.current[messagesRef.current.length - 1];

        const autoImageSearch = localStorage.getItem('autoImageSearch');
        const autoVideoSearch = localStorage.getItem('autoVideoSearch');

        if (autoImageSearch === 'true') {
          document
            .getElementById(`search-images-${lastMsg.messageId}`)
            ?.click();
        }

        if (autoVideoSearch === 'true') {
          document
            .getElementById(`search-videos-${lastMsg.messageId}`)
            ?.click();
        }

        console.log('Suggestions check - lastMsg:', {
          messageId: lastMsg.messageId,
          role: lastMsg.role,
          hasSources: !!(lastMsg.sources),
          sourcesLength: lastMsg.sources?.length || 0,
          hasSuggestions: !!(lastMsg.suggestions),
          suggestionsLength: lastMsg.suggestions?.length || 0
        });

        if (
          lastMsg.role === 'assistant' &&
          lastMsg.sources &&
          lastMsg.sources.length > 0 &&
          !lastMsg.suggestions
        ) {
          console.log('Generating suggestions for message:', lastMsg.messageId);
          const suggestions = await getSuggestions(messagesRef.current);
          console.log('Generated suggestions:', suggestions);
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.messageId === lastMsg.messageId) {
                return { ...msg, suggestions: suggestions };
              }
              return msg;
            }),
          );

          // Save suggestions to database
          try {
            console.log('Saving suggestions to database for message:', lastMsg.messageId);
            await fetch(`/api/messages/${lastMsg.messageId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ suggestions: suggestions }),
            });
            console.log('Suggestions saved successfully');
          } catch (error) {
            console.error('Failed to save suggestions to database:', error);
          }
        } else {
          console.log('Suggestions condition not met');
        }
      }
    };

    // Increment guest chat count when starting a new chat
    if (!user && messages.length === 0) {
      incrementGuestChatCount();
    }

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: message,
        message: {
          messageId: messageId,
          chatId: chatId!,
          content: message,
        },
        chatId: chatId!,
        files: fileIds,
        focusMode: focusMode,
        optimizationMode: optimizationMode,
        history: chatHistory,
        chatModel: {
          name: chatModelProvider.name,
          provider: chatModelProvider.provider,
        },
        embeddingModel: {
          name: embeddingModelProvider.name,
          provider: embeddingModelProvider.provider,
        },
        systemInstructions: localStorage.getItem('systemInstructions'),
        userId: user?.id || null,
        guestId: !user ? guestId : null,
      }),
    });

    // Handle usage limit errors
    if (res.status === 429) {
      try {
        const errorData = await res.json();
        setLoading(false);
        
        if (errorData.details?.feature) {
          // Usage limit error
          toast.error(
            `Usage Limit Exceeded: ${errorData.details.message}`, 
            { 
              duration: 6000,
              style: {
                maxWidth: '500px',
              }
            }
          );
        } else {
          toast.error(errorData.details?.message || 'Request rate limited. Please try again later.');
        }
        return;
      } catch (parseError) {
        toast.error('Request rate limited. Please try again later.');
        setLoading(false);
        return;
      }
    }

    if (!res.ok) {
      setLoading(false);
      toast.error('Failed to send message. Please try again.');
      return;
    }

    if (!res.body) throw new Error('No response body');

    const reader = res.body?.getReader();
    const decoder = new TextDecoder('utf-8');

    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        // Process any remaining complete messages in the buffer
        if (buffer.trim()) {
          const lines = buffer.trim().split('\n');
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const json = JSON.parse(line);
              console.log('Processing final message:', json.type);
              messageHandler(json);
            } catch (error) {
              console.warn('Failed to parse final message:', line, error);
            }
          }
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      
      // Process complete messages (lines ending with \n)
      const lines = buffer.split('\n');
      
      // Keep the last potentially incomplete line in the buffer
      buffer = lines.pop() || '';
      
      // Process all complete lines
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          console.log('Processing streaming message:', json.type, json.data?.substring?.(0, 50) || 'no data');
          messageHandler(json);
        } catch (error) {
          console.error('Failed to parse streaming message:', line, error);
          // Continue processing other messages instead of resetting buffer
        }
      }
    }
  };

  const rewrite = (messageId: string) => {
    const index = messages.findIndex((msg) => msg.messageId === messageId);
    const message = messages[index];

    setMessages((prev) => {
      return [...prev.slice(0, messages.length > 2 ? index - 1 : 0)];
    });
    setChatHistory((prev) => {
      return [...prev.slice(0, messages.length > 2 ? index - 1 : 0)];
    });

    sendMessage(message.content, message.messageId);
  };

  useEffect(() => {
    if (isReady && initialMessage && isConfigReady) {
      sendMessage(initialMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfigReady, isReady, initialMessage]);

  // Function to check for blog exports availability
  const checkExportsAvailability = async () => {
    if (!chatId && !user?.id) return;
    
    try {
      const params = new URLSearchParams();
      if (chatId) params.append('chatId', chatId);
      if (user?.id) params.append('userId', user.id);
      if (!user) params.append('guestId', 'guest-session');

      const response = await fetch(`/api/blog-exports?${params}`);
      const data = await response.json();

      if (data.success) {
        setHasExports(data.exports.length > 0);
      }
    } catch (error) {
      console.error('Failed to check exports availability:', error);
    }
  };

  // Check for blog exports availability on component load
  useEffect(() => {
    if (isReady && (chatId || user?.id)) {
      checkExportsAvailability();
    }
  }, [chatId, user?.id, isReady]);

  // Listen for blog export creation events
  useEffect(() => {
    const handleBlogExportCreated = () => {
      checkExportsAvailability();
    };

    window.addEventListener('blogExportCreated', handleBlogExportCreated);
    
    return () => {
      window.removeEventListener('blogExportCreated', handleBlogExportCreated);
    };
  }, []);

  if (hasError) {
    return (
      <div className="relative">
        <div className="absolute w-full flex flex-row items-center justify-end mr-5 mt-5">
          <Link href="/settings">
            <Settings className="cursor-pointer lg:hidden" />
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <p className="dark:text-white/70 text-black/70 text-sm">
            Failed to connect to the server. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return isReady ? (
    notFound ? (
      <NextError statusCode={404} />
    ) : (
      <div>
        {messages.length > 0 ? (
          <>
            <Navbar chatId={chatId!} messages={messages} focusMode={focusMode} />
            <Chat
              loading={loading}
              messages={messages}
              sendMessage={sendMessage}
              messageAppeared={messageAppeared}
              rewrite={rewrite}
              fileIds={fileIds}
              setFileIds={setFileIds}
              files={files}
              setFiles={setFiles}
              focusMode={focusMode}
            />
            
            {/* Blog Exports Panel */}
            {showBlogExports && (
              <div className="fixed top-0 right-0 h-full w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Blog Exports</h2>
                    <button
                      onClick={() => setShowBlogExports(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <BlogExportsPanel 
                    chatId={chatId} 
                    userId={user?.id} 
                    guestId={!user ? 'guest-session' : undefined}
                    onExportsChange={setHasExports}
                  />
                </div>
              </div>
            )}
            
            {/* Blog Exports Toggle Button - Only show when there are exports */}
            {hasExports && (
              <button
                onClick={() => setShowBlogExports(!showBlogExports)}
                className="fixed bottom-24 right-6 lg:bottom-12 lg:right-8 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-40"
                title="View Blog Exports"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            )}
          </>
        ) : (
          <>
            <EmptyChat
              sendMessage={sendMessage}
              focusMode={focusMode}
              setFocusMode={setFocusMode}
              optimizationMode={optimizationMode}
              setOptimizationMode={setOptimizationMode}
              fileIds={fileIds}
              setFileIds={setFileIds}
              files={files}
              setFiles={setFiles}
            />
          </>
        )}
        
        {/* Authentication Modal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          mode={authMode}
          onModeChange={setAuthMode}
        />
      </div>
    )
  ) : (
    <div className="flex flex-row items-center justify-center min-h-screen bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <svg
            aria-hidden="true"
            className="w-12 h-12 text-gray-200 animate-spin dark:text-gray-600 fill-blue-500"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100.003 78.2051 78.1951 100.003 50.5908 100C22.9765 99.9972 0.997224 78.018 1 50.4037C1.00281 22.7993 22.8108 0.997224 50.4251 1C78.0395 1.00281 100.018 22.8108 100 50.4251ZM9.08164 50.594C9.06312 73.3997 27.7909 92.1272 50.5966 92.1457C73.4023 92.1642 92.1298 73.4365 92.1483 50.6308C92.1669 27.8251 73.4392 9.0973 50.6335 9.07878C27.8278 9.06026 9.10003 27.787 9.08164 50.594Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4037 97.8624 35.9116 96.9801 33.5533C95.1945 28.8227 92.871 24.3692 90.0681 20.348C85.6237 14.1775 79.4473 9.36872 72.0454 6.45794C64.6435 3.54717 56.3134 2.65431 48.3133 3.89319C45.869 4.27179 44.3768 6.77534 45.014 9.20079C45.6512 11.6262 48.1343 13.0956 50.5786 12.717C56.5073 11.8281 62.5542 12.5399 68.0406 14.7911C73.527 17.0422 78.2187 20.7487 81.5841 25.4923C83.7976 28.5886 85.4467 32.059 86.4416 35.7474C87.1273 38.1189 89.5423 39.6781 91.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-500 rounded-full animate-spin opacity-20"></div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium animate-pulse">
                        Initializing EscapeArtist AI...
        </p>
      </div>
    </div>
  );
};

export default ChatWindow;
