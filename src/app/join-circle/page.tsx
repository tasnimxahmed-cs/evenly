"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface Circle {
  id: string;
  name: string;
  description?: string;
  color: string;
  _count: {
    members: number;
  };
}

export default function JoinCirclePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [circle, setCircle] = useState<Circle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');
  const circleId = searchParams.get('circleId');

  useEffect(() => {
    if (token && circleId) {
      fetchCircleDetails();
    } else {
      setError('Invalid invite link');
      setIsLoading(false);
    }
  }, [token, circleId]);

  const fetchCircleDetails = async () => {
    try {
      const response = await fetch(`/api/circles/${circleId}/details?token=${token}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch circle details');
      }
      const data = await response.json();
      setCircle(data);
    } catch (error) {
      console.error('Error fetching circle details:', error);
      setError(error instanceof Error ? error.message : 'Failed to load circle details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCircle = async () => {
    if (!token || !circleId) return;

    setIsJoining(true);
    try {
      const response = await fetch('/api/circles/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          circleId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join circle');
      }

      const data = await response.json();
      router.push(`/dashboard/circles/${circleId}`);
    } catch (error) {
      console.error('Error joining circle:', error);
      setError(error instanceof Error ? error.message : 'Failed to join circle');
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading circle details...</p>
        </div>
      </div>
    );
  }

  if (error || !circle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="h-16 w-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-warning" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Invalid Invite Link</h1>
          <p className="text-muted-foreground mb-6">
            {error || 'This invite link is invalid or has expired.'}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href="/dashboard" className="flex items-center">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/circles">
                Browse Circles
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">E</span>
            </div>
            <span className="text-2xl font-bold">Evenly</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">You're Invited!</h1>
          <p className="text-muted-foreground">
            Join this circle to start splitting expenses with friends
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <div
              className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: circle.color || "#6366f1" }}
            >
              {circle.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{circle.name}</h2>
              {circle.description && (
                <p className="text-sm text-muted-foreground">{circle.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {circle._count.members} member{circle._count.members !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" />
              Active Circle
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={handleJoinCircle}
            disabled={isJoining}
            className="w-full"
            size="lg"
          >
            {isJoining ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Joining Circle...
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                Join Circle
              </>
            )}
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            By joining this circle, you'll be able to see and contribute to shared expenses.
          </p>
        </div>
      </div>
    </div>
  );
}
