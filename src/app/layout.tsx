import type { Metadata } from 'next';
import { Montserrat, Poppins } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import ThemeProvider from '@/components/theme/Provider';
import { Toaster } from 'sonner';
import Sidebar from '@/components/Sidebar';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { SidebarProvider } from '@/components/SidebarContext';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  fallback: ['Arial', 'sans-serif'],
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: 'EscapeArtist AI',
  description: 'Your AI-powered travel companion',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className="h-full" lang="en" suppressHydrationWarning>
      <body className={cn('h-full', poppins.variable, 'font-poppins')}>
        <ThemeProvider>
          <AuthProvider>
            <SidebarProvider>
              <Sidebar>{children}</Sidebar>
              <Toaster
                toastOptions={{
                  unstyled: true,
                  classNames: {
                    toast:
                      'bg-light-primary dark:bg-dark-secondary dark:text-white/70 text-black-70 rounded-lg p-4 flex flex-row items-center space-x-2',
                  },
                }}
              />
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
