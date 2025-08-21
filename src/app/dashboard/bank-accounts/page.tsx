'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlaidLink } from '@/components/plaid-link';
import {
  CreditCard,
  Plus,
  Trash2,
  RefreshCw,
  Building2,
  Wallet
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface BankAccount {
  id: string;
  institution: string;
  accountName: string;
  accountType: string;
  mask?: string;
  createdAt: string;
}

export default function BankAccountsPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const fetchBankAccounts = async () => {
    try {
      const response = await fetch('/api/bank-accounts');
      if (!response.ok) throw new Error('Failed to fetch bank accounts');
      const data = await response.json();
      setBankAccounts(data.bankAccounts || []);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      setError('Failed to load bank accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectBankSuccess = () => {
    fetchBankAccounts(); // Refresh the list after successful connection
  };

  const handleConnectBankError = (error: string) => {
    setError(error);
  };

  const handleDisconnectBank = async (bankAccountId: string) => {
    if (!confirm('Are you sure you want to disconnect this bank account?')) return;

    try {
      const response = await fetch(`/api/bank-accounts/${bankAccountId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to disconnect bank account');

      fetchBankAccounts(); // Refresh the list
    } catch (error) {
      console.error('Error disconnecting bank account:', error);
      setError('Failed to disconnect bank account');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading bank accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Bank Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your connected bank accounts</p>
        </div>
        {bankAccounts.length > 0 && (
          <PlaidLink
            key="header-plaid-link"
            onSuccess={handleConnectBankSuccess}
            onError={handleConnectBankError}
            className="flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Connect Bank Account
          </PlaidLink>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Bank Accounts List */}
      <div className="space-y-4">
        {bankAccounts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No bank accounts connected</h3>
              <p className="text-muted-foreground mb-6">
                Connect your bank accounts to automatically import transactions and track expenses.
              </p>
                                <div className="flex justify-center">
                    <PlaidLink
                      key="empty-state-plaid-link"
                      onSuccess={handleConnectBankSuccess}
                      onError={handleConnectBankError}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      Connect Your First Bank Account
                    </PlaidLink>
                  </div>
            </CardContent>
          </Card>
        ) : (
          bankAccounts.map((bankAccount) => (
            <Card key={bankAccount.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                                            <div>
                          <h3 className="text-lg font-semibold">{bankAccount.institution}</h3>
                          <p className="text-sm text-muted-foreground">
                            {bankAccount.accountName} • {bankAccount.accountType}
                          </p>
                        </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnectBank(bankAccount.id)}
                    className="text-destructive hover:text-destructive cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Disconnect
                  </Button>
                </div>
              </CardHeader>
                                <CardContent>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                          <Wallet className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{bankAccount.accountName}</p>
                          <p className="text-sm text-muted-foreground">
                            {bankAccount.mask ? `****${bankAccount.mask}` : ''} • {bankAccount.accountType}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Features */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <RefreshCw className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Automatic Sync</CardTitle>
            <CardDescription>
              Transactions are automatically synced from your connected bank accounts.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Secure Connection</CardTitle>
            <CardDescription>
              Bank connections are secured with bank-level encryption through Plaid.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Easy Import</CardTitle>
            <CardDescription>
              Import transactions directly into your circles with just a few clicks.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
