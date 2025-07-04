'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { UsageDashboard } from '@/components/subscription/UsageDashboard';
import { User, CreditCard, BarChart3, Settings, Mail, Calendar, Crown, Edit3, Lock, Save, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

interface SubscriptionData {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
}

interface ProfileFormData {
  name: string;
  email: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ProfileSection = ({ title, icon: Icon, children, className = "" }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 shadow-xl shadow-gray-100/25 dark:shadow-gray-900/25 ${className}`}>
    <div className="flex items-center space-x-3 mb-6">
      <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
        <Icon className="w-5 h-5 text-white" />
      </div>
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
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200/50 dark:border-blue-700/50 text-blue-700 dark:text-blue-300',
    green: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200/50 dark:border-green-700/50 text-green-700 dark:text-green-300',
    yellow: 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200/50 dark:border-yellow-700/50 text-yellow-700 dark:text-yellow-300',
    red: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200/50 dark:border-red-700/50 text-red-700 dark:text-red-300'
  };

  return (
    <div className={`rounded-xl border p-6 transition-all duration-200 hover:scale-105 ${colorClasses[color]}`}>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-75">{label}</div>
    </div>
  );
};

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'settings'>('overview');
  
  // Edit Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileFormData>({ name: '', email: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Password Update State
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    if (!isLoading && user) {
      fetchSubscription();
      setProfileForm({
        name: user.name || '',
        email: user.email || ''
      });
    } else if (!isLoading && !user) {
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;

    setProfileLoading(true);
    try {
      // Update user metadata in Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          name: profileForm.name
        }
      });

      if (error) throw error;

      toast.success('Profile updated successfully');
      setIsEditingProfile(false);
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Password update error:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isPro = subscription?.plan !== 'free';
  const planDisplayName = subscription?.plan 
    ? subscription.plan.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    : 'Free';

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Premium Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
            Your Profile
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Manage your account settings, subscription, and track your usage with our premium dashboard
          </p>
        </div>

        {/* Premium Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl p-1.5 border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'usage', label: 'Usage', icon: BarChart3 },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'overview' && (
            <>
              {/* User Info */}
              <ProfileSection title="Account Information" icon={User}>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={user.email || ''}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <User className="w-4 h-4 inline mr-2" />
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={user.name || ''}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <span className="text-4xl font-bold text-white">
                          {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{user.name || 'User'}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                    </div>
                  </div>
                </div>
              </ProfileSection>

              {/* Quick Stats */}
              <ProfileSection title="Account Statistics" icon={BarChart3}>
                <div className="grid grid-cols-2 gap-6">
                  <StatCard 
                    label="Current Plan" 
                    value={planDisplayName}
                    color={isPro ? 'green' : 'blue'}
                  />
                  <StatCard 
                    label="Account Status" 
                    value={subscription?.status || 'Active'}
                    color="green"
                  />
                </div>
              </ProfileSection>

              {/* Subscription Management */}
              <ProfileSection title="Subscription Management" icon={CreditCard}>
                <div className="space-y-8">
                  {/* Current Plan */}
                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl">
                        {isPro ? (
                          <Crown className="w-6 h-6 text-white" />
                        ) : (
                          <User className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {planDisplayName} Plan
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Status: <span className="text-green-600 dark:text-green-400 font-medium">{subscription?.status || 'Active'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {subscription?.currentPeriodEnd && (
                        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">
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
                      className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all duration-200 hover:scale-105"
                    >
                      {isPro ? 'Change Plan' : 'Upgrade to Pro'}
                    </button>
                    {isPro && (
                      <button
                        onClick={handleCancelSubscription}
                        className="px-8 py-3 border-2 border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium transition-all duration-200 hover:scale-105"
                      >
                        Cancel Subscription
                      </button>
                    )}
                  </div>

                  {/* Billing History */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Billing History</h3>
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-700/25 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
                      <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No billing history available</p>
                    </div>
                  </div>
                </div>
              </ProfileSection>
            </>
          )}



          {activeTab === 'usage' && (
            <ProfileSection title="Usage Analytics" icon={BarChart3}>
              <UsageDashboard showModelUsage={isPro} />
            </ProfileSection>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8">
              {/* Edit Profile Section */}
              <ProfileSection title="Edit Profile" icon={Edit3}>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                        disabled={!isEditingProfile}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50 dark:disabled:bg-gray-700/50"
                        placeholder="Enter your display name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profileForm.email}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white transition-all"
                        placeholder="Email cannot be changed"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-4">
                    {!isEditingProfile ? (
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(true)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all duration-200 hover:scale-105 flex items-center space-x-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit Profile</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="submit"
                          disabled={profileLoading}
                          className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-medium shadow-lg shadow-green-500/25 transition-all duration-200 hover:scale-105 flex items-center space-x-2 disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          <span>{profileLoading ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingProfile(false);
                            setProfileForm({
                              name: user?.name || '',
                              email: user?.email || ''
                            });
                          }}
                          className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl font-medium transition-all duration-200"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </ProfileSection>

              {/* Password Update Section */}
              <ProfileSection title="Change Password" icon={Lock}>
                <form onSubmit={handleUpdatePassword} className="space-y-6">
                  <div className="grid gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                          placeholder="Enter new password"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                          placeholder="Confirm new password"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={passwordLoading || !passwordForm.newPassword || !passwordForm.confirmPassword}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all duration-200 hover:scale-105 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{passwordLoading ? 'Updating...' : 'Update Password'}</span>
                  </button>
                  
                  <div className="text-sm text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
                    <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">Password Requirements:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-600 dark:text-blue-400">
                      <li>Minimum 6 characters long</li>
                      <li>Use a combination of letters, numbers, and symbols</li>
                      <li>Avoid using personal information</li>
                    </ul>
                  </div>
                </form>
              </ProfileSection>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 