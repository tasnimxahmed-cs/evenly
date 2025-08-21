'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  DollarSign, 
  Calendar, 
  Users, 
  Save,
  X
} from 'lucide-react';
import Link from "next/link";
import { formatCurrency } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Split {
  id: string;
  userId: string;
  amount: number;
  isPaid: boolean;
  user: User;
}

interface TransactionData {
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
  splits: Split[];
}

type SplitType = 'EQUAL' | 'PERCENTAGE' | 'CUSTOM';

export default function EditTransactionPage() {
  const params = useParams();
  const router = useRouter();
  const transactionId = params.id as string;

  const [transaction, setTransaction] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('EQUAL');
  const [splits, setSplits] = useState<Split[]>([]);

  useEffect(() => {
    fetchTransactionData();
  }, [transactionId]);

  const fetchTransactionData = async () => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`);
      if (!response.ok) throw new Error('Failed to fetch transaction data');
      const data = await response.json();
      setTransaction(data);
      
      // Initialize form with existing data
      setName(data.name);
      setAmount(data.amount.toString());
      setDate(new Date(data.date).toISOString().split('T')[0]);
      setCategory(data.category || '');
      setDescription(data.description || '');
      setSplits(data.splits || []);
      
      // Determine split type
      if (data.splits && data.splits.length > 0) {
        const equalAmount = data.amount / data.splits.length;
        const isEqual = data.splits.every((split: Split) => Math.abs(split.amount - equalAmount) < 0.01);
        setSplitType(isEqual ? 'EQUAL' : 'CUSTOM');
      }
    } catch (error) {
      console.error('Error fetching transaction data:', error);
      setError('Failed to load transaction data');
    } finally {
      setLoading(false);
    }
  };

  const handleSplitTypeChange = (newSplitType: SplitType) => {
    setSplitType(newSplitType);
    
    if (newSplitType === 'EQUAL') {
      // Reset to equal splits
      const equalAmount = parseFloat(amount) / (transaction?.splits.length || 1);
      setSplits(transaction?.splits.map(split => ({
        ...split,
        amount: equalAmount
      })) || []);
    } else if (newSplitType === 'PERCENTAGE') {
      // Initialize with equal percentages
      const equalPercentage = 100 / (transaction?.splits.length || 1);
      setSplits(transaction?.splits.map(split => ({
        ...split,
        amount: (parseFloat(amount) * equalPercentage) / 100
      })) || []);
    }
  };

  const updateSplit = (userId: string, field: 'amount', value: number) => {
    setSplits(prev => prev.map(split => 
      split.userId === userId 
        ? { ...split, [field]: value }
        : split
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !amount || parseFloat(amount) <= 0) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const transactionData = {
        name: name.trim(),
        amount: parseFloat(amount),
        date: new Date(date).toISOString(),
        category: category.trim() || undefined,
        description: description.trim() || undefined,
        splitType,
        splits: splitType !== 'EQUAL' ? splits : undefined,
      };

      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update transaction');
      }

      // Redirect to transaction detail page
      router.push(`/dashboard/transactions/${transactionId}`);
    } catch (error) {
      console.error('Error updating transaction:', error);
      setError(error instanceof Error ? error.message : 'Failed to update transaction');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Transaction not found</p>
      </div>
    );
  }

  const totalAmount = parseFloat(amount) || 0;
  const totalSplit = splits.reduce((sum, split) => sum + split.amount, 0);
  const isValid = splitType === 'EQUAL' || Math.abs(totalSplit - totalAmount) < 0.01;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
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
          <h1 className="text-3xl font-bold">Edit Transaction</h1>
          <p className="text-muted-foreground">Update transaction details for {transaction.circle.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Transaction Info */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>Update the basic information for this transaction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                type="text"
                placeholder="e.g., Dinner at Restaurant"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="date">Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="category">Category (optional)</Label>
              <Input
                type="text"
                placeholder="e.g., Food, Transportation, Entertainment"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                placeholder="Additional details about this transaction"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Split Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Split Configuration</CardTitle>
            <CardDescription>Choose how to split this expense among members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                className="cursor-pointer"
                type="button"
                variant={splitType === 'EQUAL' ? 'default' : 'outline'}
                onClick={() => handleSplitTypeChange('EQUAL')}
              >
                Equal Split
              </Button>
              <Button
                className="cursor-pointer"
                type="button"
                variant={splitType === 'PERCENTAGE' ? 'default' : 'outline'}
                onClick={() => handleSplitTypeChange('PERCENTAGE')}
              >
                Percentage
              </Button>
              <Button
                className="cursor-pointer"
                type="button"
                variant={splitType === 'CUSTOM' ? 'default' : 'outline'}
                onClick={() => handleSplitTypeChange('CUSTOM')}
              >
                Custom Amounts
              </Button>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Members ({transaction.splits.length})</h4>
              {transaction.splits.map((split) => {
                const splitAmount = splitType === 'EQUAL' 
                  ? totalAmount / transaction.splits.length
                  : split.amount;

                return (
                  <div key={split.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{split.user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{split.user.name}</p>
                        <p className="text-sm text-muted-foreground">{split.user.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {splitType === 'PERCENTAGE' && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={((split.amount / totalAmount) * 100).toFixed(1)}
                            onChange={(e) => {
                              const percentage = parseFloat(e.target.value) || 0;
                              const newAmount = (totalAmount * percentage) / 100;
                              updateSplit(split.userId, 'amount', newAmount);
                            }}
                            className="w-20"
                          />
                          <span className="text-sm">%</span>
                        </div>
                      )}
                      
                      {splitType === 'CUSTOM' && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={split.amount.toFixed(2)}
                            onChange={(e) => updateSplit(split.userId, 'amount', parseFloat(e.target.value) || 0)}
                            className="w-24"
                          />
                        </div>
                      )}
                      
                      <div className="text-right">
                        <p className="font-medium">${splitAmount.toFixed(2)}</p>
                        {splitType === 'PERCENTAGE' && (
                          <p className="text-xs text-muted-foreground">{((split.amount / totalAmount) * 100).toFixed(1)}%</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Validation */}
            {splitType !== 'EQUAL' && (
              <div className={`p-3 rounded-lg ${isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={`text-sm ${isValid ? 'text-green-700' : 'text-red-700'}`}>
                  {splitType === 'PERCENTAGE' && (
                    `Total: ${((totalSplit / totalAmount) * 100).toFixed(1)}% ${isValid ? '(Valid)' : '(Must equal 100%)'}`
                  )}
                  {splitType === 'CUSTOM' && (
                    `Total: $${totalSplit.toFixed(2)} ${isValid ? '(Valid)' : `(Must equal $${totalAmount.toFixed(2)})`}`
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving || !isValid || !name.trim() || !amount}
            className="flex items-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Updating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Update Transaction
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
