import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-purple-600">
            Welcome to Interview Scheduler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Please use your provided interview link to schedule your slot, or log in as an administrator to manage schedules.
          </p>
          <div className="flex justify-center">
            <Link href="/admin">
              <Button className="bg-purple-600 hover:bg-purple-700">
                Go to Admin Panel
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}