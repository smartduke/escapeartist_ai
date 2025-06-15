import { ChevronDown, SearchCheck, ScanSearch } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from '@headlessui/react';
import { Fragment } from 'react';

const OptimizationModes = [
  {
    key: 'speed',
    title: 'Search',
    description: 'Get quick and concise answers with fast response time.',
    icon: <SearchCheck size={20} className="text-[#FF9800]" />,
  },
  {
    key: 'balanced',
    title: 'Deep Search',
    description: 'Get comprehensive, detailed analysis with in-depth explanations',
    icon: <ScanSearch size={20} className="text-[#4CAF50]" />,
  },
];

const Optimization = ({
  optimizationMode,
  setOptimizationMode,
}: {
  optimizationMode: string;
  setOptimizationMode: (mode: string) => void;
}) => {
  const currentMode = OptimizationModes.find((mode) => mode.key === optimizationMode);
  
  return (
    <Popover className="relative">
      <PopoverButton
        type="button"
        className="group flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all duration-200"
        title={currentMode?.title || 'Search Mode'}
      >
        <div className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
          {currentMode?.key === 'balanced' ? (
            <ScanSearch size={16} className="stroke-[1.5]" />
          ) : (
            <SearchCheck size={16} className="stroke-[1.5]" />
          )}
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
          {currentMode?.title || 'Search'}
        </span>
      </PopoverButton>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-2"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-2"
      >
        <PopoverPanel className="absolute z-10 w-80 right-0 mt-2">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-white/5 overflow-hidden">
            <div className="p-4 space-y-2">
            {OptimizationModes.map((mode, i) => (
              <PopoverButton
                onClick={() => setOptimizationMode(mode.key)}
                key={i}
                className={cn(
                    'w-full p-4 rounded-xl flex items-start gap-4 text-left transition-all duration-200 group',
                  optimizationMode === mode.key
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/60 dark:border-blue-700/60 text-blue-700 dark:text-blue-300 shadow-sm'
                      : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700/50 dark:hover:to-gray-800/50 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100',
                )}
              >
                  <div className={cn(
                    'flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 shadow-sm flex-shrink-0',
                    optimizationMode === mode.key
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-600 dark:text-gray-400 group-hover:from-gray-200 group-hover:to-gray-300 dark:group-hover:from-gray-600 dark:group-hover:to-gray-700',
                  )}>
                    {mode.key === 'balanced' ? (
                      <ScanSearch size={18} className="stroke-[1.5]" />
                    ) : (
                      <SearchCheck size={18} className="stroke-[1.5]" />
                    )}
                </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold text-sm leading-tight">
                      {mode.title}
                    </p>
                    <p className={cn(
                      "text-xs leading-relaxed font-medium",
                      optimizationMode === mode.key
                        ? 'text-blue-600/70 dark:text-blue-400/70'
                        : 'text-gray-500 dark:text-gray-400'
                    )}>
                  {mode.description}
                </p>
                  </div>
              </PopoverButton>
            ))}
            </div>
          </div>
        </PopoverPanel>
      </Transition>
    </Popover>
  );
};

export default Optimization;
