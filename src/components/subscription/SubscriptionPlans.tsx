'use client';

import React, { useState } from 'react';
import { Check, Crown, Star } from 'lucide-react';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  description: string;
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'monthly',
    description: 'Perfect for getting started',
    features: [
      'Limited AI model access',
      'Basic search functionality',
      'Community support',
      'Standard rate limits',
    ],
  },
  {
    id: 'pro_monthly',
    name: 'Pro Monthly',
    price: 20,
    interval: 'monthly',
    description: 'For professionals and power users',
    features: [
      'Unlimited AI model access',
      'Advanced search features',
      'Priority support',
      'Higher rate limits',
      'Export capabilities',
      'API access',
    ],
    popular: true,
  },
  {
    id: 'pro_yearly',
    name: 'Pro Yearly',
    price: 16,
    interval: 'yearly',
    description: 'Best value for committed users',
    features: [
      'All Pro Monthly features',
      '20% savings ($192/year)',
      'Priority feature requests',
      'Advanced analytics',
      'Custom integrations',
    ],
  },
];

interface SubscriptionPlansProps {
  currentPlan?: string;
  onSelectPlan: (planId: string) => void;
}

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  currentPlan = 'free',
  onSelectPlan,
}) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    if (planId === currentPlan) return;
    
    setLoading(planId);
    try {
      await onSelectPlan(planId);
    } catch (error) {
      toast.error('Failed to select plan');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Choose Your Plan
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Select the perfect plan for your AI search needs
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl border-2 p-8 shadow-lg transition-all duration-200 hover:shadow-xl ${
              plan.popular
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            } ${
              currentPlan === plan.id
                ? 'ring-2 ring-blue-500'
                : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium bg-blue-500 text-white">
                  <Star className="w-4 h-4 mr-1" />
                  Most Popular
                </span>
              </div>
            )}

            <div className="text-center mb-8">
              {plan.id !== 'free' && (
                <Crown className="w-8 h-8 text-yellow-500 mx-auto mb-4" />
              )}
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {plan.name}
              </h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  ${plan.price}
                </span>
                <span className="text-gray-600 dark:text-gray-300">
                  /{plan.interval === 'yearly' ? 'month' : plan.interval}
                </span>
                {plan.interval === 'yearly' && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Billed annually
                  </div>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                {plan.description}
              </p>
            </div>

            <ul className="space-y-4 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelectPlan(plan.id)}
              disabled={loading === plan.id || currentPlan === plan.id}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                currentPlan === plan.id
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                  : plan.popular
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : plan.id === 'free'
                  ? 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
                  : 'bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900'
              }`}
            >
              {loading === plan.id ? (
                'Processing...'
              ) : currentPlan === plan.id ? (
                'Current Plan'
              ) : plan.id === 'free' ? (
                'Get Started'
              ) : (
                'Upgrade Now'
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}; 