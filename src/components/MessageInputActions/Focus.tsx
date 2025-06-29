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
  Home,
  X,
  Search,
  Sparkles,
  Code,
  Gamepad2,
  Heart,
  Music,
  Camera,
  Dumbbell,
  GraduationCap,
  Users,
  Building,
  Zap,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogPanel,
  Transition,
} from '@headlessui/react';
import React, { Fragment, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const templateCategories = [
  {
    name: 'Escape Artist',
    icon: '✈️',
    templates: [
      {
        key: 'escapeArtistSearch',
        title: 'Escape Artist',
        description: 'Offshore strategies & international living',
        icon: <Plane size={16} className="stroke-[1.5]" />,
        greeting: 'Your offshore strategy and international living expert!',
        subtitle: 'I can help with offshore banking, expat lifestyle, tax optimization, and global mobility strategies.',
        quickPrompts: [
          'Best offshore banking jurisdictions',
          'Countries with favorable tax policies for expats',
          'How to obtain a second passport legally',
          'Setting up an international business',
          'Expat-friendly countries for retirement',
          'Legal tax optimization strategies'
        ]
      },
    ]
  },
];

// Flatten for easy lookup
const allTemplates = templateCategories.flatMap(category => category.templates);

export interface FocusRef {
  openTemplatePopup: () => void;
}

const Focus = React.forwardRef<FocusRef, {
  focusMode: string;
  setFocusMode: (mode: string) => void;
}>(({
  focusMode,
  setFocusMode,
}, ref) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const currentTemplate = allTemplates.find((template) => template.key === focusMode);
  
  // Filter templates based on search query and category
  const filteredCategories = templateCategories.map(category => ({
    ...category,
    templates: category.templates.filter(template => {
      const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || category.name === selectedCategory;
      return matchesSearch && matchesCategory;
    })
  })).filter(category => category.templates.length > 0);
  
  const handleTemplateSelect = (templateKey: string) => {
    setIsOpen(false);
    setSearchQuery('');
    setSelectedCategory('all');
    
    // Always navigate with the template parameter to ensure state consistency
    const templateParam = templateKey !== 'escapeArtistSearch' ? `?template=${templateKey}` : '';
    
    if (pathname !== '/') {
      // If not on home page, navigate to home page with the selected template
      router.push(`/${templateParam}`);
    } else {
      // If already on home page, update URL with template parameter or navigate to clean URL
      if (templateParam) {
        router.push(`/${templateParam}`);
      } else {
        router.push('/');
      }
    }
  };

  // Expose the openTemplatePopup function via ref
  React.useImperativeHandle(ref, () => ({
    openTemplatePopup: () => setIsOpen(true)
  }));
  
  return (
    <>
      {currentTemplate ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/40 dark:border-gray-700/40 hover:bg-white/80 dark:hover:bg-gray-700/80 hover:border-gray-300/60 dark:hover:border-gray-600/60 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md"
          title={currentTemplate.title}
        >
          <div className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
            {React.cloneElement(currentTemplate.icon as React.ReactElement, { 
              size: 16, 
              className: "stroke-[1.5]" 
            })}
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
            {currentTemplate.title}
          </span>
          <ChevronDown size={14} className="text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors stroke-[1.5]" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-center w-9 h-9 rounded-xl bg-gray-100/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/40 dark:border-gray-700/40 hover:bg-white/80 dark:hover:bg-gray-700/80 hover:border-gray-300/60 dark:hover:border-gray-600/60 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md"
          title="Choose Template"
        >
          <div className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
            <Target size={16} className="stroke-[1.5]" />
          </div>
        </button>
      )}

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setIsOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="min-h-full">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4"
                enterTo="opacity-100 translate-y-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-4"
              >
                <DialogPanel className="w-full h-full min-h-screen bg-gradient-to-br from-gray-50/50 via-white to-blue-50/30 dark:from-gray-900/50 dark:via-gray-950 dark:to-blue-950/30">
                  {/* Header */}
                  <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/40 dark:border-gray-700/40">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                      <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-sm">
                            <Sparkles size={16} />
                          </div>
                          <div>
                            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Templates
                            </h1>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsOpen(false)}
                          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
                    {/* Search and Filters */}
                    <div className="mb-8 space-y-6">
                      <div className="max-w-2xl">
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                          <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                          />
                        </div>
                      </div>
                      
                      {/* Category Filter */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <button
                          onClick={() => setSelectedCategory('all')}
                          className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                            selectedCategory === 'all'
                              ? 'bg-blue-500 text-white shadow-md'
                              : 'bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60'
                          )}
                        >
                          All
                        </button>
                        {templateCategories.map((category) => (
                          <button
                            key={category.name}
                            onClick={() => setSelectedCategory(category.name)}
                            className={cn(
                              'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2',
                              selectedCategory === category.name
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60'
                            )}
                          >
                            <span className="text-sm">{category.icon}</span>
                            <span>{category.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Templates Grid */}
                    <div className="space-y-10">
                      {selectedCategory === 'all' ? (
                        // Show all templates without category headers when "All" is selected
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                          {filteredCategories.flatMap(category => category.templates).map((template) => (
                            <button
                              onClick={() => handleTemplateSelect(template.key)}
                              key={template.key}
                              className={cn(
                                'group relative flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-300 text-center backdrop-blur-sm',
                                focusMode === template.key
                                  ? 'bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-700/60 text-blue-700 dark:text-blue-300 shadow-lg scale-105'
                                  : 'bg-white/60 dark:bg-gray-800/40 border border-gray-200/40 dark:border-gray-700/40 hover:bg-white dark:hover:bg-gray-800/60 hover:border-gray-300/60 dark:hover:border-gray-600/60 hover:shadow-lg hover:scale-105 text-gray-700 dark:text-gray-300',
                              )}
                            >
                              <div className={cn(
                                'flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300',
                                focusMode === template.key
                                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md'
                                  : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-600 dark:text-gray-400 group-hover:from-gray-200 group-hover:to-gray-300 dark:group-hover:from-gray-600 dark:group-hover:to-gray-700',
                              )}>
                                {React.cloneElement(template.icon as React.ReactElement, { 
                                  size: 16, 
                                  className: "stroke-[1.5]" 
                                })}
                              </div>
                              <div className="space-y-1">
                                <p className="font-medium text-sm leading-tight">
                                  {template.title}
                                </p>
                                <p className={cn(
                                  "text-xs leading-relaxed line-clamp-2",
                                  focusMode === template.key
                                    ? 'text-blue-600/70 dark:text-blue-400/70'
                                    : 'text-gray-500 dark:text-gray-400'
                                )}>
                                  {template.description}
                                </p>
                              </div>
                              {focusMode === template.key && (
                                <div className="absolute top-3 right-3">
                                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white shadow-md">
                                    <Check size={12} className="stroke-[2]" />
                                  </div>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      ) : (
                        // Show templates grouped by categories when a specific category is selected
                        filteredCategories.map((category, categoryIndex) => (
                          <div key={categoryIndex}>
                            <div className="flex items-center gap-3 mb-6">
                              <span className="text-xl">{category.icon}</span>
                              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {category.name}
                              </h2>
                              <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent dark:from-gray-700"></div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                              {category.templates.map((template) => (
                                <button
                                  onClick={() => handleTemplateSelect(template.key)}
                                  key={template.key}
                                  className={cn(
                                    'group relative flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-300 text-center backdrop-blur-sm',
                                    focusMode === template.key
                                      ? 'bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-700/60 text-blue-700 dark:text-blue-300 shadow-lg scale-105'
                                      : 'bg-white/60 dark:bg-gray-800/40 border border-gray-200/40 dark:border-gray-700/40 hover:bg-white dark:hover:bg-gray-800/60 hover:border-gray-300/60 dark:hover:border-gray-600/60 hover:shadow-lg hover:scale-105 text-gray-700 dark:text-gray-300',
                                  )}
                                >
                                  <div className={cn(
                                    'flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300',
                                    focusMode === template.key
                                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md'
                                      : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-600 dark:text-gray-400 group-hover:from-gray-200 group-hover:to-gray-300 dark:group-hover:from-gray-600 dark:group-hover:to-gray-700',
                                  )}>
                                    {React.cloneElement(template.icon as React.ReactElement, { 
                                      size: 16, 
                                      className: "stroke-[1.5]" 
                                    })}
                                  </div>
                                  <div className="space-y-1">
                                    <p className="font-medium text-sm leading-tight">
                                      {template.title}
                                    </p>
                                    <p className={cn(
                                      "text-xs leading-relaxed line-clamp-2",
                                      focusMode === template.key
                                        ? 'text-blue-600/70 dark:text-blue-400/70'
                                        : 'text-gray-500 dark:text-gray-400'
                                    )}>
                                      {template.description}
                                    </p>
                                  </div>
                                  {focusMode === template.key && (
                                    <div className="absolute top-3 right-3">
                                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white shadow-md">
                                        <Check size={12} className="stroke-[2]" />
                                      </div>
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    {filteredCategories.length === 0 && (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <Search className="text-gray-400 dark:text-gray-500" size={20} />
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          No templates found matching &quot;{searchQuery}&quot;
                          {selectedCategory !== 'all' && ` in ${selectedCategory}`}
                        </p>
                      </div>
                    )}
                  </div>
                </DialogPanel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
});

Focus.displayName = 'Focus';

export default Focus;
export { templateCategories, allTemplates };
