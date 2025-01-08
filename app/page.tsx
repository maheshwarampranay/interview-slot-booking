import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-purple-600">
            COSC interview scheduler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            We will remove the admin panel after generating links
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