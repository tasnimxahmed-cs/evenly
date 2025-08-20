'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  X, 
  Download, 
  Check, 
  DollarSign, 
  Calendar, 
  Building2,
  Users,
  Plus
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  category?: string[];
  pending: boolean;
  bankAccountId: string;
  institutionName: string;
  // Additional Plaid fields for transaction type
  transaction_type?: string;
  payment_channel?: string;
  merchant_name?: string;
  check_number?: string;
}

interface Circle {
  id: string;
  name: string;
  color?: string;
}

interface TransactionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (transactions: PlaidTransaction[], circleId: string) => void;
}

export function TransactionImportModal({ isOpen, onClose, onImport }: TransactionImportModalProps) {
  const [transactions, setTransactions] = useState<PlaidTransaction[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [selectedCircle, setSelectedCircle] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Reset selections when opening
      setSelectedTransactions(new Set());
      setSearchTerm('');
      fetchTransactions();
      fetchCircles();
    } else {
      // Reset state when closing
      setSelectedTransactions(new Set());
      setSearchTerm('');
      setSelectedCircle('');
    }
  }, [isOpen]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/plaid/transactions');
      if (response.ok) {
        const data = await response.json();
        // Remove duplicates based on transaction_id
        const uniqueTransactions = (data.transactions || []).filter(
          (transaction: PlaidTransaction, index: number, self: PlaidTransaction[]) =>
            index === self.findIndex(t => t.transaction_id === transaction.transaction_id)
        );
        setTransactions(uniqueTransactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCircles = async () => {
    try {
      const response = await fetch('/api/circles');
      if (response.ok) {
        const data = await response.json();
        // The API returns the circles directly, not wrapped in a 'circles' property
        const circlesData = Array.isArray(data) ? data : (data.circles || []);
        setCircles(circlesData);
        if (circlesData.length > 0) {
          setSelectedCircle(circlesData[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching circles:', error);
    }
  };

  const handleSelectTransaction = (transactionId: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId);
    } else {
      newSelected.add(transactionId);
    }
    setSelectedTransactions(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTransactions.size === filteredTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(filteredTransactions.map(t => t.transaction_id)));
    }
  };

  const handleImport = async () => {
    if (selectedTransactions.size === 0 || !selectedCircle) return;

    setImporting(true);
    try {
      const selectedTransactionObjects = transactions.filter(t => 
        selectedTransactions.has(t.transaction_id)
      );
      
      await onImport(selectedTransactionObjects, selectedCircle);
      onClose();
    } catch (error) {
      console.error('Error importing transactions:', error);
    } finally {
      setImporting(false);
    }
  };

  // Helper function to determine if transaction is an expense (money going out)
  const isExpense = (transaction: PlaidTransaction): boolean => {
    // Default to expense (red) if we can't determine
    if (!transaction.amount) return true;
    
    // Flipped logic: positive amounts are expenses (money going OUT)
    // Negative amounts are income/refunds (money coming IN)
    const isExpenseTransaction = transaction.amount > 0;
    
    // Debug logging for first few transactions to understand the data
    if (transactions.indexOf(transaction) < 3) {
      console.log('Transaction debug:', {
        name: transaction.name,
        amount: transaction.amount,
        isExpense: isExpenseTransaction,
        transaction_type: transaction.transaction_type,
        payment_channel: transaction.payment_channel
      });
    }
    
    return isExpenseTransaction;
  };

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter(transaction =>
    transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.institutionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (transaction.category && transaction.category.some(cat => 
      cat.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-background rounded-lg border shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Import Transactions</h2>
            <p className="text-sm text-muted-foreground">
              Select transactions to import into your circles
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(90vh-120px)]">
          {/* Controls */}
          <div className="p-6 border-b space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                onClick={handleSelectAll}
                className="cursor-pointer"
              >
                {selectedTransactions.size === filteredTransactions.length && filteredTransactions.length > 0 ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Import to:</span>
                <select
                  value={selectedCircle}
                  onChange={(e) => setSelectedCircle(e.target.value)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  {circles.map(circle => (
                    <option key={circle.id} value={circle.id}>
                      {circle.name}
                    </option>
                  ))}
                </select>
              </div>
              <Badge variant="secondary">
                {selectedTransactions.size} selected
              </Badge>
            </div>
          </div>

          {/* Transactions List */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <Download className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {transactions.length === 0 ? 'No transactions found' : 'No transactions match your search'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => (
                  <Card key={transaction.transaction_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedTransactions.has(transaction.transaction_id)}
                          onChange={() => handleSelectTransaction(transaction.transaction_id)}
                          className="h-4 w-4"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{transaction.name}</h3>
                            {transaction.pending && (
                              <Badge variant="outline" className="text-xs">Pending</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(transaction.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {transaction.institutionName}
                            </span>
                            {transaction.category && (
                              <span>{transaction.category.join(', ')}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${isExpense(transaction) ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(Math.abs(transaction.amount))}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedTransactions.size} transaction{selectedTransactions.size !== 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={selectedTransactions.size === 0 || !selectedCircle || importing}
                  className="cursor-pointer"
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Import Selected
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
