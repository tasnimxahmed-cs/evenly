'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  CreditCard
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Circle {
  id: string;
  name: string;
  description?: string;
  color?: string;
  members: {
    user: User;
    role: 'ADMIN' | 'MEMBER';
  }[];
}

type SplitType = 'EQUAL' | 'PERCENTAGE' | 'CUSTOM';

interface Split {
  userId: string;
  amount?: number;
  percentage?: number;
}

function NewTransactionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedCircleId = searchParams.get('circleId');

  const [circles, setCircles] = useState<Circle[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('EQUAL');
  const [splits, setSplits] = useState<Split[]>([]);

  useEffect(() => {
    fetchCircles();
  }, []);

  useEffect(() => {
    if (preSelectedCircleId && circles.length > 0) {
      const circle = circles.find(c => c.id === preSelectedCircleId);
      if (circle) {
        setSelectedCircle(circle);
        initializeSplits(circle);
      }
    }
  }, [preSelectedCircleId, circles]);

  const fetchCircles = async () => {
    try {
      const response = await fetch('/api/circles');
      if (response.ok) {
        const data = await response.json();
        setCircles(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching circles:', error);
      setError('Failed to load circles');
    } finally {
      setLoading(false);
    }
  };

  const initializeSplits = (circle: Circle) => {
    if (circle.members) {
      setSplits(circle.members.map(member => ({
        userId: member.user.id,
      })));
    }
  };

  const handleCircleChange = (circleId: string) => {
    const circle = circles.find(c => c.id === circleId);
    setSelectedCircle(circle || null);
    if (circle) {
      initializeSplits(circle);
    } else {
      setSplits([]);
    }
  };

  const handleSplitTypeChange = (newSplitType: SplitType) => {
    setSplitType(newSplitType);
    
    if (!selectedCircle) return;
    
    if (newSplitType === 'EQUAL') {
      // Reset to equal splits
      setSplits(selectedCircle.members.map(member => ({
        userId: member.user.id,
      })));
    } else if (newSplitType === 'PERCENTAGE') {
      // Initialize with equal percentages
      const equalPercentage = 100 / (selectedCircle.members.length || 1);
      setSplits(selectedCircle.members.map(member => ({
        userId: member.user.id,
        percentage: equalPercentage,
      })));
    } else if (newSplitType === 'CUSTOM') {
      // Initialize with equal amounts
      const equalAmount = parseFloat(amount) / (selectedCircle.members.length || 1);
      setSplits(selectedCircle.members.map(member => ({
        userId: member.user.id,
        amount: equalAmount,
      })));
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
    
    if (!name.trim() || !amount || parseFloat(amount) <= 0 || !selectedCircle) {
      setError('Please fill in all required fields and select a circle');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const transactionData = {
        name: name.trim(),
        amount: parseFloat(amount),
        date: date, // Send as YYYY-MM-DD string
        category: category.trim() || undefined,
        description: description.trim() || undefined,
        splitType,
        splits: splitType !== 'EQUAL' ? splits : undefined,
      };

      const response = await fetch(`/api/circles/${selectedCircle.id}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create transaction');
      }

      // Redirect to transactions page
      router.push('/dashboard/transactions');
    } catch (error) {
      console.error('Error creating transaction:', error);
      setError(error instanceof Error ? error.message : 'Failed to create transaction');
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
          <h1 className="text-3xl font-bold">New Transaction</h1>
          <p className="text-muted-foreground">Add a new expense to a circle</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Circle Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Circle</CardTitle>
            <CardDescription>Choose which circle to add this transaction to</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Circle *</label>
              <select
                value={selectedCircle?.id || ''}
                onChange={(e) => handleCircleChange(e.target.value)}
                className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select a circle...</option>
                {circles.map((circle) => (
                  <option key={circle.id} value={circle.id}>
                    {circle.name} ({circle.members.length} members)
                  </option>
                ))}
              </select>
            </div>
            
            {selectedCircle && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: selectedCircle.color || "#6366f1" }}
                  >
                    {selectedCircle.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{selectedCircle.name}</p>
                    {selectedCircle.description && (
                      <p className="text-sm text-muted-foreground">{selectedCircle.description}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {selectedCircle.members.length} member{selectedCircle.members.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Basic Transaction Info */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>Enter the basic information for this transaction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
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
                <label className="block text-sm font-medium mb-2">Amount *</label>
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
                <label className="block text-sm font-medium mb-2">Date</label>
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
              <label className="block text-sm font-medium mb-2">Category (optional)</label>
              <Input
                type="text"
                placeholder="e.g., Food, Transportation, Entertainment"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Description (optional)</label>
              <Input
                type="text"
                placeholder="Additional details about this transaction"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Split Configuration - Only show if circle is selected */}
        {selectedCircle && (
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
                <h4 className="font-medium">Members ({selectedCircle.members.length})</h4>
                {selectedCircle.members.map((member) => {
                  const split = splits.find(s => s.userId === member.user.id);
                  const splitAmount = splitType === 'EQUAL' 
                    ? totalAmount / selectedCircle.members.length
                    : splitType === 'PERCENTAGE'
                    ? (totalAmount * (split?.percentage || 0)) / 100
                    : split?.amount || 0;

                  return (
                    <div key={member.user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.user.avatar} />
                          <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.user.name}</p>
                          <p className="text-sm text-muted-foreground">{member.user.email}</p>
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
                              value={split?.percentage || 0}
                              onChange={(e) => updateSplit(member.user.id, 'percentage', parseFloat(e.target.value) || 0)}
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
                              value={split?.amount || 0}
                              onChange={(e) => updateSplit(member.user.id, 'amount', parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          </div>
                        )}
                        
                        <div className="text-right">
                          <p className="font-medium">${(splitAmount || 0).toFixed(2)}</p>
                          {splitType === 'PERCENTAGE' && (
                            <p className="text-xs text-muted-foreground">{split?.percentage || 0}%</p>
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
                      `Total: ${totalSplit.toFixed(1)}% ${isValid ? '(Valid)' : '(Must equal 100%)'}`
                    )}
                    {splitType === 'CUSTOM' && (
                      `Total: $${totalSplit.toFixed(2)} ${isValid ? '(Valid)' : `(Must equal $${totalAmount.toFixed(2)})`}`
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
            disabled={saving || !isValid || !name.trim() || !amount || !selectedCircle}
            className="flex items-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                Create Transaction
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewTransactionPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <NewTransactionPageContent />
    </Suspense>
  );
}
