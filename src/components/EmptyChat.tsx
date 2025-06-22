import React from 'react';
import { Settings } from 'lucide-react';
import EmptyChatMessageInput from './EmptyChatMessageInput';
import { File } from './ChatWindow';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useState, useEffect, useRef } from 'react';
import { AuthModal } from '@/components/auth/AuthModal';
import RecentChats from './RecentChats';

import { allTemplates, FocusRef } from './MessageInputActions/Focus';

const EmptyChat = ({
  sendMessage,
  focusMode,
  setFocusMode,
  optimizationMode,
  setOptimizationMode,
  fileIds,
  setFileIds,
  files,
  setFiles,
}: {
  sendMessage: (message: string) => void;
  focusMode: string;
  setFocusMode: (mode: string) => void;
  optimizationMode: string;
  setOptimizationMode: (mode: string) => void;
  fileIds: string[];
  setFileIds: (fileIds: string[]) => void;
  files: File[];
  setFiles: (files: File[]) => void;
}) => {
  const { user, guestChatCount, maxGuestChats } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);
  const [isClickingPrompt, setIsClickingPrompt] = useState(false);
  const focusRef = useRef<FocusRef | null>(null);

  // Find current template data
  const currentTemplate = allTemplates.find(template => template.key === focusMode);
  
  // Debug logging
  console.log('Current template:', currentTemplate?.key);
  console.log('Has quick prompts:', !!currentTemplate?.quickPrompts);
  console.log('Textarea focused:', isTextareaFocused);
  console.log('Should show prompts:', !!(currentTemplate && currentTemplate.quickPrompts && isTextareaFocused));





  return (
    <div className="relative">
      <div className="absolute w-full flex flex-row items-center justify-end px-4 lg:px-8 pt-4 lg:pt-6">
        <Link href="/settings" className="ml-4">
          <Settings className="cursor-pointer lg:hidden text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors" />
        </Link>
      </div>
      <div className="flex flex-col items-center min-h-screen max-w-screen-lg mx-auto p-4 lg:p-8 pt-32 lg:pt-40">
        <div className="flex flex-col w-full space-y-6 lg:space-y-8">
          <div className={`space-y-4 max-w-3xl mx-auto ${currentTemplate && currentTemplate.greeting ? 'text-left' : 'text-center'}`}>
            {/* Template Icon - only show for selected templates */}
            {currentTemplate && currentTemplate.icon && currentTemplate.greeting && (
              <div className="flex items-center justify-start">
                <div className="text-black/70 dark:text-white/70 text-2xl">
                  {React.cloneElement(currentTemplate.icon as React.ReactElement, { size: 24 })}
                </div>
              </div>
            )}
            
            <h1 className="text-black dark:text-white text-2xl lg:text-3xl font-medium">
              {currentTemplate && currentTemplate.greeting ? currentTemplate.greeting : 'How can I help you today?'}
            </h1>
            <p className="text-black/60 dark:text-white/60 text-lg">
              {currentTemplate && currentTemplate.subtitle ? currentTemplate.subtitle : 'Ask anything - from quick answers to in-depth research'}
            </p>
          </div>
          
          <div className="w-full max-w-3xl mx-auto relative">
            <EmptyChatMessageInput
              sendMessage={sendMessage}
              focusMode={focusMode}
              setFocusMode={setFocusMode}
              optimizationMode={optimizationMode}
              setOptimizationMode={setOptimizationMode}
              fileIds={fileIds}
              setFileIds={setFileIds}
              files={files}
              setFiles={setFiles}
              onFocusChange={(focused) => {
                if (!focused && isClickingPrompt) {
                  // Don't hide prompts if we're in the middle of clicking one
                  return;
                }
                setIsTextareaFocused(focused);
              }}
              onTextareaRef={setTextareaRef}
              onFocusRef={(ref) => { focusRef.current = ref; }}
              showQuickPrompts={currentTemplate && currentTemplate.quickPrompts && isTextareaFocused}
            />

            {/* Quick Prompts - Extension of textarea like in screenshot */}
            {currentTemplate && currentTemplate.quickPrompts && isTextareaFocused && (
              <div className="absolute top-full left-0 right-0 z-10 transition-all duration-200"
                   onMouseEnter={() => console.log('Mouse entered quick prompts area')}>
                <div className="bg-light-secondary dark:bg-dark-secondary border border-light-200 dark:border-dark-200 border-t-0 rounded-b-xl px-5 py-3 shadow-sm">
                  <div className="space-y-2">
                    {currentTemplate.quickPrompts.map((prompt: string, index: number) => (
                      <button
                        key={index}
                        onMouseDown={() => {
                          setIsClickingPrompt(true);
                        }}
                        onMouseUp={() => {
                          setIsClickingPrompt(false);
                        }}
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Quick prompt clicked:', prompt);
                          console.log('sendMessage function:', sendMessage);
                          console.log('About to call sendMessage...');
                          try {
                            await sendMessage(prompt);
                            console.log('sendMessage completed successfully');
                          } catch (error) {
                            console.error('Error calling sendMessage:', error);
                          }
                          setIsTextareaFocused(false); // Hide prompts after sending
                        }}
                        className="group flex items-center w-full p-2 text-left text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors duration-200 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        <span className="text-sm mr-3">🔍</span>
                        <span className="text-sm">{prompt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Recent Chats */}
          <RecentChats 
            focusMode={focusMode} 
            setFocusMode={setFocusMode} 
            onOpenTemplatePopup={() => focusRef.current?.openTemplatePopup()}
          />
        </div>
      </div>
      
      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
};

export default EmptyChat;
