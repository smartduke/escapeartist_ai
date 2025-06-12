'use client';

import { useSidebar } from './SidebarContext';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { isExpanded } = useSidebar();

  return (
    <main className={`transition-all duration-300 ease-in-out ${isExpanded ? 'lg:pl-64' : 'lg:pl-12'} bg-light-primary dark:bg-dark-primary min-h-screen relative`}>
      <div className="max-w-screen-lg lg:mx-auto mx-4">{children}</div>
    </main>
  );
};

export default Layout;
