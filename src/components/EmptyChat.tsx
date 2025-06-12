import { Settings, LogIn, Bot } from 'lucide-react';
import EmptyChatMessageInput from './EmptyChatMessageInput';
import { File } from './ChatWindow';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useState } from 'react';
import { AuthModal } from '@/components/auth/AuthModal';
import { cn } from '@/lib/utils';

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

  // Debug logging
  console.log('EmptyChat Debug:', { user, guestChatCount, maxGuestChats, authModalOpen });

  return (
    <div className="relative">
      <div className="absolute w-full flex flex-row items-center justify-end px-4 lg:px-8 pt-4 lg:pt-6">
        <Link href="/settings" className="ml-4">
          <Settings className="cursor-pointer lg:hidden text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors" />
        </Link>
      </div>
      <div className="flex flex-col items-center justify-center min-h-screen max-w-screen-lg mx-auto p-4 lg:p-8 space-y-8">
        <div className="flex flex-col items-center justify-center w-full space-y-8">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center space-x-3">
              <Bot className="text-[#24A0ED] w-6 h-6 opacity-80 stroke-[1.5]" />
              <h2 className="text-black/90 dark:text-white/90 text-3xl font-medium">
                How can I help you today?
              </h2>
            </div>
            <p className="text-black/50 dark:text-white/50 text-base">
              Ask anything - from quick answers to in-depth research
            </p>
          </div>
          <div className="w-full max-w-3xl mx-auto">
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
