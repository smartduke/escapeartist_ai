import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { formatTimeDifference } from '@/lib/utils';
import { Clock, MessageSquare } from 'lucide-react';
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
}

const RecentChats: React.FC<RecentChatsProps> = ({ focusMode }) => {
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

  // Don't render if loading, no chats, or All Sources template
  if (loading || chats.length === 0 || focusMode === 'webSearch') {
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