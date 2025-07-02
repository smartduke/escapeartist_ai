'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans';
import { UsageDashboard } from '@/components/subscription/UsageDashboard';
import { toast } from 'sonner';

declare global {
  interface Window {
    Stripe: any;
  }
}

interface SubscriptionData {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
}

export default function SubscriptionPage() {
  const { user, isLoading } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'plans' | 'usage'>('plans');

  // Debug logging
  console.log('SubscriptionPage: user =', user, 'isLoading =', isLoading);

  useEffect(() => {
    console.log('SubscriptionPage: useEffect triggered, user =', user, 'isLoading =', isLoading);
    
    if (!isLoading) {
      if (user) {
        console.log('SubscriptionPage: User found, fetching subscription');
        fetchSubscription();
      } else {
        console.log('SubscriptionPage: No user found');
        setLoading(false);
      }
    }
  }, [user, isLoading]);

  useEffect(() => {
    // Load Stripe script
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const fetchSubscription = async () => {
    try {
      console.log('SubscriptionPage: Fetching subscription...');
      const response = await fetch('/api/subscriptions', {
        method: 'GET',
        credentials: 'include', // Ensure cookies are sent
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('SubscriptionPage: Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('SubscriptionPage: Subscription data:', data);
        setSubscription(data);
      } else {
        const errorData = await response.text();
        console.error('SubscriptionPage: Error response:', errorData);
      }
    } catch (error) {
      console.error('SubscriptionPage: Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      return;
    }

    if (planId === 'free') {
      // Handle downgrade to free plan
      toast.success('You are now on the free plan');
      await fetchSubscription();
      return;
    }

    try {
      // Create subscription/order
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: planId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const { subscriptionId, clientSecret } = await response.json();

      // Initialize Stripe payment
      if (typeof window.Stripe === 'undefined') {
        toast.error('Payment service not available. Please refresh the page.');
        return;
      }

      const stripe = window.Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
      
      // For now, redirect to pricing page for proper Stripe checkout
      toast.info('Redirecting to secure checkout...');
      window.location.href = '/pricing';
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to create subscription');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light-primary dark:bg-dark-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-light-primary dark:bg-dark-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Sign In Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please sign in to view subscription plans and usage.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-light-primary dark:bg-dark-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-primary dark:bg-dark-primary">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Subscription & Usage
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your subscription and monitor your AI model usage
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('plans')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'plans'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Subscription Plans
          </button>
          <button
            onClick={() => setActiveTab('usage')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'usage'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Usage Dashboard
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {activeTab === 'plans' ? (
            <SubscriptionPlans
              currentPlan={subscription?.plan || 'free'}
              onSelectPlan={handleSelectPlan}
            />
          ) : (
            <UsageDashboard />
          )}
        </div>

        {/* Current Subscription Info */}
        {subscription && subscription.plan !== 'free' && (
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
              Current Subscription
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700 dark:text-blue-300 font-medium">Plan:</span>
                <p className="text-blue-900 dark:text-blue-100 capitalize">
                  {subscription.plan.replace('_', ' ')}
                </p>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300 font-medium">Status:</span>
                <p className="text-blue-900 dark:text-blue-100 capitalize">
                  {subscription.status}
                </p>
              </div>
              {subscription.currentPeriodEnd && (
                <div>
                  <span className="text-blue-700 dark:text-blue-300 font-medium">
                    Next Billing:
                  </span>
                  <p className="text-blue-900 dark:text-blue-100">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 