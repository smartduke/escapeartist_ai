import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { formatTimeDifference } from '@/lib/utils';
import { MessageSquare, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface Chat {
  id: string;
  title: string;
  createdAt: string;
  focusMode: string;
}

interface RecentChatsProps {
  focusMode: string;
  setFocusMode?: (mode: string) => void;
}

const RecentChats: React.FC<RecentChatsProps> = ({ focusMode, setFocusMode }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch('/api/chats');
        if (response.ok) {
          const data = await response.json();
          setChats(data);
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchChats();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Recent Escape Artist Chats
        </h2>
        
        {chats.length > 0 ? (
          <div className="space-y-2">
            {chats.map((chat) => (
              <Link
                key={chat.id}
                href={`/c/${chat.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-900 dark:text-white">{chat.title}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatTimeDifference(new Date(), new Date(chat.createdAt))} ago
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No recent chats about international living yet.</p>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Start a new conversation about expat life!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentChats; 