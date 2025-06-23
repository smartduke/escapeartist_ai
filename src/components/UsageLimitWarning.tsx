import React, { useState, useEffect } from 'react';
import { AlertTriangle, BarChart3, Zap } from 'lucide-react';

interface UsageData {
  usage: Array<{
    model: string;
    tokensUsed: number;
  }>;
  limits: Record<string, number>;
  plan: string;
}

interface UsageLimitWarningProps {
  userId?: string;
  modelName?: string;
}

export const UsageLimitWarning: React.FC<UsageLimitWarningProps> = ({ userId, modelName }) => {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUsageData();
    }
  }, [userId]);

  const fetchUsageData = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/usage');
      if (response.ok) {
        const data = await response.json();
        setUsageData(data);
        
        // Check if user is near any limits
        const isNearLimit = checkIfNearLimits(data);
        setShowWarning(isNearLimit);
      }
    } catch (error) {
      console.error('Failed to fetch usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfNearLimits = (data: UsageData): boolean => {
    if (!data.usage || !data.limits) return false;
    
    // Group usage by model
    const usageByModel: Record<string, number> = {};
    data.usage.forEach(usage => {
      usageByModel[usage.model] = (usageByModel[usage.model] || 0) + usage.tokensUsed;
    });

    // Check if any model is above 80% usage
    for (const [model, limit] of Object.entries(data.limits)) {
      const used = usageByModel[model] || 0;
      const percentage = limit > 0 ? (used / limit) * 100 : 0;
      if (percentage >= 80) {
        return true;
      }
    }
    
    return false;
  };

  const getModelUsageInfo = (model: string) => {
    if (!usageData) return null;
    
    const usageByModel: Record<string, number> = {};
    usageData.usage.forEach(usage => {
      usageByModel[usage.model] = (usageByModel[usage.model] || 0) + usage.tokensUsed;
    });
    
    const used = usageByModel[model] || 0;
    const limit = usageData.limits[model] || 0;
    const percentage = limit > 0 ? (used / limit) * 100 : 0;
    
    return { used, limit, percentage };
  };

  if (!userId || !showWarning || loading) return null;

  const modelInfo = modelName ? getModelUsageInfo(modelName) : null;
  const planName = usageData?.plan?.replace('_', ' ') || 'Free';

  return (
    <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
            Usage Limit Warning
          </h4>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
            You're approaching your token limits for this month.
          </p>
          
          {modelInfo && modelInfo.percentage >= 80 && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-yellow-700 dark:text-yellow-300 mb-1">
                <span className="capitalize">{modelName?.replace(/_/g, ' ')}</span>
                <span>{modelInfo.percentage.toFixed(1)}% used</span>
              </div>
              <div className="w-full bg-yellow-200 dark:bg-yellow-800 rounded-full h-2">
                <div
                  className="bg-yellow-600 dark:bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(modelInfo.percentage, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                <span>{modelInfo.used.toLocaleString()} used</span>
                <span>{(modelInfo.limit - modelInfo.used).toLocaleString()} remaining</span>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-xs">
            <BarChart3 className="w-4 h-4" />
            <span className="text-yellow-700 dark:text-yellow-300">
              Current plan: <span className="font-semibold capitalize">{planName}</span>
            </span>
            {usageData?.plan === 'free' && (
              <>
                <span className="text-yellow-600 dark:text-yellow-400">•</span>
                <a
                  href="/pricing"
                  className="text-yellow-800 dark:text-yellow-200 hover:underline font-medium"
                >
                  Upgrade to Pro
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 