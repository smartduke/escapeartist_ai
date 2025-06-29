import { cn } from '@/lib/utils';
import { ArrowUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import ModelSelector from './MessageInputActions/ModelSelector';
import VoiceInput from './MessageInputActions/VoiceInput';
import { File } from './ChatWindow';

const MessageInput = ({
  sendMessage,
  loading,
  fileIds,
  setFileIds,
  files,
  setFiles,
}: {
  sendMessage: (message: string) => void;
  loading: boolean;
  fileIds: string[];
  setFileIds: (fileIds: string[]) => void;
  files: File[];
  setFiles: (files: File[]) => void;
}) => {
  const [message, setMessage] = useState('');
  const [textareaRows, setTextareaRows] = useState(1);
  const [mode, setMode] = useState<'multi' | 'single'>('single');

  const handleVoiceTranscript = (transcript: string) => {
    setMessage(prev => prev + (prev ? ' ' : '') + transcript);
  };

  useEffect(() => {
    if (textareaRows >= 2 && message && mode === 'single') {
      setMode('multi');
    } else if (!message && mode === 'multi') {
      setMode('single');
    }
  }, [textareaRows, mode, message]);

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

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <form
      onSubmit={(e) => {
        if (loading) return;
        e.preventDefault();
        sendMessage(message);
        setMessage('');
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey && !loading) {
          e.preventDefault();
          sendMessage(message);
          setMessage('');
        }
      }}
      className={cn(
        'bg-white/95 dark:bg-gray-900/90 backdrop-blur-2xl p-3 flex items-center overflow-hidden border border-gray-200/30 dark:border-gray-700/30 shadow-lg hover:shadow-xl transition-all duration-500 ease-in-out',
        mode === 'multi' ? 'flex-col rounded-2xl space-y-3' : 'flex-row rounded-full'
      )}
    >
      <TextareaAutosize
        ref={inputRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onHeightChange={(height, props) => {
          setTextareaRows(Math.ceil(height / props.rowHeight));
        }}
        className="transition bg-transparent dark:placeholder:text-gray-400/80 placeholder:text-gray-500/80 placeholder:text-sm text-base dark:text-white resize-none focus:outline-none w-full px-3 max-h-24 lg:max-h-36 xl:max-h-48 flex-grow flex-shrink"
        placeholder="Ask a follow-up question..."
      />
      {mode === 'single' && (
        <div className="flex flex-row items-center space-x-2.5">
          <div className="min-w-[40px]">
            <ModelSelector />
          </div>
          <VoiceInput onTranscript={handleVoiceTranscript} isDisabled={loading} />
          <button
            disabled={message.trim().length === 0 || loading}
            className={cn(
              "bg-gradient-to-r from-blue-600 to-indigo-600 text-white disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-700 dark:disabled:to-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-all duration-500 ease-in-out rounded-full p-2.5 shadow-md",
              !loading && message.trim().length > 0 && "hover:from-blue-700 hover:to-indigo-700 hover:scale-105 hover:shadow-lg active:scale-95"
            )}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      )}
      {mode === 'multi' && (
        <div className="flex flex-row items-center justify-between w-full pt-2 border-t border-gray-200/40 dark:border-gray-700/40">
          <div className="flex flex-row items-center space-x-2.5">
            <div className="min-w-[40px]">
              <ModelSelector />
            </div>
            <VoiceInput onTranscript={handleVoiceTranscript} isDisabled={loading} />
          </div>
          <button
            disabled={message.trim().length === 0 || loading}
            className={cn(
              "bg-gradient-to-r from-blue-600 to-indigo-600 text-white disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-700 dark:disabled:to-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 transition-all duration-500 ease-in-out rounded-xl px-4 py-2 shadow-md flex items-center gap-2 text-sm font-medium",
              !loading && message.trim().length > 0 && "hover:from-blue-700 hover:to-indigo-700 hover:scale-105 hover:shadow-lg active:scale-95"
            )}
          >
            Send
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      )}
    </form>
  );
};

export default MessageInput;
