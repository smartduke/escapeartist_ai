import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';
import db from '@/lib/db';
import { subscriptions } from '@/lib/db/schema';

// Initialize Stripe with a default value, we'll check for proper key at runtime
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key', {
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: NextRequest) {
  try {
    // Check required environment variables at runtime
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set');
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'payment_intent.created':
        await handlePaymentIntentCreated(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'invoice.created':
      case 'invoice.finalized':
        await handleInvoiceUpdated(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log('Unhandled webhook event:', event.type);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const currentPeriodStart = new Date((subscription as any).current_period_start * 1000);
  const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
  const userId = subscription.metadata?.userId;
  const plan = (subscription.metadata?.plan || 'pro_monthly') as 'pro_monthly' | 'pro_yearly';
  
  if (!userId) {
    console.error('Missing userId in subscription metadata:', subscription.id);
    return;
  }

  try {
    await db.insert(subscriptions).values({
      userId,
      plan,
      status: subscription.status === 'active' ? 'active' : 'pending',
      stripeSubscriptionId: subscription.id,
      paymentGateway: 'stripe',
      currentPeriodStart,
      currentPeriodEnd,
    }).onConflictDoUpdate({
      target: subscriptions.stripeSubscriptionId,
      set: {
        status: subscription.status === 'active' ? 'active' : 'pending',
        currentPeriodStart,
        currentPeriodEnd,
      },
    });
  } catch (error) {
    console.error('Failed to update subscription in database:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    await db.update(subscriptions)
      .set({ status: 'canceled' })
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
  } catch (error) {
    console.error('Failed to mark subscription as canceled:', error);
    throw error;
  }
}

async function handlePaymentIntentCreated(paymentIntent: Stripe.PaymentIntent) {
  // Log for monitoring
  console.log('Payment intent created:', paymentIntent.id);
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const userId = paymentIntent.metadata?.userId;
  if (!userId) {
    console.error('Missing userId in payment intent metadata:', paymentIntent.id);
    return;
  }

  try {
    // Update subscription status if this was for a subscription
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (subscription.length > 0) {
      await db.update(subscriptions)
        .set({ status: 'active' })
        .where(eq(subscriptions.userId, userId));
    }
  } catch (error) {
    console.error('Failed to handle payment intent success:', error);
    throw error;
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const userId = paymentIntent.metadata?.userId;
  if (!userId) {
    console.error('Missing userId in payment intent metadata:', paymentIntent.id);
    return;
  }

  try {
    // Update subscription status if this was for a subscription
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (subscription.length > 0) {
      await db.update(subscriptions)
        .set({ status: 'past_due' })
        .where(eq(subscriptions.userId, userId));
    }
  } catch (error) {
    console.error('Failed to handle payment intent failure:', error);
    throw error;
  }
}

async function handleInvoiceUpdated(invoice: Stripe.Invoice) {
  // Log for monitoring
  console.log('Invoice updated:', invoice.id, 'Status:', invoice.status);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription;
  if (!subscriptionId) {
    return; // Not a subscription invoice
  }

  try {
    await db.update(subscriptions)
      .set({ status: 'active' })
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));
  } catch (error) {
    console.error('Failed to handle invoice payment success:', error);
    throw error;
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription;
  if (!subscriptionId) {
    return; // Not a subscription invoice
  }

  try {
    await db.update(subscriptions)
      .set({ status: 'past_due' })
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));
  } catch (error) {
    console.error('Failed to handle invoice payment failure:', error);
    throw error;
  }
} 