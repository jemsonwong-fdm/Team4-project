import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentRM } from "@/lib/auth";
import DashboardContent from "./_components/dashboard-content";
import Link from "next/link";
import { initializeMockData } from "@/lib/data/initMockData";

export default async function DashboardPage() {
  // Initialize mock data on first load
  await initializeMockData();

  const rm = await getCurrentRM();

  if (!rm) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="w-full">Log In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <DashboardContent rmName={rm.name} rmSegment={rm.segment} />;
}
