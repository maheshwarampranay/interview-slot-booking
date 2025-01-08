// app/layout.tsx
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Interview Scheduler',
  description: 'Schedule your interview time slots',
};

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={cn(
        'min-h-screen bg-background antialiased',
        inter.className
      )}>
        <div className="relative flex min-h-screen flex-col items-center justify-center">
          <div className="flex-1 flex items-center justify-center w-full">
            <div className="container py-6">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}