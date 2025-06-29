import { ArrowRight, Command } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import Optimization from './MessageInputActions/Optimization';
import ModelSelector from './MessageInputActions/ModelSelector';
import VoiceInput from './MessageInputActions/VoiceInput';
import { File } from './ChatWindow';
import { cn } from '@/lib/utils';

const EmptyChatMessageInput = ({
  sendMessage,
  optimizationMode,
  setOptimizationMode,
  fileIds,
  setFileIds,
  files,
  setFiles,
  onFocusChange,
  onTextareaRef,
}: {
  sendMessage: (message: string) => void;
  optimizationMode: string;
  setOptimizationMode: (mode: string) => void;
  fileIds: string[];
  setFileIds: (fileIds: string[]) => void;
  files: File[];
  setFiles: (files: File[]) => void;
  onFocusChange?: (focused: boolean) => void;
  onTextareaRef?: (ref: HTMLTextAreaElement | null) => void;
}) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const handleVoiceTranscript = (transcript: string) => {
    setMessage(prev => prev + (prev ? ' ' : '') + transcript);
  };

  // Generate placeholder text for Escape Artist mode
  const getPlaceholderText = () => {
    return 'Ask about offshore strategies, expat living, tax optimization... Press / to focus';
  };

  // Callback ref to handle both internal ref and parent callback
  const setInputRef = (element: HTMLTextAreaElement | null) => {
    inputRef.current = element;
    if (onTextareaRef) {
      onTextareaRef(element);
    }
  };

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
      <div className="flex flex-col bg-white/95 dark:bg-gray-900/90 backdrop-blur-2xl px-6 pt-6 pb-4 w-full border border-gray-200/30 dark:border-gray-700/30 shadow-lg hover:shadow-xl transition-all duration-500 ease-in-out group hover:bg-white dark:hover:bg-gray-900/95 rounded-2xl">
        <div className="relative">
          <TextareaAutosize
            ref={setInputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onFocus={() => onFocusChange?.(true)}
            onBlur={() => onFocusChange?.(false)}
            minRows={2}
            className="bg-transparent placeholder:text-gray-500/80 dark:placeholder:text-gray-400/80 text-base text-gray-900 dark:text-white resize-none focus:outline-none w-full max-h-24 lg:max-h-36 xl:max-h-48 leading-relaxed"
            placeholder={getPlaceholderText()}
          />
          <div className="absolute right-0 top-0 flex items-center space-x-1.5 text-xs text-gray-400/80 dark:text-gray-500/80 pointer-events-none bg-gradient-to-l from-white/90 to-transparent dark:from-gray-900/90 pl-4">
            <Command size={13} className="opacity-70" />
            <span className="font-medium">/</span>
          </div>
        </div>
        <div className="flex flex-row items-center justify-between mt-4 pt-3 border-t border-gray-200/40 dark:border-gray-700/40">
          <div className="flex flex-row items-center space-x-2 lg:space-x-4">
            <Optimization
              optimizationMode={optimizationMode}
              setOptimizationMode={setOptimizationMode}
            />
          </div>
          <div className="flex flex-row items-center space-x-2 sm:space-x-4">
            <ModelSelector />
            <VoiceInput onTranscript={handleVoiceTranscript} />
            <button
              disabled={message.trim().length === 0}
              className={cn(
                "bg-gradient-to-r from-blue-600 to-indigo-600 text-white disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-700 dark:disabled:to-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-all duration-500 ease-in-out rounded-xl px-4 py-2.5 shadow-md flex items-center gap-2 text-sm font-medium",
                message.trim().length > 0 && "hover:from-blue-700 hover:to-indigo-700 hover:scale-105 hover:shadow-lg active:scale-95"
              )}
            >
              Send
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default EmptyChatMessageInput;
