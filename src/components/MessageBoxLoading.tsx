import { Sparkles } from 'lucide-react';

const MessageBoxLoading = () => {
  return (
    <div className="w-full">
      <div className="flex flex-col space-y-4 w-full lg:w-9/12">
        {/* Simple loading header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            <Sparkles size={12} className="text-white animate-pulse" />
          </div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">AI is thinking...</span>
        </div>
        
        {/* Simple loading lines with wave animation */}
        <div className="flex flex-col space-y-3">
          <div className="h-2 rounded-full w-full bg-gradient-to-r from-light-secondary via-gray-300 dark:via-gray-600 to-light-secondary dark:from-dark-secondary dark:to-dark-secondary animate-wave" 
               style={{ 
                 backgroundSize: '200% 100%',
                 animationDelay: '0s'
               }} />
          <div className="h-2 rounded-full w-4/5 bg-gradient-to-r from-light-secondary via-gray-300 dark:via-gray-600 to-light-secondary dark:from-dark-secondary dark:to-dark-secondary animate-wave" 
               style={{ 
                 backgroundSize: '200% 100%',
                 animationDelay: '0.2s'
               }} />
          <div className="h-2 rounded-full w-5/6 bg-gradient-to-r from-light-secondary via-gray-300 dark:via-gray-600 to-light-secondary dark:from-dark-secondary dark:to-dark-secondary animate-wave" 
               style={{ 
                 backgroundSize: '200% 100%',
                 animationDelay: '0.4s'
               }} />
        </div>
      </div>
    </div>
  );
};

export default MessageBoxLoading;
