import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image'; // For optimized image handling

export default function HomePage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center">
          {/* Add the logo here */}
          <Image 
            src="/cosc.png" 
            alt="COSC Logo" 
            width={80} 
            height={80} 
            className="mb-4" 
          />
          <CardTitle className="text-2xl text-center text-purple-600">
            COSC Interview Scheduler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Welcome! Please use your unique interview link to schedule your interview time slot.
          </p>
          <p className="text-center text-sm text-muted-foreground">
            If you haven&apos;t received your interview link, please contact team COSC.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
