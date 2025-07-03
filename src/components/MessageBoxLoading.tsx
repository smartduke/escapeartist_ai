import { Sparkles } from 'lucide-react';

const MessageBoxLoading = ({ isStreaming = false }: { isStreaming?: boolean }) => {
  return (
    <div className="w-full">
      <div className="flex flex-col space-y-4 w-full lg:w-9/12">
        {/* Adaptive loading header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            <Sparkles size={12} className="text-white animate-pulse" />
          </div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {isStreaming ? 'AI is responding...' : 'AI is thinking...'}
          </span>
        </div>
        
        {/* Enhanced loading animation */}
        <div className="flex flex-col space-y-3">
          {/* Primary loading bar with smoother animation */}
          <div className="h-2 rounded-full w-full bg-gradient-to-r from-light-secondary via-blue-200 dark:via-blue-600 to-light-secondary dark:from-dark-secondary dark:to-dark-secondary" 
               style={{ 
                 backgroundSize: '200% 100%',
                 animation: 'wave 2s ease-in-out infinite',
                 animationDelay: '0s'
               }} />
          
          {/* Secondary bars with varied timing */}
          <div className="h-2 rounded-full w-4/5 bg-gradient-to-r from-light-secondary via-blue-200 dark:via-blue-600 to-light-secondary dark:from-dark-secondary dark:to-dark-secondary" 
               style={{ 
                 backgroundSize: '200% 100%',
                 animation: 'wave 2s ease-in-out infinite',
                 animationDelay: '0.3s'
               }} />
          
          <div className="h-2 rounded-full w-5/6 bg-gradient-to-r from-light-secondary via-blue-200 dark:via-blue-600 to-light-secondary dark:from-dark-secondary dark:to-dark-secondary" 
               style={{ 
                 backgroundSize: '200% 100%',
                 animation: 'wave 2s ease-in-out infinite',
                 animationDelay: '0.6s'
               }} />
               
          {/* Typing dots animation when streaming */}
          {isStreaming && (
            <div className="flex items-center space-x-1 mt-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBoxLoading;
