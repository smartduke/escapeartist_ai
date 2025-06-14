import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import type { User } from './client';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

// New function for API routes that accepts request object
export function createSupabaseServerClientForAPI(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // In API routes, we can't set cookies in the same way
          // They should be set in the response
        },
        remove(name: string, options: CookieOptions) {
          // In API routes, we can't remove cookies in the same way
          // They should be removed in the response
        },
      },
    }
  );
}

export async function getServerUser(): Promise<User | null> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // First try to get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('getServerUser: Session error:', sessionError);
      return null;
    }
    
    if (!session || !session.user) {
      console.log('getServerUser: No session or user found');
      return null;
    }
    
    const userData = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
      isGuest: false,
    };
    
    console.log('getServerUser: Returning user from session:', userData);
    return userData;
  } catch (error) {
    console.error('getServerUser: Exception:', error);
    return null;
  }
}

// New function for API routes
export async function getServerUserFromRequest(request: NextRequest): Promise<User | null> {
  try {
    console.log('getServerUserFromRequest: Starting...');
    const supabase = createSupabaseServerClientForAPI(request);
    
    // List all cookies to debug
    const cookieNames: string[] = [];
    request.cookies.getAll().forEach(cookie => {
      cookieNames.push(cookie.name);
    });
    console.log('getServerUserFromRequest: Available cookies:', cookieNames);
    
    // First try to get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('getServerUserFromRequest: Session error:', sessionError);
      return null;
    }
    
    if (!session || !session.user) {
      console.log('getServerUserFromRequest: No session or user found');
      return null;
    }
    
    const userData = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
      isGuest: false,
    };
    
    console.log('getServerUserFromRequest: Returning user from session:', userData);
    return userData;
  } catch (error) {
    console.error('getServerUserFromRequest: Exception:', error);
    return null;
  }
} 