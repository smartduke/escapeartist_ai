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
    <div className="relative flex items-center gap-1">
      {OptimizationModes.map((mode) => {
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
                'flex items-center justify-center w-9 h-9 rounded-xl backdrop-blur-sm border transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md',
                isActive
                  ? 'bg-white/80 dark:bg-white/10 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-400/30'
                  : 'bg-gray-100/60 dark:bg-gray-800/60 border-gray-200/40 dark:border-gray-700/40 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700/80 hover:border-gray-300/60 dark:hover:border-gray-600/60'
              )}
            >
              <Icon size={16} className="flex-shrink-0 stroke-[1.5]" />
            </button>
            
            {/* Simple Clean Tooltip */}
            {isHovered && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
                <div className="bg-gray-900 text-white text-xs rounded-md px-2 py-1.5 whitespace-nowrap shadow-lg">
                  <div className="font-medium">{mode.title}</div>
                  <div className="text-gray-300 text-[10px] mt-0.5">{mode.description}</div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Optimization;
