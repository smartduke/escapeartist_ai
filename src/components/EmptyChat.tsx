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
    <div className="relative min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-blue-50/20 dark:from-gray-900 dark:via-gray-900/95 dark:to-blue-900/10">
      <div className="absolute w-full flex flex-row items-center justify-end px-6 lg:px-8 pt-6 lg:pt-8">
        <Link href="/settings" className="ml-4">
          <Settings className="cursor-pointer lg:hidden text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200" />
        </Link>
      </div>
      <div className="flex flex-col items-center min-h-screen max-w-screen-lg mx-auto p-6 lg:p-8 pt-32 lg:pt-40">
        <div className="flex flex-col w-full space-y-6 lg:space-y-8">
          {/* Enhanced Greeting Section */}
          <div className={`space-y-5 max-w-4xl mx-auto ${currentTemplate && currentTemplate.greeting ? 'text-left' : 'text-center'}`}>
            {/* Template Icon - only show for selected templates */}
            {currentTemplate && currentTemplate.icon && currentTemplate.greeting && (
              <div className="flex items-center justify-start mb-6">
                <div className="text-gray-700 dark:text-gray-300 text-xl p-3 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 shadow-sm">
                  {React.cloneElement(currentTemplate.icon as React.ReactElement, { size: 24 })}
                </div>
              </div>
            )}
            
            {/* Main Greeting */}
            <div className="space-y-4">
              <h1 className="text-gray-900 dark:text-white text-2xl lg:text-3xl xl:text-4xl font-medium tracking-tight leading-tight">
                {currentTemplate && currentTemplate.greeting ? currentTemplate.greeting : (
                  <>
                    Search{' '}
                    <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 dark:from-blue-400 dark:via-purple-400 dark:to-blue-500 bg-clip-text text-transparent">
                      Smarter
                    </span>
                  </>
                )}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-base lg:text-lg leading-relaxed max-w-3xl mx-auto font-medium">
                {currentTemplate && currentTemplate.subtitle ? currentTemplate.subtitle : (
                  <>
                    Search • Discover • Create
                  </>
                )}
              </p>
            </div>

            {/* Optional decorative element for non-template mode */}
            {!currentTemplate?.greeting && (
              <div className="flex items-center justify-center space-x-2 opacity-60 mt-6">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            )}
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
                <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/40 dark:border-gray-700/40 border-t-0 rounded-b-xl px-5 py-3 shadow-lg">
                  <div className="space-y-1">
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
                        className="group flex items-center w-full p-2.5 text-left text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20"
                      >
                        <span className="text-sm mr-3 opacity-60">🔍</span>
                        <span className="text-sm font-medium">{prompt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Recent Chats */}
          <div className="max-w-3xl mx-auto w-full">
            <RecentChats 
              focusMode={focusMode} 
              setFocusMode={setFocusMode} 
              onOpenTemplatePopup={() => focusRef.current?.openTemplatePopup()}
            />
          </div>
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
