import { SearchCheck, ScanSearch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const OptimizationModes = [
  {
    key: 'speed',
    title: 'Search',
    description: 'Quick and concise answers',
    icon: SearchCheck,
  },
  {
    key: 'balanced',
    title: 'Deep Search',
    description: 'Comprehensive analysis',
    icon: ScanSearch,
  },
];

const Optimization = ({
  optimizationMode,
  setOptimizationMode,
}: {
  optimizationMode: string;
  setOptimizationMode: (mode: string) => void;
}) => {
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);

  return (
    <div className="relative">
      <div className="bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl backdrop-blur-sm border border-gray-200/40 dark:border-gray-700/40 flex">
        {OptimizationModes.map((mode, index) => {
          const Icon = mode.icon;
          const isActive = optimizationMode === mode.key;
          const isHovered = hoveredMode === mode.key;
          
          return (
            <div key={mode.key} className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOptimizationMode(mode.key);
                }}
                onMouseEnter={() => setHoveredMode(mode.key)}
                onMouseLeave={() => setHoveredMode(null)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 ease-in-out',
                  isActive
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                )}
              >
                <Icon size={16} className={cn(
                  'flex-shrink-0 transition-transform duration-300',
                  isActive ? 'stroke-[2]' : 'stroke-[1.5]'
                )} />
                <span className="text-xs font-medium">{mode.title}</span>
              </button>
              
              {/* Enhanced Tooltip */}
              {isHovered && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="bg-gray-900/95 backdrop-blur-sm text-white rounded-lg px-3 py-2 whitespace-nowrap shadow-xl border border-gray-700/50">
                    <div className="font-medium text-sm">{mode.title}</div>
                    <div className="text-gray-300 text-xs mt-0.5 font-light">{mode.description}</div>
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-[6px]">
                    <div className="border-x-[6px] border-x-transparent border-t-[6px] border-t-gray-900/95"></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Optimization;
