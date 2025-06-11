'use client';

import React from 'react';
import { AlertCircle, LogIn } from 'lucide-react';

interface GuestLimitWarningProps {
  currentCount: number;
  maxCount: number;
  onLoginClick: () => void;
}

export const GuestLimitWarning: React.FC<GuestLimitWarningProps> = ({
  currentCount,
  maxCount,
  onLoginClick,
}) => {
  const remaining = maxCount - currentCount;
  
  if (remaining <= 0) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="text-red-500 mt-0.5" size={20} />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Chat limit reached
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              You&apos;ve used all {maxCount} guest chats. Sign in to continue chatting without limits.
            </p>
            <button
              onClick={onLoginClick}
              className="mt-3 inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-2 rounded-md transition-colors"
            >
              <LogIn size={16} />
              <span>Sign In</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (remaining === 1) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="text-yellow-500 mt-0.5" size={20} />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Last guest chat
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              This is your final guest chat. Sign in to unlock unlimited conversations.
            </p>
            <button
              onClick={onLoginClick}
              className="mt-3 inline-flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium px-3 py-2 rounded-md transition-colors"
            >
              <LogIn size={16} />
              <span>Sign In</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}; 