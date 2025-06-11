'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getUser, type User } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  guestId: string;
  guestChatCount: number;
  maxGuestChats: number;
  canCreateChat: boolean;
  incrementGuestChatCount: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [guestId, setGuestId] = useState<string>('');
  const [guestChatCount, setGuestChatCount] = useState(0);
  const maxGuestChats = 2;

  // Debug logging
  console.log('AuthProvider Debug:', { user, isLoading, guestId, guestChatCount });

  // Initialize guest ID and chat count
  useEffect(() => {
    let storedGuestId = localStorage.getItem('guestId');
    if (!storedGuestId) {
      storedGuestId = uuidv4();
      localStorage.setItem('guestId', storedGuestId);
    }
    setGuestId(storedGuestId);

    const storedChatCount = localStorage.getItem('guestChatCount');
    setGuestChatCount(storedChatCount ? parseInt(storedChatCount, 10) : 0);
  }, []);

  useEffect(() => {
    // Check if Supabase is configured
    if (!supabase) {
      console.log('AuthProvider: Supabase not configured');
      setIsLoading(false);
      return;
    }

    // Get initial user
    console.log('AuthProvider: Getting initial user session...');
    getUser().then((user) => {
      console.log('AuthProvider: Initial user session result:', user);
      setUser(user);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state change:', event, session?.user?.id);
        if (session?.user) {
          // Create user object directly from session instead of calling getUser()
          const user = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
            isGuest: false,
          };
          console.log('AuthProvider: User logged in:', user);
          setUser(user);
          // Reset guest chat count when user logs in
          setGuestChatCount(0);
          localStorage.setItem('guestChatCount', '0');
        } else {
          console.log('AuthProvider: User logged out');
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const incrementGuestChatCount = () => {
    if (!user) {
      const newCount = guestChatCount + 1;
      setGuestChatCount(newCount);
      localStorage.setItem('guestChatCount', newCount.toString());
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    
    await supabase.auth.signOut();
    setUser(null);
    // Don't reset guest chat count on logout - maintain limitation
  };

  const canCreateChat = user !== null || guestChatCount < maxGuestChats;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        guestId,
        guestChatCount,
        maxGuestChats,
        canCreateChat,
        incrementGuestChatCount,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 