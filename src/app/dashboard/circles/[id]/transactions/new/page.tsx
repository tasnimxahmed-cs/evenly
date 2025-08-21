'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function CircleNewTransactionPage() {
  const params = useParams();
  const router = useRouter();
  const circleId = params.id as string;

  useEffect(() => {
    // Redirect to the standardized transaction page with the circle pre-selected
    router.replace(`/dashboard/transactions/new?circleId=${circleId}`);
  }, [circleId, router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
