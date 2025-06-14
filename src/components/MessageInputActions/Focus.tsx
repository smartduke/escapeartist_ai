import {
  Atom,
  ChevronDown,
  Globe2,
  Lightbulb,
  Pencil,
  Target,
  MessageCircle,
  BookText,
  Check,
  Newspaper,
  ShoppingCart,
  Stethoscope,
  TrendingUp,
  Plane,
  Briefcase,
  Scale,
  ChefHat,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from '@headlessui/react';
import { Fragment } from 'react';

const focusModes = [
  {
    key: 'webSearch',
    title: 'All Sources',
    description: 'Searches across all of the internet',
    icon: <Globe2 size={14} className="stroke-[1.5]" />,
  },
  {
    key: 'academicSearch',
    title: 'Academic Papers',
    description: 'Search in published academic papers',
    icon: <BookText size={14} className="stroke-[1.5]" />,
  },
  {
    key: 'writingAssistant',
    title: 'Writing Assistant',
    description: 'Chat without searching the web',
    icon: <Pencil size={14} className="stroke-[1.5]" />,
  },
  {
    key: 'wolframAlphaSearch',
    title: 'Wolfram Alpha',
    description: 'Computational knowledge engine',
    icon: <Atom size={14} className="stroke-[1.5]" />,
  },
  {
    key: 'youtubeSearch',
    title: 'Youtube',
    description: 'Search and watch videos',
    icon: <Lightbulb size={14} className="stroke-[1.5]" />,
  },
  {
    key: 'redditSearch',
    title: 'Reddit',
    description: 'Search for discussions and opinions',
    icon: <MessageCircle size={14} className="stroke-[1.5]" />,
  },
  {
    key: 'newsSearch',
    title: 'News',
    description: 'Get current news and breaking stories',
    icon: <Newspaper size={14} className="stroke-[1.5]" />,
  },
  {
    key: 'shoppingSearch',
    title: 'Shopping',
    description: 'Find products and compare prices',
    icon: <ShoppingCart size={14} className="stroke-[1.5]" />,
  },
  {
    key: 'medicalSearch',
    title: 'Medical',
    description: 'Search medical information and research',
    icon: <Stethoscope size={14} className="stroke-[1.5]" />,
  },
  {
    key: 'financeSearch',
    title: 'Finance',
    description: 'Financial news and market information',
    icon: <TrendingUp size={14} className="stroke-[1.5]" />,
  },
  {
    key: 'travelSearch',
    title: 'Travel',
    description: 'Find travel destinations and tips',
    icon: <Plane size={14} className="stroke-[1.5]" />,
  },
  {
    key: 'jobSearch',
    title: 'Jobs',
    description: 'Career information and job search',
    icon: <Briefcase size={14} className="stroke-[1.5]" />,
  },
  {
    key: 'legalSearch',
    title: 'Legal',
    description: 'Legal information and guidance',
    icon: <Scale size={14} className="stroke-[1.5]" />,
  },
  {
    key: 'recipeSearch',
    title: 'Recipes',
    description: 'Find recipes and cooking instructions',
    icon: <ChefHat size={14} className="stroke-[1.5]" />,
  },
  {
    key: 'realEstateSearch',
    title: 'Real Estate',
    description: 'Property information and market trends',
    icon: <Home size={14} className="stroke-[1.5]" />,
  },
];

const Focus = ({
  focusMode,
  setFocusMode,
}: {
  focusMode: string;
  setFocusMode: (mode: string) => void;
}) => {
  return (
    <Popover className="relative">
      <PopoverButton
        type="button"
        className="group flex items-center gap-1.5 px-2 py-1.5 text-black/50 dark:text-white/50 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all duration-200 hover:text-black dark:hover:text-white"
      >
        {focusMode !== 'webSearch' ? (
          <>
            {focusModes.find((mode) => mode.key === focusMode)?.icon}
            <p className="text-xs font-medium hidden lg:block">
              {focusModes.find((mode) => mode.key === focusMode)?.title}
            </p>
            <ChevronDown size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
          </>
        ) : (
          <>
            <Target size={14} className="stroke-[1.5]" />
            <p className="text-xs font-medium hidden lg:block">Focus</p>
            <ChevronDown size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
          </>
        )}
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
        <PopoverPanel className="absolute z-10 w-64 left-0 mt-1">
          <div className="bg-light-primary dark:bg-dark-primary border rounded-lg border-black/5 dark:border-white/5 shadow-lg shadow-black/5 dark:shadow-white/5 w-full overflow-hidden divide-y divide-black/5 dark:divide-white/5 max-h-80 overflow-y-auto">
            {focusModes.map((mode, i) => (
              <PopoverButton
                onClick={() => setFocusMode(mode.key)}
                key={i}
                className={cn(
                  'w-full flex items-start gap-2 px-2.5 py-2 transition-colors group',
                  focusMode === mode.key
                    ? 'bg-black/5 dark:bg-white/5'
                    : 'hover:bg-black/5 dark:hover:bg-white/5',
                )}
              >
                <div className={cn(
                  'mt-0.5',
                  focusMode === mode.key
                    ? 'text-[#24A0ED]'
                    : 'text-black dark:text-white',
                )}>
                  {mode.icon}
                </div>
                <div className="flex-1 text-left">
                  <p className={cn(
                    "text-xs font-medium",
                    focusMode === mode.key
                      ? 'text-[#24A0ED]'
                      : 'text-black dark:text-white'
                  )}>{mode.title}</p>
                  <p className="text-[11px] text-black/50 dark:text-white/50 line-clamp-1">
                    {mode.description}
                  </p>
                </div>
                {focusMode === mode.key && (
                  <Check size={12} className="text-[#24A0ED] stroke-[1.5] mt-0.5" />
                )}
              </PopoverButton>
            ))}
          </div>
        </PopoverPanel>
      </Transition>
    </Popover>
  );
};

export default Focus;
