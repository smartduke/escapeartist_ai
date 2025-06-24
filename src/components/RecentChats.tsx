import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { formatTimeDifference } from '@/lib/utils';
import { Clock, MessageSquare, Sparkles, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { allTemplates } from './MessageInputActions/Focus';

export interface Chat {
  id: string;
  title: string;
  createdAt: string;
  focusMode: string;
}

interface RecentChatsProps {
  focusMode: string;
  setFocusMode?: (mode: string) => void;
  onOpenTemplatePopup?: () => void;
}

const RecentChats: React.FC<RecentChatsProps> = ({ focusMode, setFocusMode, onOpenTemplatePopup }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, guestId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);

      const queryParams = new URLSearchParams();
      if (user?.id) {
        queryParams.append('userId', user.id);
      } else if (guestId) {
        queryParams.append('guestId', guestId);
      }

      try {
        const res = await fetch(`/api/chats?${queryParams.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await res.json();
        
        // Filter chats by focusMode and get latest 2
        let filteredChats = data.chats || [];
        
        // If focusMode is 'webSearch' (All Sources), show all chats
        // Otherwise, filter by the specific focusMode
        if (focusMode !== 'webSearch') {
          filteredChats = filteredChats.filter((chat: Chat) => chat.focusMode === focusMode);
        }
        
        // Get latest 2 chats
        const recentChats = filteredChats.slice(0, 2);
        setChats(recentChats);
      } catch (error) {
        console.error('Error fetching chats:', error);
        setChats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [user, guestId, focusMode]);

  const handleTemplateSelect = (templateKey: string) => {
    // Update local state
    setFocusMode?.(templateKey);
    
    // Update URL to trigger proper state change
    const templateParam = templateKey !== 'webSearch' ? `?template=${templateKey}` : '';
    router.push(`/${templateParam}`);
  };

  // Define popular templates to show when All Sources is selected
  const popularTemplates = [
    allTemplates.find(t => t.key === 'newsSearch'),
    allTemplates.find(t => t.key === 'academicSearch'),
    allTemplates.find(t => t.key === 'shoppingSearch'),
    allTemplates.find(t => t.key === 'codingSearch'),
    allTemplates.find(t => t.key === 'travelSearch'),
    allTemplates.find(t => t.key === 'financeSearch'),
    allTemplates.find(t => t.key === 'medicalSearch'),
    allTemplates.find(t => t.key === 'jobSearch'),
    allTemplates.find(t => t.key === 'writingAssistant'),
  ].filter(Boolean);

  // Show popular templates when All Sources is selected
  if (focusMode === 'webSearch') {
    return (
      <div className="w-full max-w-3xl mx-auto mt-4">        
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {popularTemplates.map((template) => template && (
            <button
              key={template.key}
              onClick={() => handleTemplateSelect(template.key)}
              className="group flex flex-col items-center gap-2 p-3 bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900/95 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 text-center"
            >
              <div className="text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors p-1.5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                {React.cloneElement(template.icon as React.ReactElement, { 
                  size: 18, 
                  className: "stroke-[1.5]" 
                })}
              </div>
              <p className="text-xs font-semibold text-gray-900 dark:text-white text-center leading-tight">
                {template.title}
              </p>
            </button>
          ))}
          
          {/* More button */}
          <button
            onClick={() => onOpenTemplatePopup?.()}
            className="group flex flex-col items-center gap-2 p-3 bg-white/60 dark:bg-gray-900/60 hover:bg-white dark:hover:bg-gray-900/80 backdrop-blur-sm border border-dashed border-gray-300/60 dark:border-gray-600/60 hover:border-gray-400 dark:hover:border-gray-500 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 text-center"
          >
            <div className="text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors p-1.5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-lg">
              <Plus size={18} className="stroke-[1.5]" />
            </div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-center leading-tight">
              More
            </p>
          </button>
        </div>
      </div>
    );
  }

  // Don't render if loading or no chats for other templates
  if (loading || chats.length === 0) {
    return null;
  }

  // Get current template info
  const currentTemplate = allTemplates.find(template => template.key === focusMode);
  const templateName = currentTemplate?.title || 'All Sources';

  return (
    <div className="w-full max-w-3xl mx-auto mt-6">
      <div className="flex items-center gap-2 mb-4 px-1">
        <MessageSquare size={16} className="text-gray-600 dark:text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Recent {templateName} chats
        </h3>
      </div>
      
      <div className="space-y-2">
        {chats.map((chat) => (
          <Link
            key={chat.id}
            href={`/c/${chat.id}${chat.focusMode !== 'webSearch' ? `?template=${chat.focusMode}` : ''}`}
            className="group block"
          >
            <div className="flex items-center justify-between p-3 bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900/95 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 rounded-xl transition-all duration-300 hover:shadow-lg">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {(() => {
                  // Get the template for this specific chat
                  const chatTemplate = allTemplates.find(template => template.key === chat.focusMode);
                  return chatTemplate && (
                    <div className="flex-shrink-0 text-blue-600 dark:text-blue-400 p-1.5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                      {React.cloneElement(chatTemplate.icon as React.ReactElement, { 
                        size: 16, 
                        className: "stroke-[1.5]" 
                      })}
                    </div>
                  );
                })()}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {chat.title}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 bg-gray-50/80 dark:bg-gray-800/80 px-2.5 py-1 rounded-lg">
                <Clock size={12} />
                <span className="font-medium">{formatTimeDifference(new Date(), new Date(chat.createdAt))} ago</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecentChats; 