'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, CreditCard, Filter, Search, Users, DollarSign, Calendar, User, Download, Building2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from '@/lib/utils';
import { TransactionImportModal } from '@/components/transaction-import-modal';

interface Transaction {
  id: string;
  name: string;
  amount: number;
  date: string;
  category?: string;
  description?: string;
  circle: {
    id: string;
    name: string;
    color?: string;
  };
  createdBy: {
    id: string;
    name: string;
  };
  splits: {
    id: string;
    amount: number;
    isPaid: boolean;
    user: {
      id: string;
      name: string;
    };
  }[];
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'settled' | 'unsettled'>('all');
  const [importing, setImporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions');
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.circle.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    
    const hasUnpaidSplits = transaction.splits.some(split => !split.isPaid);
    if (filterType === 'unsettled') return matchesSearch && hasUnpaidSplits;
    if (filterType === 'settled') return matchesSearch && !hasUnpaidSplits;
    
    return matchesSearch;
  });

  const totalSpent = transactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const unsettledAmount = transactions.reduce((sum, transaction) => {
    const unpaidSplits = transaction.splits.filter(split => !split.isPaid);
    return sum + unpaidSplits.reduce((splitSum, split) => splitSum + Number(split.amount), 0);
  }, 0);

  const handleImportTransactions = () => {
    setShowImportModal(true);
  };

  const handleImportSelected = async (transactions: any[], circleId: string) => {
    setImporting(true);
    try {
      // Call the import API
      const response = await fetch('/api/transactions/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions,
          circleId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import transactions');
      }

      // Refresh the transactions list after successful import
      await fetchTransactions();
      alert(`Successfully imported ${transactions.length} transactions!`);
    } catch (error) {
      console.error('Error importing transactions:', error);
      alert('Failed to import transactions. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Transactions</h1>
            <div className="flex gap-2">
              <Button
                onClick={handleImportTransactions}
                variant="outline"
                className="cursor-pointer"
              >
                <Download className="h-4 w-4 mr-2" />
                Import from Bank
              </Button>
              <Button asChild className="cursor-pointer">
                <Link href="/dashboard/circles" className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  View Circles
                </Link>
              </Button>
            </div>
          </div>
        <p className="text-muted-foreground">
          Track and manage all your shared expenses across different circles.
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unsettled</p>
                <p className="text-2xl font-bold">{formatCurrency(unsettledAmount)}</p>
              </div>
              <Calendar className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{transactions.length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            className="cursor-pointer"
            variant={filterType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('all')}
          >
            All
          </Button>
          <Button
            className="cursor-pointer"
            variant={filterType === 'unsettled' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('unsettled')}
          >
            Unsettled
          </Button>
          <Button
            className="cursor-pointer"
            variant={filterType === 'settled' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('settled')}
          >
            Settled
          </Button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {transactions.length === 0 ? 'No transactions yet' : 'No transactions found'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {transactions.length === 0 
                  ? 'Start tracking shared expenses by adding your first transaction. You can add transactions manually or import them from your connected bank accounts.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
                                {transactions.length === 0 && (
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button asChild className="cursor-pointer">
                        <Link href="/dashboard/circles" className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          View Circles
                        </Link>
                      </Button>
                      <Button variant="outline" asChild className="cursor-pointer">
                        <Link href="/dashboard/circles/new" className="flex items-center">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Circle
                        </Link>
                      </Button>
                      <Button variant="outline" asChild className="cursor-pointer">
                        <Link href="/dashboard/bank-accounts" className="flex items-center">
                          <Building2 className="h-4 w-4 mr-2" />
                          Connect Bank
                        </Link>
                      </Button>
                    </div>
                  )}
            </CardContent>
          </Card>
        ) : (
          filteredTransactions.map((transaction) => (
            <Card key={transaction.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: transaction.circle.color || '#6366f1' }}
                      />
                      <h3 className="font-semibold">{transaction.name}</h3>
                      <Badge variant="outline">{transaction.circle.name}</Badge>
                    </div>
                    {transaction.description && (
                      <p className="text-muted-foreground text-sm mb-2">{transaction.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(transaction.date)}
                      </span>
                                             <span className="flex items-center gap-1">
                         <User className="h-3 w-3" />
                         {transaction.createdBy.name}
                       </span>
                      {transaction.category && (
                        <span>{transaction.category}</span>
                      )}
                    </div>
                  </div>
                                     <div className="text-right">
                     <p className={`text-lg font-semibold ${Number(transaction.amount) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                       {formatCurrency(Math.abs(transaction.amount))}
                     </p>
                     <p className="text-sm text-muted-foreground">
                       {transaction.splits.length} split{transaction.splits.length !== 1 ? 's' : ''}
                     </p>
                   </div>
                </div>
                
                {/* Splits Preview */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">Splits:</span>
                    <div className="flex items-center gap-1">
                      {transaction.splits.slice(0, 3).map((split) => (
                        <Avatar key={split.id} className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {split.user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {transaction.splits.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{transaction.splits.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Status:</span>
                    {transaction.splits.every(split => split.isPaid) ? (
                      <Badge variant="secondary" className="text-xs">Settled</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Unsettled</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Features */}
      <div className="mt-12 grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Bank Integration</CardTitle>
            <CardDescription>
              Connect your bank accounts securely with Plaid to automatically import and categorize transactions.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Filter className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Smart Filtering</CardTitle>
            <CardDescription>
              Filter transactions by circle, date range, category, or amount to find exactly what you're looking for.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Manual Entry</CardTitle>
            <CardDescription>
              Add transactions manually with detailed information including receipts, categories, and custom descriptions.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Import Modal */}
      <TransactionImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportSelected}
      />
    </div>
  );
}
