import React, { useState, useEffect } from 'react';
import { Settings, Globe2, Home, Briefcase, Plane, Heart, Building2, GlobeIcon, X, Sparkles, Compass } from 'lucide-react';
import EmptyChatMessageInput from './EmptyChatMessageInput';
import { File } from './ChatWindow';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { AuthModal } from '@/components/auth/AuthModal';
import { motion, AnimatePresence } from 'framer-motion';

const greetingMessages = [
  {
    title: "Dreaming of life abroad?",
    subtitle: "Second passports, offshore real estate, moving tips, banking, taxes"
  },
  {
    title: "Ready for your next chapter?",
    subtitle: "Expert guidance on global citizenship, investments, and expatriate living"
  },
  {
    title: "Seeking financial freedom?",
    subtitle: "Discover offshore strategies, tax optimization, and international banking"
  },
  {
    title: "Want location independence?",
    subtitle: "Digital nomad visas, global investments, and borderless living"
  }
];

const EmptyChat = ({
  sendMessage,
  focusMode,
  setFocusMode,
  optimizationMode,
  setOptimizationMode,
  fileIds,
  setFileIds,
  files,
  setFiles,
}: {
  sendMessage: (message: string) => void;
  focusMode: string;
  setFocusMode: (mode: string) => void;
  optimizationMode: string;
  setOptimizationMode: (mode: string) => void;
  fileIds: string[];
  setFileIds: (fileIds: string[]) => void;
  files: File[];
  setFiles: (files: File[]) => void;
}) => {
  const { user } = useAuth();
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isMessageChanging, setIsMessageChanging] = useState(false);

  const categories = [
    {
      icon: GlobeIcon,
      label: 'Second Citizenship',
      color: 'blue',
      quickPrompts: [
        'Compare EU citizenship by investment programs',
        'Best Caribbean passport programs in 2025',
        'How to get Portuguese citizenship through D7 visa',
        'Compare golden visa programs worldwide',
        'Citizenship through ancestry options',
        'Fastest routes to second citizenship'
      ]
    },
    {
      icon: Building2,
      label: 'Finance & Banking',
      color: 'emerald',
      quickPrompts: [
        'Best offshore banking jurisdictions in 2024',
        'How to open international bank accounts',
        'Tax optimization strategies for expats',
        'Compare private banking services',
        'Asset protection strategies offshore',
        'International investment opportunities'
      ]
    },
    {
      icon: Home,
      label: 'Real Estate',
      color: 'purple',
      quickPrompts: [
        'Best countries for property investment',
        'Compare real estate markets in Europe',
        'Property buying guide in Portugal',
        'Real estate investment for residency',
        'Latin American property markets',
        'Rental yield comparison by country'
      ]
    },
    {
      icon: Briefcase,
      label: 'Digital Nomad',
      color: 'pink',
      quickPrompts: [
        'Best digital nomad visa programs',
        'Remote work-friendly countries',
        'Compare cost of living for nomads',
        'Nomad-friendly banking solutions',
        'Best coworking destinations',
        'Tax implications for digital nomads'
      ]
    },
    {
      icon: Plane,
      label: 'Destinations',
      color: 'orange',
      quickPrompts: [
        'Compare living costs in European cities',
        'Best expat communities in Asia',
        'Healthcare quality by country',
        'Safest countries for expats',
        'Family-friendly expat destinations',
        'Best places for retirement abroad'
      ]
    },
    {
      icon: Heart,
      label: 'Lifestyle',
      color: 'cyan',
      quickPrompts: [
        'Healthcare systems comparison',
        'International schools guide',
        'Cultural adaptation tips',
        'Making friends as an expat',
        'Language learning resources',
        'Work-life balance abroad'
      ]
    },
    {
      icon: Settings,
      label: 'Legal & Tax',
      color: 'amber',
      quickPrompts: [
        'Tax residency requirements',
        'Offshore company formation',
        'International tax planning',
        'Legal compliance for expats',
        'Business immigration programs',
        'Double taxation agreements'
      ]
    },
    {
      icon: Compass,
      label: 'Getting Started',
      color: 'green',
      quickPrompts: [
        'First steps to moving abroad',
        'Essential documents checklist',
        'Cost comparison calculator',
        'Timeline for moving overseas',
        'Common expat mistakes to avoid',
        'Choosing your ideal country'
      ]
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsMessageChanging(true);
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % greetingMessages.length);
        setIsMessageChanging(false);
      }, 800);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 overflow-hidden">
      <div className="relative h-full overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 h-full">
          <div className="flex flex-col items-start justify-start h-full pt-8">
            {/* Brand Header */}
            <div className="mt-24">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-600 bg-clip-text text-transparent font-poppins">
                  ESCAPEARTIST AI
                </span>
              </div>
            </div>

            <div className="flex flex-col w-full space-y-6">
              <div className="w-full">
                <div className="space-y-3 min-h-[140px] flex flex-col items-start justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentMessageIndex}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="space-y-4"
                    >
                      <motion.div 
                        className="space-y-4"
                      >
                        <div className="text-gray-900 dark:text-white text-2xl lg:text-3xl xl:text-4xl font-medium tracking-tight leading-relaxed font-poppins flex flex-wrap gap-x-2">
                          {greetingMessages[currentMessageIndex].title.split(/(?=[A-Z])|\s+/).map((word, idx) => (
                            <motion.span
                              key={idx}
                              initial={{ 
                                opacity: 0,
                                scale: 0.98
                              }}
                              animate={{ 
                                opacity: 1,
                                scale: 1,
                                transition: {
                                  duration: 0.5,
                                  delay: idx * 0.05,
                                  ease: [0.2, 0, 0, 1]
                                }
                              }}
                              exit={{ 
                                opacity: 0,
                                scale: 0.96,
                                transition: {
                                  duration: 0.3,
                                  ease: [0.4, 0, 0.2, 1]
                                }
                              }}
                              className="inline-block"
                            >
                              {word}{" "}
                            </motion.span>
                          ))}
                        </div>

                        <motion.p 
                          className="text-gray-600 dark:text-gray-400 text-lg"
                          initial={{ 
                            opacity: 0,
                            scale: 0.98
                          }}
                          animate={{ 
                            opacity: 1,
                            scale: 1,
                            transition: {
                              duration: 0.5,
                              delay: 0.3,
                              ease: [0.2, 0, 0, 1]
                            }
                          }}
                          exit={{ 
                            opacity: 0,
                            scale: 0.96,
                            transition: {
                              duration: 0.3,
                              ease: [0.4, 0, 0.2, 1]
                            }
                          }}
                        >
                          {greetingMessages[currentMessageIndex].subtitle}
                        </motion.p>
                      </motion.div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="w-full">
              <EmptyChatMessageInput
                sendMessage={sendMessage}
                optimizationMode={optimizationMode}
                setOptimizationMode={setOptimizationMode}
                fileIds={fileIds}
                setFileIds={setFileIds}
                files={files}
                setFiles={setFiles}
                onFocusChange={(focused) => {
                  setIsTextareaFocused(focused);
                }}
                onTextareaRef={setTextareaRef}
              />
              
              <div className="mt-6 transform transition-all duration-500 ease-in-out">
                {!selectedCategory ? (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {categories.map((category) => (
                      <button
                        key={category.label}
                        onClick={() => setSelectedCategory(category.label)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg font-poppins ${
                          category.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30' :
                          category.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30' :
                          category.color === 'purple' ? 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30' :
                          category.color === 'pink' ? 'bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/30' :
                          category.color === 'orange' ? 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30' :
                          category.color === 'cyan' ? 'bg-cyan-50 dark:bg-cyan-900/20 hover:bg-cyan-100 dark:hover:bg-cyan-900/30' :
                          category.color === 'amber' ? 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30' :
                          category.color === 'green' ? 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30' :
                          'bg-gray-50 dark:bg-gray-900/20 hover:bg-gray-100 dark:hover:bg-gray-900/30'
                        } transition-colors`}
                      >
                        {React.createElement(category.icon, {
                          className: `w-4 h-4 ${
                            category.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                            category.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                            category.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                            category.color === 'pink' ? 'text-pink-600 dark:text-pink-400' :
                            category.color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
                            category.color === 'cyan' ? 'text-cyan-600 dark:text-cyan-400' :
                            category.color === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                            category.color === 'green' ? 'text-green-600 dark:text-green-400' :
                            'text-gray-600 dark:text-gray-400'
                          }`
                        })}
                        <span className={`text-sm font-medium ${
                          category.color === 'blue' ? 'text-blue-700 dark:text-blue-300' :
                          category.color === 'emerald' ? 'text-emerald-700 dark:text-emerald-300' :
                          category.color === 'purple' ? 'text-purple-700 dark:text-purple-300' :
                          category.color === 'pink' ? 'text-pink-700 dark:text-pink-300' :
                          category.color === 'orange' ? 'text-orange-700 dark:text-orange-300' :
                          category.color === 'cyan' ? 'text-cyan-700 dark:text-cyan-300' :
                          category.color === 'amber' ? 'text-amber-700 dark:text-amber-300' :
                          category.color === 'green' ? 'text-green-700 dark:text-green-300' :
                          'text-gray-700 dark:text-gray-300'
                        }`}>{category.label}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2 font-poppins">
                        {categories.find(c => c.label === selectedCategory)?.icon && 
                          React.createElement(categories.find(c => c.label === selectedCategory)!.icon, {
                            className: "w-4 h-4 text-blue-600 dark:text-blue-400"
                          })
                        }
                        {selectedCategory}
                      </h3>
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                    <div className="flex flex-col -space-y-px">
                      {categories.find(c => c.label === selectedCategory)?.quickPrompts.map((prompt, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            sendMessage(prompt);
                            setSelectedCategory(null);
                          }}
                          className="text-left py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 transition-colors text-sm first:rounded-t-lg last:rounded-b-lg font-poppins"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
};

export default EmptyChat;
