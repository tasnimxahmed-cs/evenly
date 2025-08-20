import { NextRequest, NextResponse } from 'next/server';
import { ensureUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getTransactions } from '@/lib/plaid';

interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  category?: string[];
  pending: boolean;
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await ensureUser();

    // Get user's connected bank accounts
    const bankAccounts = await prisma.bankAccount.findMany({
      where: { userId },
      select: {
        id: true,
        plaidAccountId: true,
        plaidAccessToken: true,
        institution: true,
        accountName: true,
      },
    });

    if (bankAccounts.length === 0) {
      return NextResponse.json({ transactions: [] });
    }

    // Get transactions from the last 30 days
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const allTransactions: PlaidTransaction[] = [];
    const seenTransactionIds = new Set<string>();

    // Fetch real transactions from Plaid
    for (const bankAccount of bankAccounts) {
      try {
        const transactions = await getTransactions(
          bankAccount.plaidAccessToken,
          startDate,
          endDate
        );

        // Add bank account info to each transaction and filter duplicates
        const enrichedTransactions = transactions
          .filter(transaction => {
            // Skip if we've already seen this transaction_id
            if (seenTransactionIds.has(transaction.transaction_id)) {
              return false;
            }
            seenTransactionIds.add(transaction.transaction_id);
            return true;
          })
          .map(transaction => ({
            ...transaction,
            bankAccountId: bankAccount.id,
            institutionName: bankAccount.institution,
          }));

        allTransactions.push(...enrichedTransactions);
      } catch (error) {
        console.error(`Error fetching transactions for account ${bankAccount.id}:`, error);
        // Continue with other accounts even if one fails
      }
    }

    return NextResponse.json({ transactions: allTransactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
