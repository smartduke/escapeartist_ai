import { Settings, LogIn } from 'lucide-react';
import EmptyChatMessageInput from './EmptyChatMessageInput';
import { File } from './ChatWindow';
import Link from 'next/link';
import WeatherWidget from './WeatherWidget';
import NewsArticleWidget from './NewsArticleWidget';
import { useAuth } from '@/components/auth/AuthProvider';
import { useState } from 'react';
import { AuthModal } from '@/components/auth/AuthModal';

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
      <div className="absolute w-full flex flex-row items-center justify-end mr-5 mt-5 space-x-2">
        {!user && (
          <button
            onClick={() => {
              console.log('Sign In button clicked!');
              setAuthMode('login');
              setAuthModalOpen(true);
              console.log('Modal should open now');
            }}
            className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
          >
            <LogIn size={16} />
            <span>Sign In</span>
          </button>
        )}
        <Link href="/settings">
          <Settings className="cursor-pointer lg:hidden" />
        </Link>
      </div>
      <div className="flex flex-col items-center justify-center min-h-screen max-w-screen-sm mx-auto p-2 space-y-4">
        <div className="flex flex-col items-center justify-center w-full space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-black/70 dark:text-white/70 text-3xl font-medium -mt-8">
              Research begins here.
            </h2>
            {!user && (
              <p className="text-black/50 dark:text-white/50 text-sm">
                Guest users get {maxGuestChats} free chats. {guestChatCount > 0 && `You have ${maxGuestChats - guestChatCount} remaining.`}
                <br />
                <button
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthModalOpen(true);
                  }}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                >
                  Sign up for unlimited chats
                </button>
              </p>
            )}
          </div>
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
        <div className="flex flex-col w-full gap-4 mt-2 sm:flex-row sm:justify-center">
          <div className="flex-1 max-w-xs">
            <WeatherWidget />
          </div>
          <div className="flex-1 max-w-xs">
            <NewsArticleWidget />
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
