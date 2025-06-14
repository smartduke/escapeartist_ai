import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { subscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);

    switch (event.event) {
      case 'subscription.activated':
        await handleSubscriptionActivated(event.payload.subscription.entity);
        break;
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.payload.subscription.entity);
        break;
      case 'subscription.charged':
        await handleSubscriptionCharged(event.payload.subscription.entity);
        break;
      default:
        console.log('Unhandled webhook event:', event.event);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}

async function handleSubscriptionActivated(subscription: any) {
  const currentPeriodStart = new Date(subscription.current_start * 1000);
  const currentPeriodEnd = new Date(subscription.current_end * 1000);
  
  await db.insert(subscriptions).values({
    userId: subscription.notes?.userId,
    plan: subscription.notes?.plan || 'pro_monthly',
    status: 'active',
    razorpaySubscriptionId: subscription.id,
    currentPeriodStart,
    currentPeriodEnd,
  }).onConflictDoUpdate({
    target: subscriptions.razorpaySubscriptionId,
    set: {
      status: 'active',
      currentPeriodStart,
      currentPeriodEnd,
    },
  });
}

async function handleSubscriptionCancelled(subscription: any) {
  await db.update(subscriptions)
    .set({ status: 'canceled' })
    .where(eq(subscriptions.razorpaySubscriptionId, subscription.id));
}

async function handleSubscriptionCharged(subscription: any) {
  const currentPeriodStart = new Date(subscription.current_start * 1000);
  const currentPeriodEnd = new Date(subscription.current_end * 1000);
  
  await db.update(subscriptions)
    .set({
      status: 'active',
      currentPeriodStart,
      currentPeriodEnd,
    })
    .where(eq(subscriptions.razorpaySubscriptionId, subscription.id));
} 