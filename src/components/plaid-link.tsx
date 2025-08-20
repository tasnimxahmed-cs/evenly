'use client';

import { usePlaidLink } from 'react-plaid-link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface PlaidLinkProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  children?: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function PlaidLink({ 
  onSuccess, 
  onError, 
  children, 
  variant = 'default',
  size = 'default',
  className = ''
}: PlaidLinkProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token, metadata) => {
      try {
        setLoading(true);
        
        // Exchange the public token for an access token and save bank account
        const response = await fetch('/api/plaid/exchange-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            publicToken: public_token,
            metadata,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to connect bank account');
        }

        onSuccess?.();
        // Refresh the page to show the new bank account
        window.location.reload();
      } catch (error) {
        console.error('Error connecting bank account:', error);
        onError?.(error instanceof Error ? error.message : 'Failed to connect bank account');
      } finally {
        setLoading(false);
        setLinkToken(null); // Reset token after success
      }
    },
    onExit: (err, metadata) => {
      if (err) {
        console.error('Plaid Link exit error:', err);
        onError?.(err.display_message || 'Failed to connect bank account');
      }
      setLoading(false);
      setLinkToken(null); // Reset token on exit
    },
  });

  // Auto-open when ready and token is set
  useEffect(() => {
    if (ready && linkToken && loading) {
      console.log('Auto-opening Plaid Link...');
      open();
    }
  }, [ready, linkToken, loading, open]);

  const handleConnect = async () => {
    if (loading) return; // Prevent multiple clicks
    
    try {
      setLoading(true);
      
      // Get a link token from our API
      const response = await fetch('/api/plaid/link-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to initialize bank connection');
      }

      const { linkToken: token } = await response.json();
      console.log('Received link token:', token);
      
      // Set the token in state
      setLinkToken(token);
      
      // The useEffect will handle opening when ready
      console.log('Token set, waiting for Plaid to be ready...');
    } catch (error) {
      console.error('Error initializing Plaid Link:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to initialize bank connection');
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleConnect}
      disabled={loading}
      variant={variant}
      size={size}
      className={className}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Connecting...
        </>
      ) : (
        children || (
          <>
            <Plus className="h-4 w-4 mr-2" />
            Connect Bank Account
          </>
        )
      )}
    </Button>
  );
}
