import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase/server';
import { checkUsageLimit, trackUsage } from '@/lib/usage';

export interface UsageLimitOptions {
  model: string;
  estimatedTokens?: number;
}

export async function checkUsageLimitMiddleware(
  options: UsageLimitOptions
): Promise<{ allowed: boolean; response?: NextResponse }> {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return {
        allowed: false,
        response: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        ),
      };
    }

    const usageCheck = await checkUsageLimit(user.id, options.model);

    if (!usageCheck.canUse) {
      return {
        allowed: false,
        response: NextResponse.json(
          {
            error: 'Usage limit exceeded',
            details: {
              model: options.model,
              currentUsage: usageCheck.currentUsage,
              limit: usageCheck.limit,
              remaining: usageCheck.remaining,
            },
          },
          { status: 429 }
        ),
      };
    }

    // Check if estimated tokens would exceed limit
    if (options.estimatedTokens && usageCheck.remaining < options.estimatedTokens) {
      return {
        allowed: false,
        response: NextResponse.json(
          {
            error: 'Estimated token usage would exceed limit',
            details: {
              model: options.model,
              estimatedTokens: options.estimatedTokens,
              remaining: usageCheck.remaining,
            },
          },
          { status: 429 }
        ),
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Usage limit check failed:', error);
    return {
      allowed: false,
      response: NextResponse.json(
        { error: 'Usage limit check failed' },
        { status: 500 }
      ),
    };
  }
}

export async function trackUsageAfterCall(
  model: string,
  tokensUsed: number
): Promise<void> {
  try {
    const user = await getServerUser();
    if (user) {
      await trackUsage(user.id, model, tokensUsed);
    }
  } catch (error) {
    console.error('Failed to track usage:', error);
  }
}

// Helper function to estimate tokens from text (rough estimation)
export function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

// Helper function to get model name from provider and model
export function getModelKey(provider: string, model?: string): string {
  const key = model ? `${provider}_${model}` : provider;
  return key.toLowerCase().replace(/[^a-z0-9_]/g, '_');
} 