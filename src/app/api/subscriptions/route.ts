import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { subscriptions, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getServerUserFromRequest } from '@/lib/supabase/server';
import Stripe from 'stripe';

// Initialize Stripe
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-05-28.basil',
    });
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
  }
}

// Helper function to ensure user exists in database
async function ensureUserExists(user: any) {
  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (existingUser.length === 0) {
      await db.insert(users).values({
        id: user.id,
        email: user.email || '',
        name: user.name,
        isGuest: false,
      });
    }
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureUserExists(user);
    
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .limit(1);

    if (subscription.length === 0) {
      return NextResponse.json({
        plan: 'free',
        status: 'active',
        currentPeriodEnd: null,
      });
    }

    const sub = subscription[0];
    return NextResponse.json({
      plan: sub.plan,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd,
      paymentGateway: sub.paymentGateway,
    });
  } catch (error) {
    console.error('GET /api/subscriptions: Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureUserExists(user);

    const { plan } = await request.json();

    if (plan === 'free') {
      const now = new Date();
      await db
        .update(subscriptions)
        .set({
          plan: 'free',
          status: 'active',
          razorpaySubscriptionId: null,
          stripeSubscriptionId: null,
          paymentGateway: null,
          currentPeriodStart: now,
          currentPeriodEnd: now,
        })
        .where(eq(subscriptions.userId, user.id));

      return NextResponse.json({ success: true });
    }

    if (!stripe || !process.env.STRIPE_MONTHLY_PRICE_ID || !process.env.STRIPE_YEARLY_PRICE_ID) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 503 }
      );
    }

    // Create or get Stripe customer
    let customer;
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price: plan === 'pro_monthly'
            ? process.env.STRIPE_MONTHLY_PRICE_ID
            : process.env.STRIPE_YEARLY_PRICE_ID,
        },
      ],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: user.id,
        plan,
      },
    });

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = (invoice as any).payment_intent as Stripe.PaymentIntent;

    // Store the subscription as pending
    const now = new Date();
    const currentPeriodEnd = new Date(now);
    if (plan === 'pro_monthly') {
      currentPeriodEnd.setMonth(now.getMonth() + 1);
    } else {
      currentPeriodEnd.setFullYear(now.getFullYear() + 1);
    }

    await db.insert(subscriptions).values({
      userId: user.id,
      plan: plan as 'pro_monthly' | 'pro_yearly',
      status: 'pending',
      stripeSubscriptionId: subscription.id,
      paymentGateway: 'stripe',
      currentPeriodStart: now,
      currentPeriodEnd,
    }).onConflictDoUpdate({
      target: [subscriptions.userId],
      set: {
        plan: plan as 'pro_monthly' | 'pro_yearly',
        status: 'pending',
        stripeSubscriptionId: subscription.id,
        paymentGateway: 'stripe',
        currentPeriodStart: now,
        currentPeriodEnd,
      },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
    });

  } catch (error) {
    console.error('POST /api/subscriptions: Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 