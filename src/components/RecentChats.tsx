import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { formatTimeDifference } from '@/lib/utils';
import { Clock, MessageSquare, Sparkles, Plus } from 'lucide-react';
import Link from 'next/link';
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
      <div className="w-full max-w-3xl mx-auto mt-12">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Sparkles size={16} className="text-black/60 dark:text-white/60" />
          <h3 className="text-sm font-medium text-black/70 dark:text-white/70">
            Popular templates
          </h3>
        </div>
        
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {popularTemplates.map((template) => template && (
            <button
              key={template.key}
              onClick={() => setFocusMode?.(template.key)}
              className="group flex flex-col items-center gap-2 p-3 bg-light-secondary/50 dark:bg-dark-secondary/50 hover:bg-light-secondary dark:hover:bg-dark-secondary border border-light-200/50 dark:border-dark-200/50 hover:border-light-200 dark:hover:border-dark-200 rounded-lg transition-all duration-200 hover:shadow-sm text-center"
            >
              <div className="text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                {React.cloneElement(template.icon as React.ReactElement, { 
                  size: 20, 
                  className: "stroke-[1.5]" 
                })}
              </div>
              <p className="text-xs font-medium text-black dark:text-white text-center leading-tight">
                {template.title}
              </p>
            </button>
          ))}
          
          {/* More button */}
          <button
            onClick={() => onOpenTemplatePopup?.()}
            className="group flex flex-col items-center gap-2 p-3 bg-light-secondary/30 dark:bg-dark-secondary/30 hover:bg-light-secondary dark:hover:bg-dark-secondary border border-dashed border-light-200/50 dark:border-dark-200/50 hover:border-light-200 dark:hover:border-dark-200 rounded-lg transition-all duration-200 hover:shadow-sm text-center"
          >
            <div className="text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              <Plus size={20} className="stroke-[1.5]" />
            </div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-center leading-tight">
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
      <div className="flex items-center gap-2 mb-3 px-1">
        <MessageSquare size={16} className="text-black/60 dark:text-white/60" />
        <h3 className="text-sm font-medium text-black/70 dark:text-white/70">
          Recent {templateName} chats
        </h3>
      </div>
      
      <div className="space-y-2">
        {chats.map((chat) => (
          <Link
            key={chat.id}
            href={`/c/${chat.id}${focusMode !== 'webSearch' ? `?template=${focusMode}` : ''}`}
            className="group block"
          >
            <div className="flex items-center justify-between p-3 bg-light-secondary/50 dark:bg-dark-secondary/50 hover:bg-light-secondary dark:hover:bg-dark-secondary border border-light-200/50 dark:border-dark-200/50 hover:border-light-200 dark:hover:border-dark-200 rounded-lg transition-all duration-200 hover:shadow-sm">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {currentTemplate && (
                  <div className="flex-shrink-0 text-blue-600 dark:text-blue-400">
                    {React.cloneElement(currentTemplate.icon as React.ReactElement, { 
                      size: 16, 
                      className: "stroke-[1.5]" 
                    })}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {chat.title}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 text-xs text-black/50 dark:text-white/50 flex-shrink-0">
                <Clock size={12} />
                <span>{formatTimeDifference(new Date(), new Date(chat.createdAt))} ago</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecentChats; 