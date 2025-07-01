'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { AuthModal } from '@/components/auth/AuthModal';
import { Check, Star } from 'lucide-react';
import { toast } from 'sonner';
import StripeCardElement from '@/components/subscription/StripeCardElement';

declare global {
  interface Window {
    Razorpay: any;
    Stripe: any;
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
        className={`w-full py-2 rounded-lg font-medium transition-all duration-200 ${
          isPopular
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        {planId === 'free' ? 'Current Plan' : 'Subscribe Now'}
      </button>
    </div>
  );
};

export default function PricingPage() {
  const { user, isLoading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [paymentGateway, setPaymentGateway] = useState<'stripe' | 'razorpay'>('stripe');
  const [stripeElements, setStripeElements] = useState<any>(null);
  const [stripeInstance, setStripeInstance] = useState<any>(null);
  const [showStripeForm, setShowStripeForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    // Load Razorpay script for authenticated users
    if (user) {
      const razorpayScript = document.createElement('script');
      razorpayScript.src = 'https://checkout.razorpay.com/v1/checkout.js';
      razorpayScript.async = true;
      document.body.appendChild(razorpayScript);

      return () => {
        document.body.removeChild(razorpayScript);
      };
    }
  }, [user]);

  const handleStripeElementsReady = (elements: any, stripe: any) => {
    setStripeElements(elements);
    setStripeInstance(stripe);
  };

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      setAuthMode('login');
      setAuthModalOpen(true);
      return;
    }

    if (planId === 'free') {
      toast.info('You are currently on the free plan');
      return;
    }

    setSelectedPlan(planId);

    if (paymentGateway === 'stripe') {
      setShowStripeForm(true);
      return;
    }

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: planId, paymentGateway }),
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const data = await response.json();

      // Initialize Razorpay payment
      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'EscapeArtist AI',
        description: `${planId === 'pro_monthly' ? 'Monthly' : 'Yearly'} Pro Plan`,
        order_id: data.orderId,
        handler: async (response: any) => {
          console.log('Payment successful:', response);
          toast.success('Payment successful! Your subscription is now active.');
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

  const handleStripeSubmit = async () => {
    if (!selectedPlan || !stripeElements || !stripeInstance) {
      return;
    }

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: selectedPlan, paymentGateway: 'stripe' }),
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const { subscriptionId, clientSecret } = await response.json();

      const cardElement = stripeElements.getElement('card');
      const { error: stripeError, paymentIntent } = await stripeInstance.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: user?.name || '',
              email: user?.email || '',
            },
          },
        }
      );

      if (stripeError) {
        toast.error(stripeError.message);
      } else {
        toast.success('Payment successful! Your subscription is now active.');
        window.location.href = '/profile';
      }
    } catch (error) {
      console.error('Stripe payment error:', error);
      toast.error('Failed to process payment');
    }
  };

  return (
    <div className="min-h-screen py-12 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Choose the plan that's right for you
          </p>
          
          {/* Payment Gateway Selector */}
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={() => {
                setPaymentGateway('stripe');
                setShowStripeForm(false);
              }}
              className={`px-4 py-2 rounded-lg transition-all ${
                paymentGateway === 'stripe'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Pay with Stripe
            </button>
            <button
              onClick={() => {
                setPaymentGateway('razorpay');
                setShowStripeForm(false);
              }}
              className={`px-4 py-2 rounded-lg transition-all ${
                paymentGateway === 'razorpay'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Pay with Razorpay
            </button>
          </div>
        </div>

        {showStripeForm ? (
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Enter Payment Details
            </h2>
            <StripeCardElement onReady={handleStripeElementsReady} />
            <button
              onClick={handleStripeSubmit}
              className="w-full mt-4 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Pay Now
            </button>
            <button
              onClick={() => setShowStripeForm(false)}
              className="w-full mt-2 py-2 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PricingCard
              plan="Free"
              price="0"
              period="month"
              features={[
                'Access to GPT-4o Mini',
                '20,000 tokens per month',
                'Basic chat features',
                'Community support',
              ]}
              planId="free"
              onSelectPlan={handleSelectPlan}
            />
            <PricingCard
              plan="Pro Monthly"
              price="20"
              period="month"
              features={[
                'Everything in Free, plus:',
                'Access to GPT-4.1',
                'Access to Claude 4 Sonnet',
                'Access to Gemini 2.5 Pro',
                '2M tokens for GPT-4o Mini',
                '50K tokens for GPT-4.1',
                '100K tokens for Claude 4',
                '200K tokens for Gemini Pro',
                'Priority support',
              ]}
              isPopular
              planId="pro_monthly"
              onSelectPlan={handleSelectPlan}
            />
            <PricingCard
              plan="Pro Yearly"
              price="192"
              period="year"
              features={[
                'Everything in Pro Monthly',
                '20% discount vs monthly',
                'Lock in current pricing',
                'Premium support',
              ]}
              planId="pro_yearly"
              onSelectPlan={handleSelectPlan}
            />
          </div>
        )}
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
} 