import db from '@/lib/db';
import { usage, subscriptions } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export interface UsageCheck {
  canUse: boolean;
  currentUsage: number;
  limit: number;
  remaining: number;
}

export async function checkUsageLimit(
  userId: string,
  model: string
): Promise<UsageCheck> {
  // Get user subscription
  const userSubscription = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  const plan = userSubscription.length > 0 ? userSubscription[0].plan : 'free';
  
  // Get limit for this model
  const limit = getModelLimit(model, plan);
  
  // Get current usage for this billing period
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const currentUsage = await db
    .select()
    .from(usage)
    .where(and(
      eq(usage.userId, userId),
      eq(usage.model, model),
      gte(usage.periodStart, startOfMonth),
      lte(usage.periodEnd, endOfMonth)
    ))
    .limit(1);

  const tokensUsed = currentUsage.length > 0 ? currentUsage[0].tokensUsed : 0;
  const remaining = Math.max(0, limit - tokensUsed);

  return {
    canUse: tokensUsed < limit,
    currentUsage: tokensUsed,
    limit,
    remaining,
  };
}

export async function trackUsage(
  userId: string,
  model: string,
  tokensUsed: number
): Promise<void> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Check if usage record exists for this period
  const existingUsage = await db
    .select()
    .from(usage)
    .where(and(
      eq(usage.userId, userId),
      eq(usage.model, model),
      gte(usage.periodStart, startOfMonth),
      lte(usage.periodEnd, endOfMonth)
    ))
    .limit(1);

  if (existingUsage.length > 0) {
    // Update existing usage
    await db.update(usage)
      .set({
        tokensUsed: existingUsage[0].tokensUsed + tokensUsed,
      })
      .where(eq(usage.id, existingUsage[0].id));
  } else {
    // Create new usage record
    await db.insert(usage).values({
      userId,
      model,
      tokensUsed,
      periodStart: startOfMonth,
      periodEnd: endOfMonth,
    });
  }
}

function getModelLimit(model: string, plan: string): number {
  const envKey = `${plan === 'free' ? 'FREE' : 'PRO'}_LIMIT_${model.toUpperCase()}`;
  return parseInt(process.env[envKey] || '0');
}

export function getAllModelLimits(plan: string): Record<string, number> {
  const limits: Record<string, number> = {};
  const prefix = plan === 'free' ? 'FREE_LIMIT_' : 'PRO_LIMIT_';
  
  Object.keys(process.env).forEach(key => {
    if (key.startsWith(prefix)) {
      const model = key.replace(prefix, '').toLowerCase();
      limits[model] = parseInt(process.env[key] || '0');
    }
  });
  
  return limits;
} 