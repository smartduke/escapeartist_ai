'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { AuthModal } from '@/components/auth/AuthModal';
import { Check, Star } from 'lucide-react';
import { toast } from 'sonner';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PricingCard = ({ 
  plan, 
  price, 
  period, 
  features, 
  isPopular = false, 
  planId, 
  onSelectPlan 
}: {
  plan: string;
  price: string;
  period: string;
  features: string[];
  isPopular?: boolean;
  planId: string;
  onSelectPlan: (planId: string) => void;
}) => {
  return (
    <div className={`relative p-6 rounded-lg border-2 transition-all duration-200 hover:shadow-lg ${
      isPopular 
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
    }`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-1 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            <Star className="w-4 h-4" />
            <span>Most Popular</span>
          </div>
        </div>
      )}
      
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{plan}</h3>
        <div className="mb-4">
          <span className="text-4xl font-bold text-gray-900 dark:text-white">${price}</span>
          <span className="text-gray-600 dark:text-gray-400">/{period}</span>
        </div>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start space-x-3">
            <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelectPlan(planId)}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          isPopular
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
        }`}
      >
        {planId === 'free' ? 'Current Plan' : 'Upgrade Now'}
      </button>
    </div>
  );
};

export default function PricingPage() {
  const { user, isLoading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    // Load Razorpay script for authenticated users
    if (user) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [user]);

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      // Show the existing auth modal for non-authenticated users
      setAuthMode('login');
      setAuthModalOpen(true);
      return;
    }

    if (planId === 'free') {
      toast.info('You are currently on the free plan');
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

      const { orderId, amount, currency, key } = await response.json();

      // Initialize Razorpay payment
      const options = {
        key: key,
        amount: amount,
        currency: currency,
        name: 'InfoxAI',
        description: `${planId === 'pro_monthly' ? 'Monthly' : 'Yearly'} Pro Plan`,
        order_id: orderId,
        handler: async (response: any) => {
          // Payment successful
          console.log('Payment successful:', response);
          toast.success('Payment successful! Your subscription is now active.');
          // Redirect to profile page to see subscription details
          window.location.href = '/profile';
        },
        prefill: {
          name: user.name || '',
          email: user.email || '',
        },
        theme: {
          color: '#3B82F6',
        },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled');
          },
        },
      };

      // Check if Razorpay is loaded
      if (typeof window.Razorpay === 'undefined') {
        toast.error('Payment service not available. Please refresh the page.');
        return;
      }

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to create subscription');
    }
  };

  const plans = [
    {
      plan: 'Free',
      price: '0',
      period: 'forever',
      planId: 'free',
      features: [
        '10,000 GPT-4 tokens per month',
        '8,000 Gemini tokens per month',
        '12,000 Claude-3 tokens per month',
        'Basic web search',
        'Community support'
      ]
    },
    {
      plan: 'Pro Monthly',
      price: '20',
      period: 'month',
      planId: 'pro_monthly',
      isPopular: true,
      features: [
        '100,000 GPT-4 tokens per month',
        '80,000 Gemini tokens per month',
        '120,000 Claude-3 tokens per month',
        'Advanced web search',
        'Priority support',
        'Usage analytics',
        'Cancel anytime'
      ]
    },
    {
      plan: 'Pro Yearly',
      price: '192',
      period: 'year',
      planId: 'pro_yearly',
      features: [
        '100,000 GPT-4 tokens per month',
        '80,000 Gemini tokens per month',
        '120,000 Claude-3 tokens per month',
        'Advanced web search',
        'Priority support',
        'Usage analytics',
        '20% savings vs monthly',
        'Cancel anytime'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-light-primary dark:bg-dark-primary">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Get unlimited access to AI-powered search with flexible pricing that scales with your needs
          </p>
        </div>

        {/* User Status Banner */}
        {!isLoading && (
          <div className="mb-8 text-center">
            {user ? (
              <div className="inline-block bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2">
                <span className="text-green-800 dark:text-green-200">
                  ✓ Signed in as {user.email}
                </span>
              </div>
            ) : (
              <div className="inline-block bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2">
                <span className="text-blue-800 dark:text-blue-200">
                  💡 Sign in to subscribe and unlock Pro features
                </span>
              </div>
            )}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((planData, index) => (
            <PricingCard
              key={index}
              {...planData}
              onSelectPlan={handleSelectPlan}
            />
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                What are tokens?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tokens are units of text that AI models process. Roughly 1,000 tokens equal about 750 words.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Can I change or cancel my plan?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes, you can upgrade, downgrade, or cancel your subscription at any time from your profile page.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Do unused tokens roll over?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                No, tokens reset each month. We recommend choosing a plan that fits your monthly usage patterns.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
} 