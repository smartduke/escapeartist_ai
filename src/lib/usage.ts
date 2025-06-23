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
  // Normalize the model name for consistent tracking
  const normalizedModel = normalizeModelName(model);
  
  // Get user subscription
  const userSubscription = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  const plan = userSubscription.length > 0 ? userSubscription[0].plan : 'free';
  
  // Get limit for this model
  const limit = getModelLimit(normalizedModel, plan);
  
  // Get current usage for this billing period
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const currentUsage = await db
    .select()
    .from(usage)
    .where(and(
      eq(usage.userId, userId),
      eq(usage.model, normalizedModel),
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

// Normalize model names to match environment variable format
function normalizeModelName(model: string): string {
  const normalized = model.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  // OpenAI models - match env var format
  if (normalized.includes('gpt_4o_mini')) return 'gpt_4o_mini';
  if (normalized.includes('gpt_4_1')) return 'gpt_4_1';
  if (normalized.includes('gpt_4o')) return 'gpt_4o';
  if (normalized.includes('gpt_4_turbo')) return 'gpt_4';
  if (normalized.includes('gpt_4')) return 'gpt_4';
  if (normalized.includes('gpt_3_5_turbo')) return 'gpt_3_5_turbo';
  if (normalized.includes('gpt_35_turbo')) return 'gpt_3_5_turbo';
  if (normalized.includes('gpt_3_5')) return 'gpt_3_5_turbo';
  if (normalized.includes('gpt_3')) return 'gpt_3_5_turbo';
  
  // Anthropic models - match env var format
  // Claude 4 models (primary pro models)
  if (normalized.includes('claude_opus_4')) return 'claude_opus_4';
  if (normalized.includes('claude_sonnet_4')) return 'claude_sonnet_4';
  // Claude 3.x models (legacy)
  if (normalized.includes('claude_3_5_sonnet')) return 'claude_3_sonnet';
  if (normalized.includes('claude_3_sonnet')) return 'claude_3_sonnet';
  if (normalized.includes('claude_3_opus')) return 'claude_3_sonnet';
  if (normalized.includes('claude_3_haiku')) return 'claude_3_haiku';
  if (normalized.includes('claude_3')) return 'claude_3_sonnet';
  if (normalized.includes('claude_2')) return 'claude_3_haiku';
  if (normalized.includes('claude')) return 'claude_3_haiku';
  
  // Google models - match env var format
  // Gemini 2.5 Pro (primary pro model) - matches gemini-2.5-pro-exp-03-25
  if (normalized.includes('gemini_2_5_pro')) return 'gemini_2_5_pro';
  if (normalized.includes('gemini_2_5')) return 'gemini_2_5_pro';
  if (normalized.includes('gemini_2_0')) return 'gemini_2_5_pro';
  // Legacy Gemini models
  if (normalized.includes('gemini_1_5_pro')) return 'gemini_pro';
  if (normalized.includes('gemini_pro')) return 'gemini_pro';
  if (normalized.includes('gemini_1_5')) return 'gemini_pro';
  if (normalized.includes('gemini')) return 'gemini_pro';
  
  // Other providers (minimal limits)
  if (normalized.includes('groq')) return 'custom_model';
  if (normalized.includes('deepseek')) return 'custom_model';
  if (normalized.includes('ollama')) return 'custom_model';
  if (normalized.includes('mixtral')) return 'custom_model';
  if (normalized.includes('llama')) return 'custom_model';
  
  // Return custom_model as fallback
  return 'custom_model';
}

export async function trackUsage(
  userId: string,
  model: string,
  tokensUsed: number
): Promise<void> {
  // Normalize the model name for consistent tracking
  const normalizedModel = normalizeModelName(model);
  
  console.log(`Tracking usage: Original model: ${model}, Normalized: ${normalizedModel}, Tokens: ${tokensUsed}`);
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Check if usage record exists for this period
  const existingUsage = await db
    .select()
    .from(usage)
    .where(and(
      eq(usage.userId, userId),
      eq(usage.model, normalizedModel),
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
      model: normalizedModel,
      tokensUsed,
      periodStart: startOfMonth,
      periodEnd: endOfMonth,
    });
  }
}

function getModelLimit(model: string, plan: string): number {
  const planPrefix = plan === 'free' ? 'FREE' : 'PRO';
  const envKey = `${planPrefix}_LIMIT_${model.toUpperCase()}`;
  return parseInt(process.env[envKey] || '0');
}

export function getAllModelLimits(plan: string): Record<string, number> {
  const limits: Record<string, number> = {};
  const planPrefix = plan === 'free' ? 'FREE' : 'PRO';
  const prefix = `${planPrefix}_LIMIT_`;
  
  Object.keys(process.env).forEach(key => {
    if (key.startsWith(prefix)) {
      const model = key.replace(prefix, '').toLowerCase();
      const limit = parseInt(process.env[key] || '0');
      limits[model] = limit;
    }
  });
  
  return limits;
} 