'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { UsageDashboard } from '@/components/subscription/UsageDashboard';
import { User, CreditCard, BarChart3, Settings, Mail, Calendar, Crown } from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionData {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
}

const ProfileSection = ({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
    <div className="flex items-center space-x-3 mb-6">
      <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
    </div>
    {children}
  </div>
);

const StatCard = ({ label, value, color = 'blue' }: {
  label: string;
  value: string | number;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-75">{label}</div>
    </div>
  );
};

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'subscription' | 'usage' | 'settings'>('overview');

  useEffect(() => {
    if (!isLoading && user) {
      fetchSubscription();
    } else if (!isLoading && !user) {
      // Redirect to pricing page if not authenticated
      window.location.href = '/pricing';
    }
  }, [user, isLoading]);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to Pro features at the end of your current billing period.')) {
      return;
    }

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: 'free' }),
      });

      if (response.ok) {
        toast.success('Subscription cancelled successfully');
        await fetchSubscription();
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Cancel subscription error:', error);
      toast.error('Failed to cancel subscription');
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-light-primary dark:bg-dark-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const isPro = subscription?.plan !== 'free';
  const planDisplayName = subscription?.plan 
    ? subscription.plan.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    : 'Free';

  return (
    <div className="min-h-screen bg-light-primary dark:bg-dark-primary">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account, subscription, and usage
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'subscription', label: 'Subscription', icon: CreditCard },
            { id: 'usage', label: 'Usage', icon: BarChart3 },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* User Info */}
              <ProfileSection title="Account Information" icon={User}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={user.email || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={user.name || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </ProfileSection>

              {/* Quick Stats */}
              <ProfileSection title="Quick Stats" icon={BarChart3}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard 
                    label="Current Plan" 
                    value={planDisplayName}
                    color={isPro ? 'green' : 'blue'}
                  />
                  <StatCard 
                    label="Status" 
                    value={subscription?.status || 'Active'}
                    color="green"
                  />
                  <StatCard 
                    label="Member Since" 
                    value="Dec 2024"
                    color="blue"
                  />
                  <StatCard 
                    label="Total Searches" 
                    value="156"
                    color="yellow"
                  />
                </div>
              </ProfileSection>
            </>
          )}

          {activeTab === 'subscription' && (
            <ProfileSection title="Subscription Management" icon={CreditCard}>
              <div className="space-y-6">
                {/* Current Plan */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {isPro ? (
                      <Crown className="w-6 h-6 text-yellow-500" />
                    ) : (
                      <User className="w-6 h-6 text-gray-500" />
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {planDisplayName} Plan
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Status: {subscription?.status || 'Active'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {subscription?.currentPeriodEnd && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {isPro ? 'Renews' : 'Valid until'}: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => window.location.href = '/pricing'}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    {isPro ? 'Change Plan' : 'Upgrade to Pro'}
                  </button>
                  {isPro && (
                    <button
                      onClick={handleCancelSubscription}
                      className="px-6 py-2 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium"
                    >
                      Cancel Subscription
                    </button>
                  )}
                </div>

                {/* Billing History Placeholder */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Billing History</h3>
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No billing history available
                  </div>
                </div>
              </div>
            </ProfileSection>
          )}

          {activeTab === 'usage' && (
            <ProfileSection title="Usage Analytics" icon={BarChart3}>
              <UsageDashboard />
            </ProfileSection>
          )}

          {activeTab === 'settings' && (
            <>
              {/* Blog Export Settings */}
              <ProfileSection title="Blog Export Settings" icon={Settings}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Default Blog Export Model
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      onChange={(e) => {
                        const [provider, model] = e.target.value.split('|');
                        localStorage.setItem('blogExportModel', model);
                        localStorage.setItem('blogExportModelProvider', provider);
                        toast.success('Blog export model updated successfully');
                      }}
                      defaultValue={`${localStorage.getItem('blogExportModelProvider') || 'openai'}|${localStorage.getItem('blogExportModel') || 'gpt-4.1'}`}
                    >
                      <option value="openai|gpt-4.1">GPT-4.1 (Most capable)</option>
                      <option value="anthropic|claude-sonnet-4-20250514">Claude Sonnet (Balanced performance)</option>
                      <option value="openai|gpt-4o-mini">GPT-4o Mini (Fast & efficient)</option>
                    </select>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Select your preferred model for blog exports. This will be used as the default model when exporting blogs.
                    </p>
                  </div>
                </div>
              </ProfileSection>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 