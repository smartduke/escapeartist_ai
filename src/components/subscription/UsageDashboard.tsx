'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, Zap, TrendingUp, AlertTriangle } from 'lucide-react';

interface Usage {
  id: number;
  model: string;
  tokensUsed: number;
  periodStart: string;
  periodEnd: string;
}

interface UsageData {
  usage: Usage[];
  limits: Record<string, number>;
  plan: string;
}

export const UsageDashboard: React.FC = () => {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    try {
      const response = await fetch('/api/usage');
      if (response.ok) {
        const data = await response.json();
        setUsageData(data);
      }
    } catch (error) {
      console.error('Failed to fetch usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!usageData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">
          Failed to load usage data
        </p>
      </div>
    );
  }

  const getUsageByModel = () => {
    const usageByModel: Record<string, number> = {};
    
    usageData.usage.forEach(usage => {
      usageByModel[usage.model] = (usageByModel[usage.model] || 0) + usage.tokensUsed;
    });
    
    return usageByModel;
  };

  const usageByModel = getUsageByModel();
  
  // Calculate totals only for the 4 primary models
  const primaryModels = ['gpt_4o_mini', 'gpt_4_1', 'claude_sonnet_4', 'gemini_2_5_pro'];
  const totalTokensUsed = primaryModels.reduce((sum, model) => sum + (usageByModel[model] || 0), 0);
  const totalLimit = primaryModels.reduce((sum, model) => sum + (usageData.limits[model] || 0), 0);

  const getUsagePercentage = (used: number, limit: number) => {
    return limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 75) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <BarChart3 className="w-6 h-6 mr-2" />
          Usage Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Monitor your token usage across different AI models
        </p>
      </div>

      {/* Plan Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Current Plan
            </h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 capitalize">
              {usageData.plan.replace('_', ' ')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total Usage This Month
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalTokensUsed.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              of {totalLimit.toLocaleString()} tokens
            </p>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Overall Usage</span>
            <span className={getStatusColor(getUsagePercentage(totalTokensUsed, totalLimit))}>
              {getUsagePercentage(totalTokensUsed, totalLimit).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getBarColor(getUsagePercentage(totalTokensUsed, totalLimit))}`}
              style={{ width: `${getUsagePercentage(totalTokensUsed, totalLimit)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Model Usage */}
      <div className="grid gap-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Zap className="w-5 h-5 mr-2" />
          Usage by Model
        </h3>

        {Object.keys(usageByModel).length === 0 ? (
          <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">
              No usage data available for this month
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Show only the 4 primary models */}
            {['gpt_4o_mini', 'gpt_4_1', 'claude_sonnet_4', 'gemini_2_5_pro'].map((model) => {
              const limit = usageData.limits[model] || 0;
              const used = usageByModel[model] || 0;
              const percentage = getUsagePercentage(used, limit);
              const remaining = Math.max(0, limit - used);

              return (
                <div
                  key={model}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {model === 'gpt_4o_mini' ? 'GPT-4o Mini' :
                         model === 'gpt_4_1' ? 'GPT-4.1' :
                         model === 'claude_sonnet_4' ? 'Claude 4 Sonnet' :
                         model === 'gemini_2_5_pro' ? 'Gemini 2.5 Pro' :
                         model.replace(/[-_]/g, ' ')}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {used.toLocaleString()} / {limit.toLocaleString()} tokens
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${getStatusColor(percentage)}`}>
                        {percentage.toFixed(1)}%
                      </div>
                      {percentage >= 90 && (
                        <div className="flex items-center text-red-500 text-sm">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Near limit
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getBarColor(percentage)}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Used: {used.toLocaleString()}</span>
                    <span>Remaining: {remaining.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Usage Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start">
          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Usage Tips
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Token usage resets at the beginning of each billing cycle</li>
              <li>• Consider upgrading to Pro for higher limits</li>
              <li>• Monitor usage regularly to avoid hitting limits</li>
              {usageData.plan === 'free' && (
                <li>• Free plan limits are designed for evaluation purposes</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}; 