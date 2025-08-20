import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, AlertTriangle } from "lucide-react";

export default function CircleNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto">
        <div className="h-16 w-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-warning" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Circle Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The circle you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="cursor-pointer">
            <Link href="/dashboard/circles" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Circles
            </Link>
          </Button>
          <Button variant="outline" asChild className="cursor-pointer">
            <Link href="/dashboard/circles/new" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Create New Circle
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
