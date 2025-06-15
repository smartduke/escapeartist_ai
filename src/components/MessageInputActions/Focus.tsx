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

const templateCategories = [
  {
    name: 'Research',
    icon: '🔍',
    templates: [
  {
    key: 'webSearch',
    title: 'All Sources',
    description: 'Searches across all of the internet',
        icon: <Globe2 size={16} className="stroke-[1.5]" />,
      },
      {
        key: 'newsSearch',
        title: 'News',
        description: 'Current news and breaking stories',
        icon: <Newspaper size={16} className="stroke-[1.5]" />,
        greeting: 'Stay updated with the latest news!',
        subtitle: 'I can find current news, analyze events, and provide context on recent developments.',
        quickPrompts: [
          'What\'s the latest political news?',
          'Recent developments in technology',
          'Today\'s business headlines',
          'Breaking news around the world',
          'Sports news and updates',
          'Entertainment and celebrity news'
        ]
      },
      {
        key: 'academicSearch',
        title: 'Academic',
        description: 'Published academic papers',
        icon: <BookText size={16} className="stroke-[1.5]" />,
        greeting: 'Let\'s explore academic research together!',
        subtitle: 'I can help you find and understand scholarly articles, research papers, and academic content.',
        quickPrompts: [
          'Find recent papers on climate change',
          'Explain machine learning algorithms',
          'Research on renewable energy sources',
          'Latest studies on mental health',
          'Breakthrough discoveries in medicine',
          'Research on artificial intelligence ethics'
        ]
      },
      {
        key: 'medicalSearch',
        title: 'Medical',
        description: 'Health information and research',
        icon: <Stethoscope size={16} className="stroke-[1.5]" />,
        greeting: 'Health information you can trust!',
        subtitle: 'I can provide evidence-based health information and medical research insights.',
        quickPrompts: [
          'Explain symptoms of common conditions',
          'Latest research on nutrition',
          'Mental health resources and tips',
          'Preventive care recommendations',
          'Understanding medication side effects',
          'Exercise and fitness guidelines'
        ]
      },
      {
        key: 'legalSearch',
        title: 'Legal',
        description: 'Legal information and guidance',
        icon: <Scale size={16} className="stroke-[1.5]" />,
        greeting: 'Legal information at your fingertips!',
        subtitle: 'I can provide general legal information and help you understand legal concepts.',
        quickPrompts: [
          'Explain contract law basics',
          'What are tenant rights?',
          'How does copyright law work?',
          'Small business legal requirements',
          'Understanding employment law',
          'Family law and divorce procedures'
        ]
      },
    ]
  },
  {
    name: 'Professional',
    icon: '💼',
    templates: [
      {
        key: 'financeSearch',
        title: 'Finance',
        description: 'Market data and analysis',
        icon: <TrendingUp size={16} className="stroke-[1.5]" />,
        greeting: 'Your financial research assistant!',
        subtitle: 'I can help with market analysis, investment research, and financial education.',
        quickPrompts: [
          'Analyze Apple stock performance',
          'Explain cryptocurrency basics',
          'Compare investment strategies',
          'What are REITs and how do they work?',
          'Personal budgeting and saving tips',
          'Understanding retirement planning'
        ]
      },
      {
        key: 'jobSearch',
        title: 'Jobs',
        description: 'Career and employment',
        icon: <Briefcase size={16} className="stroke-[1.5]" />,
        greeting: 'Let\'s advance your career together!',
        subtitle: 'I can help with job searching, career planning, resume tips, and interview preparation.',
        quickPrompts: [
          'Help me improve my resume',
          'Prepare for a software engineer interview',
          'Career transition advice',
          'Salary negotiation tips',
          'Remote work opportunities',
          'Building a professional network'
        ]
      },
      {
        key: 'realEstateSearch',
        title: 'Real Estate',
        description: 'Property and market trends',
        icon: <Home size={16} className="stroke-[1.5]" />,
        greeting: 'Your real estate research companion!',
        subtitle: 'I can help with property research, market trends, and real estate insights.',
        quickPrompts: [
          'Housing market trends in my area',
          'First-time home buyer tips',
          'Investment property analysis',
          'Real estate market predictions',
          'Home renovation and improvement',
          'Understanding mortgage options'
        ]
      },
      {
        key: 'businessAnalysis',
        title: 'Business',
        description: 'Strategy and market analysis',
        icon: <Building size={16} className="stroke-[1.5]" />,
        greeting: 'Strategic business insights await!',
        subtitle: 'I can help with business strategy, market analysis, and competitive research.',
        quickPrompts: [
          'Analyze market trends in my industry',
          'Create a business plan outline',
          'Competitive analysis framework',
          'Marketing strategy development',
          'Financial projections and modeling',
          'Business growth opportunities'
        ]
      },
    ]
  },
  {
    name: 'Lifestyle',
    icon: '🛍️',
    templates: [
      {
        key: 'shoppingSearch',
        title: 'Shopping',
        description: 'Products and comparisons',
        icon: <ShoppingCart size={16} className="stroke-[1.5]" />,
        greeting: 'Smart shopping starts here!',
        subtitle: 'I can help you research products, compare prices, and make informed purchasing decisions.',
        quickPrompts: [
          'Best laptops under $1000',
          'Compare iPhone vs Samsung phones',
          'Find eco-friendly cleaning products',
          'Best deals on winter clothing',
          'Top-rated kitchen appliances',
          'Budget-friendly home decor ideas'
        ]
      },
      {
        key: 'travelSearch',
        title: 'Travel',
        description: 'Destinations and planning',
        icon: <Plane size={16} className="stroke-[1.5]" />,
        greeting: 'Ready to plan your next adventure!',
        subtitle: 'I can help with travel planning, destination research, and trip recommendations.',
        quickPrompts: [
          'Plan a 7-day trip to Japan',
          'Best beaches in Europe',
          'Budget travel tips for Southeast Asia',
          'Family-friendly destinations in the US',
          'Solo travel safety tips',
          'Best time to visit popular destinations'
        ]
      },
      {
        key: 'recipeSearch',
        title: 'Recipes',
        description: 'Cooking and culinary',
        icon: <ChefHat size={16} className="stroke-[1.5]" />,
        greeting: 'Let\'s cook something delicious!',
        subtitle: 'I can help you find recipes, cooking techniques, and culinary inspiration.',
        quickPrompts: [
          'Easy weeknight dinner recipes',
          'How to make homemade pasta',
          'Healthy meal prep ideas',
          'Baking tips for beginners',
          'Vegetarian and vegan recipes',
          'Quick breakfast ideas for busy mornings'
        ]
      },
      {
        key: 'fitnessSearch',
        title: 'Fitness',
        description: 'Health and exercise',
        icon: <Dumbbell size={16} className="stroke-[1.5]" />,
        greeting: 'Your fitness journey starts here!',
        subtitle: 'I can help with workout plans, nutrition advice, and fitness guidance.',
        quickPrompts: [
          'Create a beginner workout routine',
          'Best exercises for weight loss',
          'Nutrition tips for muscle building',
          'Home workout without equipment',
          'Running training programs',
          'Yoga poses for flexibility'
        ]
      },
    ]
  },
  {
    name: 'Creative',
    icon: '🎨',
    templates: [
      {
        key: 'writingAssistant',
        title: 'Writing',
        description: 'Pure AI assistance',
        icon: <Pencil size={16} className="stroke-[1.5]" />,
        greeting: 'Ready to help you write better!',
        subtitle: 'I can assist with writing, editing, proofreading, and improving your content.',
        quickPrompts: [
          'Help me write a professional email',
          'Improve this paragraph for clarity',
          'Create an outline for my essay',
          'Check grammar and style',
          'Write a compelling cover letter',
          'Creative writing prompts and ideas'
        ]
      },
      {
        key: 'designInspiration',
        title: 'Design',
        description: 'Creative design ideas',
        icon: <Camera size={16} className="stroke-[1.5]" />,
        greeting: 'Let\'s create something beautiful!',
        subtitle: 'I can help with design inspiration, color palettes, and creative concepts.',
        quickPrompts: [
          'Modern logo design trends',
          'Color palette for a tech startup',
          'UI/UX design best practices',
          'Typography combinations',
          'Brand identity inspiration',
          'Website layout ideas'
        ]
      },
      {
        key: 'musicSearch',
        title: 'Music',
        description: 'Music discovery and theory',
        icon: <Music size={16} className="stroke-[1.5]" />,
        greeting: 'Discover your next favorite song!',
        subtitle: 'I can help with music discovery, theory, and recommendations.',
        quickPrompts: [
          'Recommend music similar to my favorites',
          'Explain music theory basics',
          'Best new albums this month',
          'Learn to play guitar chords',
          'Music production tips',
          'Concert and festival recommendations'
        ]
      },
      {
        key: 'gamingSearch',
        title: 'Gaming',
        description: 'Games and entertainment',
        icon: <Gamepad2 size={16} className="stroke-[1.5]" />,
        greeting: 'Level up your gaming experience!',
        subtitle: 'I can help with game recommendations, strategies, and gaming news.',
        quickPrompts: [
          'Best indie games of 2024',
          'Gaming setup recommendations',
          'Strategy guides for popular games',
          'Upcoming game releases',
          'Gaming hardware reviews',
          'Multiplayer game suggestions'
        ]
      },
    ]
  },
  {
    name: 'Learning',
    icon: '📚',
    templates: [
      {
        key: 'educationSearch',
        title: 'Education',
        description: 'Learning and courses',
        icon: <GraduationCap size={16} className="stroke-[1.5]" />,
        greeting: 'Ready to expand your knowledge!',
        subtitle: 'I can help with learning resources, course recommendations, and educational content.',
        quickPrompts: [
          'Best online courses for data science',
          'Learn programming from scratch',
          'Study techniques for better retention',
          'Free educational resources',
          'Language learning apps comparison',
          'Certification programs worth pursuing'
        ]
      },
      {
        key: 'codingSearch',
        title: 'Coding',
        description: 'Programming and development',
        icon: <Code size={16} className="stroke-[1.5]" />,
        greeting: 'Let\'s code something amazing!',
        subtitle: 'I can help with programming concepts, debugging, and development best practices.',
        quickPrompts: [
          'Explain React hooks with examples',
          'Debug this JavaScript error',
          'Best practices for API design',
          'Learn Python for beginners',
          'Database design principles',
          'Code review checklist'
        ]
      },
      {
        key: 'languageSearch',
        title: 'Languages',
        description: 'Language learning and translation',
        icon: <Users size={16} className="stroke-[1.5]" />,
        greeting: 'Explore the world of languages!',
        subtitle: 'I can help with language learning, translation, and cultural insights.',
        quickPrompts: [
          'Learn Spanish conversation basics',
          'Translate this text accurately',
          'French grammar rules explained',
          'Cultural etiquette in Japan',
          'Language exchange tips',
          'Pronunciation guides'
        ]
      },
    ]
  },
  {
    name: 'AI Tools',
    icon: '🤖',
    templates: [
      {
        key: 'wolframAlphaSearch',
        title: 'Wolfram',
        description: 'Computational engine',
        icon: <Atom size={16} className="stroke-[1.5]" />,
        greeting: 'Let\'s solve complex problems together!',
        subtitle: 'I can help with math, science, statistics, and computational queries using Wolfram Alpha.',
        quickPrompts: [
          'Solve this calculus problem',
          'Calculate compound interest',
          'Plot a mathematical function',
          'Convert units and measurements',
          'Statistical analysis and probability',
          'Physics equations and formulas'
        ]
      },
      {
        key: 'youtubeSearch',
        title: 'YouTube',
        description: 'Video content',
        icon: <Lightbulb size={16} className="stroke-[1.5]" />,
        greeting: 'Discover amazing YouTube content!',
        subtitle: 'I can help you find educational videos, tutorials, and entertainment on YouTube.',
        quickPrompts: [
          'Find coding tutorials for beginners',
          'Best cooking channels on YouTube',
          'Educational videos about space',
          'Workout videos for home fitness',
          'DIY and craft project tutorials',
          'Music and instrument learning videos'
        ]
  },
  {
    key: 'redditSearch',
    title: 'Reddit',
        description: 'Discussions and opinions',
        icon: <MessageCircle size={16} className="stroke-[1.5]" />,
        greeting: 'Explore Reddit discussions and insights!',
        subtitle: 'I can help you find relevant Reddit threads, community discussions, and user experiences.',
        quickPrompts: [
          'What does Reddit say about this product?',
          'Find discussions about career advice',
          'Reddit reviews of popular movies',
          'Community opinions on tech trends',
          'Best subreddits for learning new skills',
          'Reddit recommendations for books and shows'
        ]
      },
      {
        key: 'dataAnalysis',
        title: 'Data Analysis',
        description: 'Analytics and insights',
        icon: <Zap size={16} className="stroke-[1.5]" />,
        greeting: 'Turn data into actionable insights!',
        subtitle: 'I can help with data analysis, visualization, and statistical interpretation.',
        quickPrompts: [
          'Analyze this dataset for trends',
          'Create data visualization recommendations',
          'Statistical significance testing',
          'Predictive modeling approaches',
          'Data cleaning best practices',
          'Business intelligence insights'
        ]
      },
    ]
  },
];

// Flatten for easy lookup
const allTemplates = templateCategories.flatMap(category => category.templates);

const Focus = ({
  focusMode,
  setFocusMode,
  onTemplateSelect,
}: {
  focusMode: string;
  setFocusMode: (mode: string) => void;
  onTemplateSelect?: () => void;
}) => {
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
    setFocusMode(templateKey);
    setIsOpen(false);
    setSearchQuery('');
    setSelectedCategory('all');
    // Trigger focus after modal closes with longer delay
    setTimeout(() => {
      onTemplateSelect?.();
    }, 300); // Longer delay to ensure modal transition completes
  };
  
  return (
    <>
      {currentTemplate ? (
        <button
        type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all duration-200"
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
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all duration-200"
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
            <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
        as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-light-primary dark:bg-dark-primary border border-black/5 dark:border-white/5 shadow-2xl transition-all">
                  {/* Header */}
                  <div className="relative border-b border-black/5 dark:border-white/5 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
                    <div className="flex items-center justify-between p-6 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          <Sparkles size={20} />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-black dark:text-white">
                            Choose Your Template
                          </h2>
                          <p className="text-sm text-black/60 dark:text-white/60">
                            Select a specialized template for your task
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    
                    {/* Search Bar and Category Filter */}
                    <div className="px-6 pb-4 space-y-4">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                        <input
                          type="text"
                          placeholder="Search templates..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                        />
                      </div>
                      
                      {/* Category Filter */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Filter size={16} className="stroke-[1.5]" />
                          <span className="text-sm font-semibold">Categories</span>
                        </div>
                        <button
                          onClick={() => setSelectedCategory('all')}
                          className={cn(
                            'px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 backdrop-blur-sm',
                            selectedCategory === 'all'
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                              : 'bg-white/60 dark:bg-gray-800/40 border border-gray-200/40 dark:border-gray-700/40 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/60 hover:border-gray-300/60 dark:hover:border-gray-600/60 hover:shadow-md'
                          )}
                        >
                          All
                        </button>
                        {templateCategories.map((category) => (
                          <button
                            key={category.name}
                            onClick={() => setSelectedCategory(category.name)}
                            className={cn(
                              'px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 backdrop-blur-sm',
                              selectedCategory === category.name
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                                : 'bg-white/60 dark:bg-gray-800/40 border border-gray-200/40 dark:border-gray-700/40 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/60 hover:border-gray-300/60 dark:hover:border-gray-600/60 hover:shadow-md'
                            )}
                          >
                            <span className="text-base">{category.icon}</span>
                            <span>{category.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="space-y-8">
                      {filteredCategories.map((category, categoryIndex) => (
                        <div key={categoryIndex}>
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl">{category.icon}</span>
                            <h3 className="text-lg font-semibold text-black dark:text-white">
                              {category.name}
                            </h3>
                            <div className="flex-1 h-px bg-gradient-to-r from-black/10 to-transparent dark:from-white/10"></div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {category.templates.map((template) => (
                              <button
                                onClick={() => handleTemplateSelect(template.key)}
                                key={template.key}
                className={cn(
                                  'group relative flex flex-col items-center gap-4 p-5 rounded-2xl transition-all duration-300 text-center border backdrop-blur-sm',
                                  focusMode === template.key
                                    ? 'bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/60 dark:border-blue-700/60 text-blue-700 dark:text-blue-300 shadow-xl shadow-blue-500/10 scale-105'
                                    : 'bg-white/60 dark:bg-gray-800/40 border-gray-200/40 dark:border-gray-700/40 hover:bg-white/80 dark:hover:bg-gray-800/60 hover:border-gray-300/60 dark:hover:border-gray-600/60 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-white/5 hover:scale-105 text-gray-700 dark:text-gray-300',
                )}
              >
                <div className={cn(
                                  'flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 shadow-sm',
                                  focusMode === template.key
                                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                                    : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-600 dark:text-gray-400 group-hover:from-gray-200 group-hover:to-gray-300 dark:group-hover:from-gray-600 dark:group-hover:to-gray-700 group-hover:text-gray-700 dark:group-hover:text-gray-300',
                                )}>
                                  {React.cloneElement(template.icon as React.ReactElement, { 
                                    size: 18, 
                                    className: "stroke-[1.5]" 
                                  })}
                </div>
                                <div className="space-y-1.5">
                                  <p className="font-semibold text-sm leading-tight">
                                    {template.title}
                                  </p>
                  <p className={cn(
                                    "text-xs leading-relaxed line-clamp-2 font-medium",
                                    focusMode === template.key
                                      ? 'text-blue-600/70 dark:text-blue-400/70'
                                      : 'text-gray-500 dark:text-gray-400'
                                  )}>
                                    {template.description}
                  </p>
                </div>
                                {focusMode === template.key && (
                                  <div className="absolute top-3 right-3">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
                                      <Check size={14} className="stroke-[2]" />
                                    </div>
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {filteredCategories.length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                          <Search className="text-black/40 dark:text-white/40" size={16} />
                        </div>
                        <p className="text-black/60 dark:text-white/60 text-sm">
                          No templates found matching "{searchQuery}"
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
};

export default Focus;
export { templateCategories, allTemplates };
