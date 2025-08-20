import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await ensureUser();

    // Fetch user's circles and transactions for stats
    const [circles, transactions] = await Promise.all([
      prisma.circle.findMany({
        where: {
          members: {
            some: { userId },
          },
          isActive: true,
        },
        include: {
          _count: {
            select: { transactions: true },
          },
        },
        take: 5,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.transaction.findMany({
        where: {
          circle: {
            members: {
              some: { userId },
            },
          },
        },
        include: {
          circle: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          splits: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalCircles = circles.length;
    const totalTransactions = circles.reduce((sum, circle) => sum + circle._count.transactions, 0);

    // Calculate total balance based on user's splits
    const totalBalance = transactions.reduce((balance, transaction) => {
      const userSplit = transaction.splits.find(split => split.user.id === userId);
      if (userSplit) {
        // If user owes money (negative amount), add to balance
        // If user is owed money (positive amount), subtract from balance
        return balance + Number(userSplit.amount);
      }
      return balance;
    }, 0);

    return NextResponse.json({
      circles,
      transactions,
      totalCircles,
      totalTransactions,
      totalBalance,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
