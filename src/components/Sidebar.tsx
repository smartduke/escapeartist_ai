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
  User,
  Sparkles,
  type LucideIcon
} from 'lucide-react';
import Link from 'next/link';
import { useSelectedLayoutSegments, usePathname } from 'next/navigation';
import React, { useState, useEffect, type ReactNode, useRef } from 'react';
import Layout from './Layout';
import { useAuth } from '@/components/auth/AuthProvider';
import { AuthModal } from '@/components/auth/AuthModal';
import { Tooltip } from 'react-tooltip';
import { toast } from 'sonner';
import DeleteChat from '@/components/DeleteChat';
import { useSidebar } from './SidebarContext';
import Focus, { type FocusRef } from '@/components/MessageInputActions/Focus';

interface Chat {
  id: string;
  title: string;
  createdAt: string;
  focusMode: string;
}

interface NavLink {
  icon: LucideIcon;
  href: string;
  active: boolean;
  label: string;
  onClick?: () => void;
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
  const [focusMode, setFocusMode] = useState('escapeArtistSearch');
  const focusRef = useRef<FocusRef>(null);
  
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
        
        if (res.ok && data.chats && Array.isArray(data.chats)) {
          setChats(data.chats);
        } else {
          console.error('Failed to fetch chats:', data.message || 'Unknown error');
          setChats([]);
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
        setChats([]);
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

  const navLinks: NavLink[] = [
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
        isExpanded ? "lg:w-64 translate-x-0" : "lg:w-16 translate-x-0"
      )}>
        <div className="flex h-full flex-col bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl border-r border-gray-200/20 dark:border-gray-700/30 relative transition-all duration-300 ease-in-out shadow-xl">
          <div className="flex flex-col items-start w-full space-y-6 px-3 py-6 flex-1 min-h-0 transition-all duration-300 ease-in-out">
            {/* Premium Brand Section */}
            <div className="w-full flex items-center">
              <div className={cn(
                "flex-1 text-xl font-medium duration-300 ease-in-out",
                isExpanded ? "opacity-100 pl-2" : "opacity-0 w-0 pl-0"
              )}>
                EscapeArtist AI
              </div>
              <div className="flex items-center justify-center w-10">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="relative flex items-center justify-center h-9 w-9 cursor-pointer hover:bg-gray-100/80 dark:hover:bg-gray-700/80 duration-200 transition rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white shadow-sm hover:shadow-md"
                  data-tooltip-id="toggle-tooltip"
                  data-tooltip-content="Toggle Sidebar"
                >
                  {isExpanded ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                </button>
              </div>
            </div>

            {/* Premium Navigation Section */}
            <div className="w-full space-y-2">
              <div className="w-full">
                <Link 
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = '/';
                  }}
                  className="relative flex items-center h-11 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 duration-200 transition rounded-xl text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white group hover:shadow-md"
                  data-tooltip-id="new-chat-tooltip"
                  data-tooltip-content="New Chat"
                >
                  <div className="flex items-center justify-center w-10 h-10 flex-shrink-0 rounded-lg group-hover:bg-white/50 dark:group-hover:bg-gray-800/50 transition-colors duration-200">
                    <PenLine size={20} />
                  </div>
                  <span className={cn(
                    "text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out",
                    isExpanded ? "opacity-100 w-auto ml-2" : "opacity-0 w-0"
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
                  {link.onClick ? (
                    <button
                      onClick={link.onClick}
                      data-tooltip-id={`nav-tooltip-${i}`}
                      data-tooltip-content={link.label}
                      className={cn(
                        'relative flex items-center h-11 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 duration-200 transition rounded-xl w-full group hover:shadow-md',
                        link.active
                          ? 'text-gray-900 dark:text-white bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30'
                          : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
                      )}
                    >
                      <div className="flex items-center justify-center w-10 h-10 flex-shrink-0 rounded-lg group-hover:bg-white/50 dark:group-hover:bg-gray-800/50 transition-colors duration-200">
                        <link.icon size={20} />
                      </div>
                      <span className={cn(
                        "text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out",
                        isExpanded ? "opacity-100 w-auto ml-2" : "opacity-0 w-0"
                      )}>{link.label}</span>
                    </button>
                  ) : (
                    <Link
                      href={link.href}
                      data-tooltip-id={`nav-tooltip-${i}`}
                      data-tooltip-content={link.label}
                      className={cn(
                        'relative flex items-center h-11 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 duration-200 transition rounded-xl group hover:shadow-md',
                        link.active
                          ? 'text-gray-900 dark:text-white bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30'
                          : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
                      )}
                    >
                      <div className="flex items-center justify-center w-10 h-10 flex-shrink-0 rounded-lg group-hover:bg-white/50 dark:group-hover:bg-gray-800/50 transition-colors duration-200">
                        <link.icon size={20} />
                      </div>
                      <span className={cn(
                        "text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out",
                        isExpanded ? "opacity-100 w-auto ml-2" : "opacity-0 w-0"
                      )}>{link.label}</span>
                    </Link>
                  )}
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

            {/* Premium Chat History List */}
            <div className={cn(
              "w-full flex-1 min-h-0 flex flex-col mt-2 transition-all duration-300 ease-in-out",
              isExpanded ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
            )}>
              <div className="text-xs text-gray-500 dark:text-gray-400 px-3 mb-1 transition-all duration-300 ease-in-out whitespace-nowrap flex-shrink-0">recent chats</div>
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {loading ? (
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400 transition-all duration-300 ease-in-out whitespace-nowrap py-4">Loading...</div>
                ) : !chats || chats.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400 transition-all duration-300 ease-in-out whitespace-nowrap py-4">No chats yet</div>
                ) : (
                  chats.map((chat) => (
                    <div key={chat.id} className="group relative mb-0.5">
                      {editingChatId === chat.id ? (
                        <div className="flex items-center px-3 py-1.5">
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
                            className="w-full bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm text-gray-700 dark:text-gray-300 transition-all duration-200"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className={cn(
                          "relative group rounded-xl transition-all duration-200 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:shadow-md hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-blue-900/10 dark:hover:to-purple-900/10",
                          pathname === `/c/${chat.id}` ? "bg-gradient-to-r from-blue-100/80 to-purple-100/80 dark:from-blue-900/20 dark:to-purple-900/20 text-gray-900 dark:text-white" : ""
                        )}>
                          <Link
                            href={`/c/${chat.id}`}
                            className="block w-full px-3 py-1.5"
                          >
                            <span className={cn(
                              "text-sm font-medium truncate transition-all duration-300 ease-in-out block",
                              isExpanded ? "opacity-100" : "opacity-0"
                            )}>{chat.title}</span>
                          </Link>
                          <div className={cn(
                            "absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 transition-opacity duration-200 opacity-0 group-hover:opacity-100 pointer-events-none",
                            isExpanded ? "flex" : "hidden"
                          )}>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setEditingChatId(chat.id);
                                setEditingTitle(chat.title);
                              }}
                              className="p-1.5 hover:bg-black/20 dark:hover:bg-white/20 rounded-lg transition-all duration-200 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm pointer-events-auto"
                            >
                              <PencilLine size={14} className="text-gray-600 dark:text-gray-400" />
                            </button>
                            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg pointer-events-auto">
                              <DeleteChat chatId={chat.id} chats={chats} setChats={setChats} redirect={pathname === `/c/${chat.id}`} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-y-4 relative w-full px-3 py-4 border-t border-gray-200/20 dark:border-gray-700/20 bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl flex-shrink-0">
            {/* Premium Avatar with dropdown */}
            <div className="relative dropdown-container w-full">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="relative flex items-center h-12 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 duration-200 transition rounded-xl w-full text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white group shadow-sm hover:shadow-md"
              >
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 flex-shrink-0 rounded-xl transition-colors duration-200",
                  user ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 group-hover:bg-gray-300 dark:group-hover:bg-gray-600'
                )}>
                  {user ? (
                    <span className="text-white text-sm font-bold">
                      {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  ) : (
                    <UserIcon size={20} />
                  )}
                </div>
                <span className={cn(
                  "text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out text-left",
                  isExpanded ? "opacity-100 w-auto ml-3" : "opacity-0 w-0"
                )}>
                  {user ? (user.name || user.email || 'User') : 'Sign in'}
                </span>
              </button>

              {/* Premium Dropdown */}
              {dropdownOpen && (
                <div className={cn(
                  "fixed bottom-16 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/40 dark:border-gray-700/40 rounded-2xl shadow-2xl z-[9999]",
                  isExpanded ? "left-4 w-60" : "left-14 w-52"
                )}>
                  <div className="p-4">
                    {user ? (
                      <div className="flex flex-col space-y-3">
                        <Link
                          href="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center space-x-3 p-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 rounded-xl transition-all duration-200 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        >
                          <User size={18} className="text-gray-600 dark:text-gray-400" />
                          <span className="text-sm font-medium">Profile</span>
                        </Link>
                        <Link
                          href="/pricing"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center space-x-3 p-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 rounded-xl transition-all duration-200 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        >
                          <CreditCard size={18} className="text-gray-600 dark:text-gray-400" />
                          <span className="text-sm font-medium">Pricing</span>
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center space-x-3 p-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 rounded-xl transition-all duration-200 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        >
                          <Settings size={18} className="text-gray-600 dark:text-gray-400" />
                          <span className="text-sm font-medium">Settings</span>
                        </Link>
                        <button
                          onClick={() => {
                            signOut();
                            setDropdownOpen(false);
                          }}
                          className="flex items-center space-x-3 p-3 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-900/20 dark:hover:to-pink-900/20 rounded-xl transition-all duration-200 w-full text-left text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <LogOut size={18} className="text-gray-600 dark:text-gray-400" />
                          <span className="text-sm font-medium">Sign out</span>
                        </button>
                        <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-4 mt-2">
                          <div className="flex flex-col space-y-3">
                            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Theme</p>
                            <select 
                              value={theme}
                              onChange={(e) => handleThemeChange(e.target.value)}
                              className="bg-gray-50 dark:bg-gray-800 px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
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
                          className="flex items-center space-x-3 p-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 rounded-xl transition-all duration-200 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        >
                          <Settings size={18} className="text-gray-600 dark:text-gray-400" />
                          <span className="text-sm font-medium">Settings</span>
                        </Link>
                        <button
                          onClick={() => {
                            setAuthMode('login');
                            setAuthModalOpen(true);
                            setDropdownOpen(false);
                          }}
                          className="flex items-center space-x-3 p-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 rounded-xl transition-all duration-200 w-full text-left text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        >
                          <UserIcon size={18} className="text-gray-600 dark:text-gray-400" />
                          <span className="text-sm font-medium">Sign in</span>
                        </button>
                        <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-4 mt-2">
                          <div className="flex flex-col space-y-3">
                            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Theme</p>
                            <select 
                              value={theme}
                              onChange={(e) => handleThemeChange(e.target.value)}
                              className="bg-gray-50 dark:bg-gray-800 px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
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
          link.onClick ? (
            <button
              key={i}
              onClick={link.onClick}
              className={cn(
                'relative flex flex-col items-center space-y-1 text-center',
                link.active
                  ? 'text-black dark:text-white'
                  : 'text-black/60 dark:text-white/60 hover:text-black/80 dark:hover:text-white/80',
              )}
            >
              <link.icon size={20} />
              <p className="text-xs font-medium">{link.label}</p>
            </button>
          ) : (
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
          )
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
      
      {/* Hidden Focus component for template popup */}
      <div className="hidden">
        <Focus ref={focusRef} focusMode={focusMode} setFocusMode={setFocusMode} />
      </div>
    </div>
  );
};

export default Sidebar;
