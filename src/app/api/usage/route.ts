import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { usage, subscriptions } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { getServerUser } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const model = url.searchParams.get('model');
    
    // Get current billing period
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    let whereClause = and(
      eq(usage.userId, user.id),
      gte(usage.periodStart, startOfMonth),
      lte(usage.periodEnd, endOfMonth)
    );

    if (model) {
      whereClause = and(whereClause!, eq(usage.model, model));
    }

    const userUsage = await db
      .select()
      .from(usage)
      .where(whereClause);

    // Get user subscription to determine limits
    const userSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .limit(1);

    const plan = userSubscription.length > 0 ? userSubscription[0].plan : 'free';
    const limits = getTokenLimits(plan);

    return NextResponse.json({
      usage: userUsage,
      limits,
      plan,
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { model, tokensUsed } = await request.json();

    if (!model || typeof tokensUsed !== 'number' || tokensUsed <= 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Get current billing period
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Check if usage record exists for this period
    const existingUsage = await db
      .select()
      .from(usage)
      .where(and(
        eq(usage.userId, user.id),
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
        userId: user.id,
        model,
        tokensUsed,
        periodStart: startOfMonth,
        periodEnd: endOfMonth,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getTokenLimits(plan: string) {
  const limits: Record<string, number> = {};
  
  // Get limits from environment variables
  const envVars = process.env;
  const prefix = plan === 'free' ? 'FREE_LIMIT_' : 'PRO_LIMIT_';
  
  Object.keys(envVars).forEach(key => {
    if (key.startsWith(prefix)) {
      const model = key.replace(prefix, '').toLowerCase();
      limits[model] = parseInt(envVars[key] || '0');
    }
  });
  
  return limits;
} 