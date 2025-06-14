import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create browser client with cookie support for SSR
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : null;

export type User = {
  id: string;
  email?: string;
  name?: string;
  isGuest?: boolean;
};

export const getUser = async (): Promise<User | null> => {
  if (!supabase) {
    console.log('getUser: Supabase not available');
    return null;
  }
  
  try {
    // First try to get the current session
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('getUser: Session result:', { session: !!session, error, userId: session?.user?.id });
    
    if (error) {
      console.error('getUser: Session error:', error);
      return null;
    }
    
    if (session?.user) {
      const user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
        isGuest: false,
      };
      console.log('getUser: Returning user:', user);
      return user;
    }
    
    console.log('getUser: No session found');
    return null;
  } catch (error) {
    console.error('getUser: Exception:', error);
    return null;
  }
};

export const signOut = async () => {
  if (!supabase) return;
  
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}; 