//page.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center">
          <Image 
            src="/cosc.svg" 
            alt="COSC Logo" 
            width={80} 
            height={80} 
            className="mb-4" 
          />
          <CardTitle className="text-2xl text-center text-purple-600">
            Decipher - Slot Booking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Welcome to the Decipher slot booking system! 
            Use your unique participant link to select your preferred time slot.
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Event Date: March 5th, 2024 | Venue: CSE Lab 8 & DF Lab
          </p>
          <p className="text-center text-sm text-muted-foreground">
            If you haven&apos;t received your participant link, please contact the COSC team.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}