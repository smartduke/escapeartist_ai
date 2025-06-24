import { ArrowRight, Command } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import Focus, { allTemplates, FocusRef } from './MessageInputActions/Focus';
import Optimization from './MessageInputActions/Optimization';
import Attach from './MessageInputActions/Attach';
import ModelSelector from './MessageInputActions/ModelSelector';
import VoiceInput from './MessageInputActions/VoiceInput';
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
  onFocusRef,
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
  onFocusRef?: (ref: FocusRef | null) => void;
}) => {
  const [message, setMessage] = useState('');

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const focusRef = useRef<FocusRef | null>(null);

  const handleVoiceTranscript = (transcript: string) => {
    setMessage(prev => prev + (prev ? ' ' : '') + transcript);
  };

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

  // Callback ref for Focus component
  const setFocusRef = (element: FocusRef | null) => {
    focusRef.current = element;
    if (onFocusRef) {
      onFocusRef(element);
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
      <div className={cn(
        "flex flex-col bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl px-5 pt-5 pb-3 w-full border border-gray-200/40 dark:border-gray-700/40 shadow-md hover:shadow-lg transition-all duration-300 ease-in-out group",
        "hover:bg-white dark:hover:bg-gray-900/98",
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
            className="bg-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400 text-sm text-gray-900 dark:text-white resize-none focus:outline-none w-full max-h-24 lg:max-h-36 xl:max-h-48 leading-relaxed"
            placeholder={getPlaceholderText()}
          />
          <div className="absolute right-0 top-0 flex items-center space-x-1 text-xs text-gray-400 dark:text-gray-500 pointer-events-none bg-gradient-to-l from-white/80 to-transparent dark:from-gray-900/80 pl-3">
            <Command size={12} className="opacity-60" />
            <span className="font-medium">/</span>
          </div>
        </div>
        <div className="flex flex-row items-center justify-between mt-4 pt-1 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex flex-row items-center space-x-2 lg:space-x-4">
            <div className="flex items-center gap-2">
              <Focus
                ref={setFocusRef}
                focusMode={focusMode}
                setFocusMode={setFocusMode}
              />
              <Optimization
                optimizationMode={optimizationMode}
                setOptimizationMode={setOptimizationMode}
              />
            </div>
          </div>
          <div className="flex flex-row items-center space-x-1 sm:space-x-3">
            <Attach
              fileIds={fileIds}
              setFileIds={setFileIds}
              files={files}
              setFiles={setFiles}
            />
            <ModelSelector />
            <VoiceInput onTranscript={handleVoiceTranscript} />
            <button
              disabled={message.trim().length === 0}
              className={cn(
                "bg-gradient-to-r from-blue-500 to-blue-600 text-white disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-600 dark:disabled:to-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-all duration-300 ease-in-out rounded-xl p-2 shadow-md",
                message.trim().length > 0 && "hover:from-blue-600 hover:to-blue-700 hover:scale-105 hover:shadow-lg active:scale-95"
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
