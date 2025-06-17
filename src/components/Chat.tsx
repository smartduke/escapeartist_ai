'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import MessageInput from './MessageInput';
import { File, Message } from './ChatWindow';
import MessageBox from './MessageBox';
import MessageBoxLoading from './MessageBoxLoading';

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
  onMessageUpdate,
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
  onMessageUpdate?: (messageId: string, newContent: string) => void;
}) => {
  const [dividerWidth, setDividerWidth] = useState(0);
  const dividerRef = useRef<HTMLDivElement | null>(null);
  const messageEnd = useRef<HTMLDivElement | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  const handleEditStart = (messageId: string) => {
    setEditingMessageId(messageId);
  };

  const handleEditEnd = () => {
    setEditingMessageId(null);
  };

  const handleMessageUpdateWithEditEnd = (messageId: string, newContent: string) => {
    if (onMessageUpdate) {
      onMessageUpdate(messageId, newContent);
    }
    setEditingMessageId(null);
  };

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
      document.title = `${messages[0].content.substring(0, 30)} - Perplexica`;
    }

    if (messages[messages.length - 1]?.role == 'user') {
      scroll();
    }
  }, [messages]);

  return (
    <div className="flex flex-col space-y-6 pt-8 pb-44 lg:pb-32 sm:mx-4 md:mx-8">
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
              onMessageUpdate={handleMessageUpdateWithEditEnd}
              isEditing={editingMessageId === msg.messageId}
              onEditStart={() => handleEditStart(msg.messageId)}
              onEditEnd={handleEditEnd}
            />
            {!isLast && msg.role === 'assistant' && (
              <div className="h-px w-full bg-light-secondary dark:bg-dark-secondary" />
            )}
          </Fragment>
        );
      })}
      {loading && !messageAppeared && <MessageBoxLoading />}
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
