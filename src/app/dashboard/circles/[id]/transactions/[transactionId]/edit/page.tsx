'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  DollarSign, 
  Calendar, 
  Users, 
  Save,
  X
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
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

interface TransactionSplit {
  id: string;
  userId: string;
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

type SplitType = 'EQUAL' | 'PERCENTAGE' | 'CUSTOM';

interface Split {
  userId: string;
  amount?: number;
  percentage?: number;
}

export default function EditTransactionPage() {
  const params = useParams();
  const router = useRouter();
  // Extract parameters from the nested route structure
  // For route /circles/[id]/transactions/[transactionId]/edit
  const circleId = params.id as string;
  const transactionId = params.transactionId as string;

  const [circle, setCircle] = useState<CircleData | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
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
    fetchData();
  }, [circleId, transactionId]);

  const fetchData = async () => {
    try {
      const [circleResponse, transactionResponse] = await Promise.all([
        fetch(`/api/circles/${circleId}`),
        fetch(`/api/circles/${circleId}/transactions/${transactionId}`)
      ]);

      if (!circleResponse.ok) throw new Error('Failed to fetch circle data');
      if (!transactionResponse.ok) throw new Error('Failed to fetch transaction data');

      const circleData = await circleResponse.json();
      const transactionData = await transactionResponse.json();

      setCircle(circleData);
      setTransaction(transactionData);

      // Initialize form with transaction data
      setName(transactionData.name);
      setAmount(transactionData.amount.toString());
      setDate(new Date(transactionData.date).toISOString().split('T')[0]);
      setCategory(transactionData.category || '');
      setDescription(transactionData.description || '');
      setSplitType(transactionData.splitType);

      // Initialize splits based on existing transaction splits
      const initialSplits = transactionData.splits.map((split: TransactionSplit) => ({
        userId: split.userId,
        amount: split.amount,
        percentage: split.percentage,
      }));
      setSplits(initialSplits);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSplitTypeChange = (newSplitType: SplitType) => {
    setSplitType(newSplitType);
    
    if (newSplitType === 'EQUAL') {
      // Reset to equal splits
      setSplits(circle?.members.map(member => ({
        userId: member.user.id,
      })) || []);
    } else if (newSplitType === 'PERCENTAGE') {
      // Initialize with equal percentages
      const equalPercentage = 100 / (circle?.members.length || 1);
      setSplits(circle?.members.map(member => ({
        userId: member.user.id,
        percentage: equalPercentage,
      })) || []);
    } else if (newSplitType === 'CUSTOM') {
      // Initialize with equal amounts
      const equalAmount = parseFloat(amount) / (circle?.members.length || 1);
      setSplits(circle?.members.map(member => ({
        userId: member.user.id,
        amount: equalAmount,
      })) || []);
    }
  };

  const updateSplit = (userId: string, field: 'amount' | 'percentage', value: number) => {
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

      const response = await fetch(`/api/circles/${circleId}/transactions/${transactionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update transaction');
      }

      // Redirect to transactions page
      router.push(`/dashboard/circles/${circleId}/transactions`);
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

  if (!circle || !transaction) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Transaction not found</p>
      </div>
    );
  }

  const totalAmount = parseFloat(amount) || 0;
  const totalSplit = splits.reduce((sum, split) => {
    if (splitType === 'PERCENTAGE') {
      return sum + (split.percentage || 0);
    } else if (splitType === 'CUSTOM') {
      return sum + (split.amount || 0);
    }
    return sum;
  }, 0);

  const isValid = splitType === 'EQUAL' || 
    (splitType === 'PERCENTAGE' && Math.abs(totalSplit - 100) < 0.01) ||
    (splitType === 'CUSTOM' && Math.abs(totalSplit - totalAmount) < 0.01);

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
          <h1 className="text-2xl font-bold">Edit Transaction</h1>
          <p className="text-muted-foreground">{circle.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>Update the basic information for this transaction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Transaction name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Amount *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date *</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <Input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Food, Transportation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
          </CardContent>
        </Card>

        {/* Split Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Split Configuration</CardTitle>
            <CardDescription>Choose how to split this transaction among circle members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={splitType === 'EQUAL' ? 'default' : 'outline'}
                onClick={() => handleSplitTypeChange('EQUAL')}
                className="cursor-pointer"
              >
                Equal Split
              </Button>
              <Button
                type="button"
                variant={splitType === 'PERCENTAGE' ? 'default' : 'outline'}
                onClick={() => handleSplitTypeChange('PERCENTAGE')}
                className="cursor-pointer"
              >
                Percentage
              </Button>
              <Button
                type="button"
                variant={splitType === 'CUSTOM' ? 'default' : 'outline'}
                onClick={() => handleSplitTypeChange('CUSTOM')}
                className="cursor-pointer"
              >
                Custom Amounts
              </Button>
            </div>

            {splitType !== 'EQUAL' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Split among {circle.members.length} members</span>
                  <span className={`font-medium ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {splitType === 'PERCENTAGE' ? `${totalSplit.toFixed(1)}%` : `$${totalSplit.toFixed(2)}`}
                  </span>
                </div>

                <div className="space-y-2">
                  {circle.members.map((member) => {
                    const split = splits.find(s => s.userId === member.user.id);
                    return (
                      <div key={member.user.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.user.avatar} />
                          <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{member.user.name}</p>
                          <p className="text-xs text-muted-foreground">{member.role}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {splitType === 'PERCENTAGE' ? (
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={split?.percentage || 0}
                              onChange={(e) => updateSplit(member.user.id, 'percentage', parseFloat(e.target.value) || 0)}
                              className="w-20"
                            />
                          ) : (
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={split?.amount || 0}
                              onChange={(e) => updateSplit(member.user.id, 'amount', parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          )}
                          <span className="text-sm text-muted-foreground">
                            {splitType === 'PERCENTAGE' ? '%' : '$'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!isValid && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                    {splitType === 'PERCENTAGE' 
                      ? `Percentages must add up to 100% (currently ${totalSplit.toFixed(1)}%)`
                      : `Amounts must add up to $${totalAmount.toFixed(2)} (currently $${totalSplit.toFixed(2)})`
                    }
                  </div>
                )}
              </div>
            )}

            {splitType === 'EQUAL' && (
              <div className="text-sm text-muted-foreground">
                This transaction will be split equally among all {circle.members.length} members.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={saving || !isValid}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="cursor-pointer"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
