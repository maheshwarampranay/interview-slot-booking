//layout.tsx
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'COSC Recruitments - Interview Slot Booking',
  description: 'Interview slot booking for COSC Recruitments',
};

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={cn(
        'min-h-screen bg-gradient-to-br from-[#373272] to-[#D72087] antialiased',
        inter.className
      )}>
        <div className="relative flex min-h-screen flex-col items-center justify-center">
          <div className="flex-1 flex items-center justify-center w-full">
            <div className="container py-6">
            <Toaster position="top-center" reverseOrder={false} />
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}