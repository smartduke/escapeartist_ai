import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { subscriptions, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getServerUserFromRequest } from '@/lib/supabase/server';
import Razorpay from 'razorpay';

// Initialize Razorpay only if credentials are available
let razorpay: Razorpay | null = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// Helper function to ensure user exists in database
async function ensureUserExists(user: any) {
  try {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (existingUser.length === 0) {
      // Create user if doesn't exist
      console.log('Creating user record for:', user.id);
      await db.insert(users).values({
        id: user.id,
        email: user.email || '',
        name: user.name,
        isGuest: false,
      });
      console.log('User record created successfully');
    } else {
      console.log('User record already exists');
    }
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/subscriptions: Starting request');
    
    const user = await getServerUserFromRequest(request);
    console.log('GET /api/subscriptions: User result:', user);
    
    if (!user) {
      console.log('GET /api/subscriptions: No user found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user exists in database
    await ensureUserExists(user);

    console.log('GET /api/subscriptions: Fetching subscription for user:', user.id);
    
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .limit(1);

    if (subscription.length === 0) {
      console.log('GET /api/subscriptions: No subscription found, returning free plan');
      return NextResponse.json({
        plan: 'free',
        status: 'active',
        currentPeriodEnd: null,
      });
    }

    const sub = subscription[0];
    console.log('GET /api/subscriptions: Found subscription:', sub);
    
    return NextResponse.json({
      plan: sub.plan,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd,
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
    console.log('POST /api/subscriptions: Starting request');
    
    const user = await getServerUserFromRequest(request);
    console.log('POST /api/subscriptions: User result:', user);
    
    if (!user) {
      console.log('POST /api/subscriptions: No user found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!razorpay) {
      console.log('POST /api/subscriptions: Razorpay not configured');
      return NextResponse.json({ error: 'Payment service not configured' }, { status: 503 });
    }

    // Ensure user exists in database
    await ensureUserExists(user);

    const { plan } = await request.json();
    console.log('POST /api/subscriptions: Plan requested:', plan);

    if (plan === 'free') {
      // Handle downgrade to free
      const now = new Date();
      await db
        .update(subscriptions)
        .set({
          plan: 'free',
          status: 'active',
          razorpaySubscriptionId: null,
          currentPeriodStart: now,
          currentPeriodEnd: now,
        })
        .where(eq(subscriptions.userId, user.id));

      return NextResponse.json({ success: true });
    }

    // Create Razorpay order
    const amount = plan === 'pro_monthly' ? 2000 : 19200; // $20 and $16*12 in cents
    const currency = 'USD';
    
    console.log('POST /api/subscriptions: Creating Razorpay order with amount:', amount);

    try {
      const order = await razorpay.orders.create({
        amount: amount,
        currency: currency,
        notes: {
          plan: plan,
          userId: user.id,
          email: user.email || '',
        },
      });

      console.log('POST /api/subscriptions: Razorpay order created:', order.id);

      // Calculate period end based on plan
      const now = new Date();
      const currentPeriodEnd = new Date(now);
      if (plan === 'pro_monthly') {
        currentPeriodEnd.setMonth(now.getMonth() + 1);
      } else if (plan === 'pro_yearly') {
        currentPeriodEnd.setFullYear(now.getFullYear() + 1);
      }

      // Store the subscription as pending until payment is confirmed
      const existingSubscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, user.id))
        .limit(1);

      if (existingSubscription.length > 0) {
        await db
          .update(subscriptions)
          .set({
            plan,
            status: 'pending',
            razorpaySubscriptionId: order.id,
            currentPeriodStart: now,
            currentPeriodEnd,
          })
          .where(eq(subscriptions.userId, user.id));
      } else {
        await db.insert(subscriptions).values({
          userId: user.id,
          plan,
          status: 'pending',
          razorpaySubscriptionId: order.id,
          currentPeriodStart: now,
          currentPeriodEnd,
        });
      }

      console.log('POST /api/subscriptions: Subscription created with pending status');
      
      return NextResponse.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      });

    } catch (razorpayError) {
      console.error('POST /api/subscriptions: Razorpay error:', razorpayError);
      return NextResponse.json(
        { error: 'Failed to create payment order' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('POST /api/subscriptions: Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 