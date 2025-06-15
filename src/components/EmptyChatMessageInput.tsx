import { ArrowRight, Command } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import CopilotToggle from './MessageInputActions/Copilot';
import Focus, { allTemplates } from './MessageInputActions/Focus';
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
  onFocusChange,
  onTextareaRef,
  showQuickPrompts,
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
  onFocusChange?: (focused: boolean) => void;
  onTextareaRef?: (ref: HTMLTextAreaElement | null) => void;
  showQuickPrompts?: boolean;
}) => {
  const [copilotEnabled, setCopilotEnabled] = useState(false);
  const [message, setMessage] = useState('');

  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Generate dynamic placeholder text based on selected agent
  const getPlaceholderText = () => {
    const currentTemplate = allTemplates.find(template => template.key === focusMode);
    
    if (!currentTemplate || focusMode === 'webSearch') {
      return 'Ask me anything... I\'m here to help! Press / to focus';
    }

    // Create agent-specific placeholder texts
    const placeholderMap: { [key: string]: string } = {
      newsSearch: 'Ask anything about current news and events...',
      academicSearch: 'Ask anything about academic research and papers...',
      medicalSearch: 'Ask anything about health and medical information...',
      legalSearch: 'Ask anything about legal topics and guidance...',
      financeSearch: 'Ask anything about finance and market analysis...',
      jobSearch: 'Ask anything about careers and job searching...',
      realEstateSearch: 'Ask anything about real estate and property...',
      shoppingSearch: 'Ask anything about products and shopping...',
      travelSearch: 'Ask anything about travel and destinations...',
      recipeSearch: 'Ask anything about cooking and recipes...',
      writingAssistant: 'Ask anything about writing and content creation...',
      wolframAlphaSearch: 'Ask anything about math, science, and calculations...',
      youtubeSearch: 'Ask anything about YouTube videos and content...',
      redditSearch: 'Ask anything about Reddit discussions and opinions...'
    };

    return placeholderMap[focusMode] || 'Ask me anything... I\'m here to help! Press / to focus';
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
      <div className={cn(
        "flex flex-col bg-light-secondary dark:bg-dark-secondary px-5 pt-5 pb-2 w-full border border-light-200 dark:border-dark-200 shadow-sm hover:shadow-md transition-all duration-300 ease-in-out",
        showQuickPrompts ? "rounded-t-xl" : "rounded-xl"
      )}>
        <div className="relative">
          <TextareaAutosize
            ref={setInputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onFocus={() => onFocusChange?.(true)}
            onBlur={() => onFocusChange?.(false)}
            minRows={2}
            className="bg-transparent placeholder:text-black/50 dark:placeholder:text-white/50 text-sm text-black dark:text-white resize-none focus:outline-none w-full max-h-24 lg:max-h-36 xl:max-h-48"
            placeholder={getPlaceholderText()}
          />
          <div className="absolute right-0 top-0 flex items-center space-x-1 text-xs text-black/40 dark:text-white/40 pointer-events-none">
            <Command size={12} />
            <span>/</span>
          </div>
        </div>
        <div className="flex flex-row items-center justify-between mt-4">
          <div className="flex flex-row items-center space-x-2 lg:space-x-4">
            <div className="flex items-center gap-2">
              <Focus
                focusMode={focusMode}
                setFocusMode={setFocusMode}
                onTemplateSelect={() => {
                  // Use requestAnimationFrame to ensure DOM is updated
                  requestAnimationFrame(() => {
                    if (inputRef.current) {
                      inputRef.current.focus();
                    }
                  });
                }}
              />
              <Optimization
                optimizationMode={optimizationMode}
                setOptimizationMode={setOptimizationMode}
              />
            </div>
          </div>
          <div className="flex flex-row items-center space-x-1 sm:space-x-4">
            <Attach
              fileIds={fileIds}
              setFileIds={setFileIds}
              files={files}
              setFiles={setFiles}
            />
            <ModelSelector />
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
