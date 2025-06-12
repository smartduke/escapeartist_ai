'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Initialize with null to handle SSR
  const [isExpanded, setIsExpanded] = useState<boolean | null>(null);

  // Handle initial state and localStorage sync
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarExpanded') === 'true';
    setIsExpanded(savedState);
  }, []);

  // Save state changes to localStorage
  useEffect(() => {
    if (isExpanded !== null) {
      localStorage.setItem('sidebarExpanded', isExpanded.toString());
    }
  }, [isExpanded]);

  // Don't render children until we have loaded the initial state
  if (isExpanded === null) {
    return null;
  }

  return (
    <SidebarContext.Provider value={{ isExpanded, setIsExpanded: (value: boolean) => setIsExpanded(value) }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
} 