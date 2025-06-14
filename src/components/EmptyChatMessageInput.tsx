import { ArrowRight, Command } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import CopilotToggle from './MessageInputActions/Copilot';
import Focus from './MessageInputActions/Focus';
import Optimization from './MessageInputActions/Optimization';
import Attach from './MessageInputActions/Attach';
import ModelSelector from './MessageInputActions/ModelSelector';
import { File } from './ChatWindow';
import { cn } from '@/lib/utils';

const EmptyChatMessageInput = ({
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
  const [copilotEnabled, setCopilotEnabled] = useState(false);
  const [message, setMessage] = useState('');

  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;

      const isInputFocused =
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.hasAttribute('contenteditable');

      if (e.key === '/' && !isInputFocused) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    inputRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        sendMessage(message);
        setMessage('');
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage(message);
          setMessage('');
        }
      }}
      className="w-full relative"
    >
      <div className="flex flex-col bg-light-secondary dark:bg-dark-secondary px-5 pt-5 pb-2 rounded-xl w-full border border-light-200 dark:border-dark-200 shadow-sm hover:shadow-md transition-all duration-300 ease-in-out">
        <div className="relative">
          <TextareaAutosize
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            minRows={2}
            className="bg-transparent placeholder:text-black/50 dark:placeholder:text-white/50 text-sm text-black dark:text-white resize-none focus:outline-none w-full max-h-24 lg:max-h-36 xl:max-h-48"
            placeholder="Ask me anything... I'm here to help! Press / to focus"
          />
          <div className="absolute right-0 top-0 flex items-center space-x-1 text-xs text-black/40 dark:text-white/40 pointer-events-none">
            <Command size={12} />
            <span>/</span>
          </div>
        </div>
        <div className="flex flex-row items-center justify-between mt-4">
          <div className="flex flex-row items-center space-x-2 lg:space-x-4">
            <div className="flex items-center gap-2">
              <Focus focusMode={focusMode} setFocusMode={setFocusMode} />
              <Attach
                fileIds={fileIds}
                setFileIds={setFileIds}
                files={files}
                setFiles={setFiles}
                showText
              />
              <ModelSelector />
            </div>
          </div>
          <div className="flex flex-row items-center space-x-1 sm:space-x-4">
            <Optimization
              optimizationMode={optimizationMode}
              setOptimizationMode={setOptimizationMode}
            />
            <button
              disabled={message.trim().length === 0}
              className={cn(
                "bg-[#24A0ED] text-white disabled:text-black/50 dark:disabled:text-white/50 disabled:bg-[#e0e0dc] dark:disabled:bg-[#ececec21] hover:bg-opacity-85 transition-all duration-300 ease-in-out rounded-full p-2",
                message.trim().length > 0 && "hover:scale-105 hover:shadow-md"
              )}
            >
              <ArrowRight className="bg-background" size={17} />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default EmptyChatMessageInput;
