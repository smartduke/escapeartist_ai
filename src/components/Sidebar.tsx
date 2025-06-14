'use client';

import { cn } from '@/lib/utils';
import { 
  History, 
  Compass, 
  PenLine, 
  Settings, 
  UserIcon, 
  LogOut, 
  ChevronRightIcon, 
  PencilLine, 
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  Home,
  CreditCard,
  DollarSign,
  User
} from 'lucide-react';
import Link from 'next/link';
import { useSelectedLayoutSegments, usePathname } from 'next/navigation';
import React, { useState, useEffect, type ReactNode } from 'react';
import Layout from './Layout';
import { useAuth } from '@/components/auth/AuthProvider';
import { AuthModal } from '@/components/auth/AuthModal';
import { Tooltip } from 'react-tooltip';
import { toast } from 'sonner';
import DeleteChat from '@/components/DeleteChat';
import { useSidebar } from './SidebarContext';

interface Chat {
  id: string;
  title: string;
  createdAt: string;
  focusMode: string;
}

const VerticalIconContainer = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex flex-col items-center gap-y-3 w-full">{children}</div>
  );
};

const Sidebar = ({ children }: { children: React.ReactNode }) => {
  const segments = useSelectedLayoutSegments();
  const pathname = usePathname();
  const { user, signOut, guestId } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const { isExpanded, setIsExpanded } = useSidebar();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  // Load chats
  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (user?.id) {
        queryParams.append('userId', user.id);
      } else if (guestId) {
        queryParams.append('guestId', guestId);
      }

      try {
        const res = await fetch(`/api/chats?${queryParams.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await res.json();
        setChats(data.chats);
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isExpanded) {
      fetchChats();
    }
  }, [user, guestId, isExpanded]);

  // Load sidebar state and theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const savedSidebarState = localStorage.getItem('sidebarExpanded') === 'true';
    setTheme(savedTheme);
    setIsExpanded(savedSidebarState);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sidebarExpanded', isExpanded.toString());
  }, [isExpanded]);

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

  const handleDeleteChat = async (chatId: string) => {
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.status !== 200) {
        throw new Error('Failed to delete chat');
      }

      setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
      
      if (pathname === `/c/${chatId}`) {
        window.location.href = '/';
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRenameChat = async (chatId: string) => {
    if (!editingTitle.trim()) {
      setEditingChatId(null);
      return;
    }

    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: editingTitle }),
      });

      if (res.status !== 200) {
        throw new Error('Failed to rename chat');
      }

      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === chatId ? { ...chat, title: editingTitle } : chat
        )
      );
      setEditingChatId(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const navLinks = [
    {
      icon: Compass,
      href: '/discover',
      active: segments.includes('discover'),
      label: 'Discover',
    },
    {
      icon: History,
      href: '/library',
      active: segments.includes('library'),
      label: 'History',
    },
  ];

  return (
    <div>
      <div className={cn(
        "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300 ease-in-out transform",
        isExpanded ? "lg:w-64 translate-x-0" : "lg:w-12 translate-x-0"
      )}>
        <div className="flex grow flex-col items-center justify-between gap-y-5 overflow-y-auto bg-light-secondary dark:bg-dark-secondary py-4 relative transition-all duration-300 ease-in-out">
          <div className="flex flex-col items-start w-full space-y-4 px-2 transition-all duration-300 ease-in-out">
            {/* Brand Name Section */}
            <div className="w-full flex items-center">
              <div className={cn(
                "flex-1 text-lg font-medium text-black dark:text-white transition-all duration-300 ease-in-out",
                isExpanded ? "opacity-100 pl-2" : "opacity-0 w-0 pl-0"
              )}>
                Infoxai
              </div>
              <div className="flex items-center justify-center w-8">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="relative flex items-center justify-center h-8 w-8 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 duration-150 transition rounded-lg text-black/70 dark:text-white/70"
                  data-tooltip-id="toggle-tooltip"
                  data-tooltip-content="Toggle Sidebar"
                >
                  {isExpanded ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
                </button>
              </div>
            </div>

            {/* Navigation Section */}
            <div className="w-full space-y-2">
              <div className="w-full">
                <Link 
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = '/';
                  }}
                  className="relative flex items-center h-8 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 duration-150 transition rounded-lg text-black/70 dark:text-white/70"
                  data-tooltip-id="new-chat-tooltip"
                  data-tooltip-content="New Chat"
                >
                  <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
                    <PenLine size={18} />
                  </div>
                  <span className={cn(
                    "text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out",
                    isExpanded ? "opacity-100 w-auto ml-1" : "opacity-0 w-0"
                  )}>New Chat</span>
                </Link>
                {!isExpanded && (
                  <Tooltip 
                    id="new-chat-tooltip" 
                    place="right"
                    className="!z-[9999] !opacity-100 !visible"
                    noArrow
                    offset={10}
                    positionStrategy="fixed"
                  />
                )}
              </div>

              {navLinks.map((link, i) => (
                <div key={i} className="w-full">
                  <Link
                    href={link.href}
                    data-tooltip-id={`nav-tooltip-${i}`}
                    data-tooltip-content={link.label}
                    className={cn(
                      'relative flex items-center h-8 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 duration-150 transition rounded-lg',
                      link.active
                        ? 'text-black dark:text-white bg-black/15 dark:bg-white/15'
                        : 'text-black/70 dark:text-white/70',
                    )}
                  >
                    <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
                      {link.icon === Compass ? <Compass size={18} /> : <link.icon size={18} />}
                    </div>
                    <span className={cn(
                      "text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out",
                      isExpanded ? "opacity-100 w-auto ml-1" : "opacity-0 w-0"
                    )}>{link.label}</span>
                  </Link>
                  {!isExpanded && (
                    <Tooltip 
                      id={`nav-tooltip-${i}`} 
                      place="right"
                      className="!z-[9999] !opacity-100 !visible"
                      noArrow
                      offset={10}
                      positionStrategy="fixed"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Chat History List */}
            <div className={cn(
              "w-full mt-4 space-y-1 transition-all duration-300 ease-in-out",
              isExpanded ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
            )}>
              <div className="text-xs text-black/50 dark:text-white/70 px-2 mb-2 transition-all duration-300 ease-in-out whitespace-nowrap">Recent Chats</div>
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                {loading ? (
                  <div className="text-center text-sm text-black/50 dark:text-white/70 transition-all duration-300 ease-in-out whitespace-nowrap">Loading...</div>
                ) : chats.length === 0 ? (
                  <div className="text-center text-sm text-black/50 dark:text-white/70 transition-all duration-300 ease-in-out whitespace-nowrap">No chats yet</div>
                ) : (
                  chats.map((chat) => (
                    <div key={chat.id} className="group relative">
                      {editingChatId === chat.id ? (
                        <div className="flex items-center px-2 py-1">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={() => handleRenameChat(chat.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleRenameChat(chat.id);
                              } else if (e.key === 'Escape') {
                                setEditingChatId(null);
                              }
                            }}
                            className="w-full bg-transparent border-none focus:outline-none text-sm text-black/70 dark:text-white/70 transition-all duration-300 ease-in-out"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <Link
                          href={`/c/${chat.id}`}
                          className={cn(
                            "flex items-center px-2 py-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300 ease-in-out text-black/70 dark:text-white/70",
                            pathname === `/c/${chat.id}` ? "bg-black/15 dark:bg-white/15" : ""
                          )}
                        >
                          <span className={cn(
                            "text-sm truncate transition-all duration-300 ease-in-out whitespace-nowrap",
                            isExpanded ? "opacity-100 w-auto flex-1" : "opacity-0 w-0"
                          )}>{chat.title}</span>
                          <div className={cn(
                            "items-center gap-1 transition-opacity duration-300 ease-in-out opacity-0 group-hover:opacity-100",
                            isExpanded ? "flex" : "hidden"
                          )}>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setEditingChatId(chat.id);
                                setEditingTitle(chat.title);
                              }}
                              className="p-1 hover:bg-black/20 dark:hover:bg-white/20 rounded transition-all duration-300 ease-in-out"
                            >
                              <PencilLine size={12} className="text-black/70 dark:text-white/70" />
                            </button>
                            <DeleteChat chatId={chat.id} chats={chats} setChats={setChats} />
                          </div>
                        </Link>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-y-3 relative w-full mt-auto px-2">
            {/* Avatar with dropdown */}
            <div className="relative dropdown-container w-full">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="relative flex items-center h-8 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 duration-150 transition rounded-lg w-full text-black/70 dark:text-white/70"
              >
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 flex-shrink-0 rounded-lg",
                  user ? 'bg-black/10 dark:bg-white/10' : ''
                )}>
                  {user ? (
                    <span className="text-black dark:text-white text-sm font-medium">
                      {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  ) : (
                    <UserIcon size={18} />
                  )}
                </div>
                <span className={cn(
                  "text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out text-left",
                  isExpanded ? "opacity-100 w-auto ml-2" : "opacity-0 w-0"
                )}>
                  {user ? (user.name || user.email || 'User') : 'Sign in'}
                </span>
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className={cn(
                  "fixed bottom-16 bg-light-primary dark:bg-dark-primary border border-light-200 dark:border-dark-200 rounded-lg shadow-lg z-[9999]",
                  isExpanded ? "left-4 w-56" : "left-14 w-48"
                )}>
                  <div className="p-3">
                    {user ? (
                      <div className="flex flex-col space-y-3">
                        <Link
                          href="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center space-x-2 p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors text-black dark:text-white/70"
                        >
                          <User size={16} className="text-black dark:text-white/70" />
                          <span className="text-sm">Profile</span>
                        </Link>
                        <Link
                          href="/pricing"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center space-x-2 p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors text-black dark:text-white/70"
                        >
                          <CreditCard size={16} className="text-black dark:text-white/70" />
                          <span className="text-sm">Pricing</span>
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center space-x-2 p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors text-black dark:text-white/70"
                        >
                          <Settings size={16} className="text-black dark:text-white/70" />
                          <span className="text-sm">Settings</span>
                        </Link>
                        <button
                          onClick={() => {
                            signOut();
                            setDropdownOpen(false);
                          }}
                          className="flex items-center space-x-2 p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors w-full text-left text-black dark:text-white/70"
                        >
                          <LogOut size={16} className="text-black dark:text-white/70" />
                          <span className="text-sm">Sign out</span>
                        </button>
                        <div className="border-t border-light-200 dark:border-dark-200 pt-3">
                          <div className="flex flex-col space-y-2">
                            <p className="text-black dark:text-white/70 text-sm">Theme</p>
                            <select 
                              value={theme}
                              onChange={(e) => handleThemeChange(e.target.value)}
                              className="bg-light-secondary dark:bg-dark-secondary px-3 py-2 border border-light-200 dark:border-dark-200 rounded-lg text-sm text-black dark:text-white/70"
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
                          className="flex items-center space-x-2 p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors text-black dark:text-white/70"
                        >
                          <Settings size={16} className="text-black dark:text-white/70" />
                          <span className="text-sm">Settings</span>
                        </Link>
                        <button
                          onClick={() => {
                            setAuthMode('login');
                            setAuthModalOpen(true);
                            setDropdownOpen(false);
                          }}
                          className="flex items-center space-x-2 p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors w-full text-left text-black dark:text-white/70"
                        >
                          <UserIcon size={16} className="text-black dark:text-white/70" />
                          <span className="text-sm">Sign in</span>
                        </button>
                        <div className="border-t border-light-200 dark:border-dark-200 pt-3">
                          <div className="flex flex-col space-y-2">
                            <p className="text-black dark:text-white/70 text-sm">Theme</p>
                            <select 
                              value={theme}
                              onChange={(e) => handleThemeChange(e.target.value)}
                              className="bg-light-secondary dark:bg-dark-secondary px-3 py-2 border border-light-200 dark:border-dark-200 rounded-lg text-sm text-black dark:text-white/70"
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

      <div className="fixed bottom-0 w-full z-50 flex flex-row items-center justify-around bg-light-primary dark:bg-dark-primary px-4 py-3 shadow-sm lg:hidden">
        <Link
          href="/"
          onClick={(e) => {
            e.preventDefault();
            window.location.href = '/';
          }}
          className={cn(
            'relative flex flex-col items-center space-y-1 text-center',
            pathname === '/'
              ? 'text-black dark:text-white'
              : 'text-black/60 dark:text-white/60 hover:text-black/80 dark:hover:text-white/80',
          )}
        >
          <PenLine size={20} />
          <p className="text-xs font-medium">New Chat</p>
        </Link>
        {navLinks.map((link, i) => (
          <Link
            href={link.href}
            key={i}
            className={cn(
              'relative flex flex-col items-center space-y-1 text-center',
              link.active
                ? 'text-black dark:text-white'
                : 'text-black/60 dark:text-white/60 hover:text-black/80 dark:hover:text-white/80',
            )}
          >
            <link.icon size={20} />
            <p className="text-xs font-medium">{link.label}</p>
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
