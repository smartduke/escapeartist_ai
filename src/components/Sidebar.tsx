'use client';

import { cn } from '@/lib/utils';
import { BookOpenText, Search, SquarePen, Settings, User, LogOut, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useSelectedLayoutSegments } from 'next/navigation';
import React, { useState, useEffect, type ReactNode } from 'react';
import Layout from './Layout';
import { useAuth } from '@/components/auth/AuthProvider';
import { AuthModal } from '@/components/auth/AuthModal';
import { Tooltip } from 'react-tooltip';

const VerticalIconContainer = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex flex-col items-center gap-y-3 w-full">{children}</div>
  );
};

const Sidebar = ({ children }: { children: React.ReactNode }) => {
  const segments = useSelectedLayoutSegments();
  const { user, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  // Debug logging for user state in Sidebar
  console.log('Sidebar Debug - User state:', { user, hasUser: !!user });

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const navLinks = [
    {
      icon: Search,
      href: '/discover',
      active: segments.includes('discover'),
      label: 'Discover',
    },
    {
      icon: BookOpenText,
      href: '/library',
      active: segments.includes('library'),
      label: 'History',
    },
  ];

  return (
    <div>
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-12 lg:flex-col">
        <div className="flex grow flex-col items-center justify-between gap-y-5 overflow-y-auto bg-light-secondary dark:bg-dark-secondary px-1 py-8">
          <div className="flex flex-col items-center justify-evenly h-32 w-full">
            <a 
              href="/"
              data-tooltip-id="new-chat-tooltip"
              data-tooltip-content="New Chat"
            >
              <SquarePen className="cursor-pointer" size={18} />
            </a>
            <Tooltip 
              id="new-chat-tooltip" 
              place="right" 
              className="tiny-tooltip"
              noArrow
              style={{ zIndex: 9999 }}
              offset={10}
            />
            {navLinks.map((link, i) => (
              <div key={i} className="w-full flex justify-center">
                <Link
                  href={link.href}
                  data-tooltip-id={`nav-tooltip-${i}`}
                  data-tooltip-content={link.label}
                  className={cn(
                    'relative flex flex-row items-center justify-center cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 duration-150 transition w-8 h-8 rounded-lg',
                    link.active
                      ? 'text-black dark:text-white bg-black/15 dark:bg-white/15'
                      : 'text-black/70 dark:text-white/70',
                  )}
                >
                  <link.icon size={18} />
                </Link>
                <Tooltip 
                  id={`nav-tooltip-${i}`} 
                  place="right" 
                  className="tiny-tooltip"
                  noArrow
                  style={{ zIndex: 9999 }}
                  offset={10}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-y-3 relative">
            {/* Avatar with dropdown */}
            <div className="relative dropdown-container">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                  user 
                    ? 'bg-black/10 dark:bg-white/10 hover:bg-black/15 dark:hover:bg-white/15 text-black dark:text-white' 
                    : 'hover:bg-black/10 dark:hover:bg-white/10 text-black/70 dark:text-white/70'
                }`}
              >
                {user ? (
                  <span className="text-black dark:text-white text-sm font-medium">
                    {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                ) : (
                  <User size={18} />
                )}
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="fixed bottom-16 left-14 w-48 bg-light-primary dark:bg-dark-primary border border-light-200 dark:border-dark-200 rounded-lg shadow-lg z-[9999]">
                  <div className="p-3">
                    {user ? (
                      <div className="flex flex-col space-y-3">
                        <Link
                          href="/settings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center space-x-2 p-2 hover:bg-light-secondary dark:hover:bg-dark-secondary rounded-lg transition-colors"
                        >
                          <Settings size={16} />
                          <span className="text-sm">Settings</span>
                        </Link>
                        <button
                          onClick={() => {
                            signOut();
                            setDropdownOpen(false);
                          }}
                          className="flex items-center space-x-2 p-2 hover:bg-light-secondary dark:hover:bg-dark-secondary rounded-lg transition-colors"
                        >
                          <LogOut size={16} />
                          <span className="text-sm">Sign out</span>
                        </button>
                        <div className="border-t border-light-200 dark:border-dark-200 pt-3">
                          <div className="flex flex-col space-y-2">
                            <p className="text-black/70 dark:text-white/70 text-sm">Theme</p>
                            <select 
                              value={theme}
                              onChange={(e) => handleThemeChange(e.target.value)}
                              className="bg-light-secondary dark:bg-dark-secondary px-3 py-2 border border-light-200 dark:border-dark-200 rounded-lg text-sm"
                            >
                              <option value="light">Light</option>
                              <option value="dark">Dark</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col space-y-3">
                        <Link
                          href="/settings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center space-x-2 p-2 hover:bg-light-secondary dark:hover:bg-dark-secondary rounded-lg transition-colors"
                        >
                          <Settings size={16} />
                          <span className="text-sm">Settings</span>
                        </Link>
                        <button
                          onClick={() => {
                            setAuthMode('login');
                            setAuthModalOpen(true);
                            setDropdownOpen(false);
                          }}
                          className="flex items-center space-x-2 p-2 hover:bg-light-secondary dark:hover:bg-dark-secondary rounded-lg transition-colors w-full text-left"
                        >
                          <User size={16} />
                          <span className="text-sm">Sign in</span>
                        </button>
                        <div className="border-t border-light-200 dark:border-dark-200 pt-3">
                          <div className="flex flex-col space-y-2">
                            <p className="text-black/70 dark:text-white/70 text-sm">Theme</p>
                            <select 
                              value={theme}
                              onChange={(e) => handleThemeChange(e.target.value)}
                              className="bg-light-secondary dark:bg-dark-secondary px-3 py-2 border border-light-200 dark:border-dark-200 rounded-lg text-sm"
                            >
                              <option value="light">Light</option>
                              <option value="dark">Dark</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 w-full z-50 flex flex-row items-center gap-x-6 bg-light-primary dark:bg-dark-primary px-4 py-4 shadow-sm lg:hidden">
        {navLinks.map((link, i) => (
          <Link
            href={link.href}
            key={i}
            className={cn(
              'relative flex flex-col items-center space-y-1 text-center w-full',
              link.active
                ? 'text-black dark:text-white'
                : 'text-black dark:text-white/70',
            )}
          >
            {link.active && (
              <div className="absolute top-0 -mt-4 h-1 w-full rounded-b-lg bg-black dark:bg-white" />
            )}
            <link.icon />
            <p className="text-xs">{link.label}</p>
          </Link>
        ))}
      </div>

      <Layout>{children}</Layout>
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
};

export default Sidebar;
