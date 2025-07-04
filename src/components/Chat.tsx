'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import MessageInput from './MessageInput';
import { File, Message } from './ChatWindow';
import MessageBox from './MessageBox';
import MessageBoxLoading from './MessageBoxLoading';
import { UsageLimitWarning } from './UsageLimitWarning';
import { useAuth } from './auth/AuthProvider';

const Chat = ({
  loading,
  messages,
  sendMessage,
  messageAppeared,
  rewrite,
  fileIds,
  setFileIds,
  files,
  setFiles,
  focusMode = 'escapeArtistSearch',
}: {
  messages: Message[];
  sendMessage: (message: string) => void;
  loading: boolean;
  messageAppeared: boolean;
  rewrite: (messageId: string) => void;
  fileIds: string[];
  setFileIds: (fileIds: string[]) => void;
  files: File[];
  setFiles: (files: File[]) => void;
  focusMode?: string;
}) => {
  const { user } = useAuth();
  const [dividerWidth, setDividerWidth] = useState(0);
  const [showLoading, setShowLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const dividerRef = useRef<HTMLDivElement | null>(null);
  const messageEnd = useRef<HTMLDivElement | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle delayed loading display to prevent flicker
  useEffect(() => {
    if (loading && !messageAppeared) {
      // Only show loading skeleton after 200ms to prevent flicker
      loadingTimeoutRef.current = setTimeout(() => {
        setShowLoading(true);
      }, 200);
    } else {
      // Clear timeout and hide loading immediately when message appears
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      setShowLoading(false);
    }

    // Set streaming state when we have content appearing
    setIsStreaming(loading && messageAppeared);

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [loading, messageAppeared]);

  useEffect(() => {
    const updateDividerWidth = () => {
      if (dividerRef.current) {
        setDividerWidth(dividerRef.current.scrollWidth);
      }
    };

    updateDividerWidth();

    window.addEventListener('resize', updateDividerWidth);

    return () => {
      window.removeEventListener('resize', updateDividerWidth);
    };
  });

  useEffect(() => {
    const scroll = () => {
      messageEnd.current?.scrollIntoView({ behavior: 'smooth' });
    };

    if (messages.length === 1) {
      document.title = `${messages[0].content.substring(0, 30)} - EscapeArtist AI`;
    }

    if (messages[messages.length - 1]?.role == 'user') {
      scroll();
    }
  }, [messages]);

  return (
    <div className="flex flex-col space-y-6 pt-8 pb-44 lg:pb-32 sm:mx-4 md:mx-8">
      {/* Usage limit warning for authenticated users */}
      <UsageLimitWarning 
        userId={user?.id} 
        modelName="gpt_4o" // Could be dynamic based on current model selection
      />
      
      {messages.map((msg, i) => {
        const isLast = i === messages.length - 1;

        return (
          <Fragment key={msg.messageId}>
            <MessageBox
              key={i}
              message={msg}
              messageIndex={i}
              history={messages}
              loading={loading}
              dividerRef={isLast ? dividerRef : undefined}
              isLast={isLast}
              rewrite={rewrite}
              sendMessage={sendMessage}
              focusMode={focusMode}
            />
            {!isLast && msg.role === 'assistant' && (
              <div className="flex items-center justify-center my-6">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-light-secondary dark:via-dark-secondary to-transparent" />
                <div className="px-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-light-secondary dark:bg-dark-secondary"></div>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-light-secondary dark:via-dark-secondary to-transparent" />
              </div>
            )}
          </Fragment>
        );
      })}
      {showLoading && <MessageBoxLoading isStreaming={isStreaming} />}
      <div ref={messageEnd} className="h-0" />
      {dividerWidth > 0 && (
        <div
          className="bottom-24 lg:bottom-10 fixed z-40"
          style={{ width: dividerWidth }}
        >
          <MessageInput
            loading={loading}
            sendMessage={sendMessage}
            fileIds={fileIds}
            setFileIds={setFileIds}
            files={files}
            setFiles={setFiles}
          />
        </div>
      )}
    </div>
  );
};

export default Chat;
