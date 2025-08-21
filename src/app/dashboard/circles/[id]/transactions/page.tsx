'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Plus, 
  DollarSign, 
  Calendar, 
  User, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Circle,
  ArrowLeft,
  Filter,
  Search,
  CreditCard
} from 'lucide-react';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface TransactionSplit {
  id: string;
  amount: number;
  percentage?: number;
  isPaid: boolean;
  paidAt?: string;
  user: User;
}

interface Transaction {
  id: string;
  name: string;
  amount: number;
  date: string;
  category?: string;
  description?: string;
  splitType: 'EQUAL' | 'PERCENTAGE' | 'CUSTOM';
  isSettled: boolean;
  createdAt: string;
  createdBy: User;
  splits: TransactionSplit[];
}

interface CircleData {
  id: string;
  name: string;
  description?: string;
  color?: string;
  members: {
    user: User;
    role: 'ADMIN' | 'MEMBER';
  }[];
}

export default function CircleTransactionsPage() {
  const params = useParams();
  const router = useRouter();
  const circleId = params.id as string;

  const [circle, setCircle] = useState<CircleData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unsettled' | 'settled'>('all');

  useEffect(() => {
    fetchCircleData();
    fetchTransactions();
  }, [circleId]);

  const fetchCircleData = async () => {
    try {
      const response = await fetch(`/api/circles/${circleId}`);
      if (!response.ok) throw new Error('Failed to fetch circle data');
      const data = await response.json();
      setCircle(data);
    } catch (error) {
      console.error('Error fetching circle data:', error);
      setError('Failed to load circle data');
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/circles/${circleId}/transactions`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const response = await fetch(`/api/circles/${circleId}/transactions/${transactionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete transaction');

      fetchTransactions(); // Refresh the list
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setError('Failed to delete transaction');
    }
  };

  const handleMarkSplitPaid = async (transactionId: string, splitId: string, isPaid: boolean) => {
    try {
      const response = await fetch(`/api/circles/${circleId}/transactions/${transactionId}/splits/${splitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaid }),
      });

      if (!response.ok) throw new Error('Failed to update split');

      fetchTransactions(); // Refresh the list
    } catch (error) {
      console.error('Error updating split:', error);
      setError('Failed to update split');
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'settled' && transaction.isSettled) ||
                         (filterType === 'unsettled' && !transaction.isSettled);

    return matchesSearch && matchesFilter;
  });

  const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const unsettledTransactions = transactions.filter(t => !t.isSettled);
  const settledTransactions = transactions.filter(t => t.isSettled);

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

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4 cursor-pointer">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{circle?.name} Transactions</h1>
            <p className="text-muted-foreground">Manage expenses and settlements</p>
          </div>
        </div>
        <Button 
          onClick={() => router.push(`/dashboard/circles/${circleId}/transactions/new`)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <CreditCard className="h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unsettled</CardTitle>
            <Circle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unsettledTransactions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settled</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settledTransactions.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex flex-wrap gap-2">
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
        </CardContent>
      </Card>

      {/* Transactions List */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No transactions found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Add your first transaction to get started'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTransactions.map((transaction) => (
            <Card key={transaction.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <Link 
                        href={`/dashboard/transactions/${transaction.id}`}
                        className="text-lg font-semibold hover:text-primary transition-colors cursor-pointer"
                      >
                        {transaction.name}
                      </Link>
                      <Badge variant={transaction.isSettled ? 'default' : 'secondary'}>
                        {transaction.isSettled ? 'Settled' : 'Unsettled'}
                      </Badge>
                      <Badge variant="outline">{transaction.splitType}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(transaction.amount)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(transaction.date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {transaction.createdBy.name}
                      </div>
                    </div>
                    {transaction.description && (
                      <p className="text-sm text-muted-foreground mt-2">{transaction.description}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="cursor-pointer"
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/dashboard/circles/${circleId}/transactions/${transaction.id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTransaction(transaction.id)}
                      className="text-destructive hover:text-destructive cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Splits:</h4>
                  <div className="grid gap-2">
                    {transaction.splits.map((split) => (
                      <div key={split.id} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={split.user.avatar} />
                            <AvatarFallback>{split.user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{split.user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(split.amount)}
                              {split.percentage && ` (${split.percentage}%)`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={split.isPaid ? 'default' : 'secondary'}>
                            {split.isPaid ? 'Paid' : 'Unpaid'}
                          </Badge>
                          {!split.isPaid && (
                            <Button
                              className="cursor-pointer"
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkSplitPaid(transaction.id, split.id, true)}
                            >
                              Mark Paid
                            </Button>
                          )}
                          {split.isPaid && (
                            <Button
                              className="cursor-pointer"
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkSplitPaid(transaction.id, split.id, false)}
                            >
                              Mark Unpaid
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
