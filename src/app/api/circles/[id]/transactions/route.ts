import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureUser } from '@/lib/auth';
import { z } from 'zod';

interface SplitData {
  transactionId: string;
  userId: string;
  amount: number;
  percentage?: number;
}

const createTransactionSchema = z.object({
  name: z.string().min(1, 'Transaction name is required').max(100, 'Transaction name must be less than 100 characters'),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().datetime('Invalid date format'),
  category: z.string().optional(),
  description: z.string().optional(),
  splitType: z.enum(['EQUAL', 'PERCENTAGE', 'CUSTOM']).default('EQUAL'),
  splits: z.array(z.object({
    userId: z.string(),
    amount: z.number().optional(),
    percentage: z.number().optional(),
  })).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await ensureUser();
    const { id } = await params;

    // Check if user is a member of the circle
    const circleMember = await prisma.circleMember.findUnique({
      where: {
        circleId_userId: {
          circleId: id,
          userId,
        },
      },
    });

    if (!circleMember) {
      return NextResponse.json({ error: 'Not a member of this circle' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createTransactionSchema.parse(body);

    // Get circle members for splitting
    const circleMembers = await prisma.circleMember.findMany({
      where: { circleId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create transaction with splits
    const transaction = await prisma.$transaction(async (tx) => {
      // Create the transaction
      const newTransaction = await tx.transaction.create({
        data: {
          circleId: id,
          createdById: userId,
          name: validatedData.name,
          amount: validatedData.amount,
          date: new Date(validatedData.date),
          category: validatedData.category,
          description: validatedData.description,
          splitType: validatedData.splitType,
        },
      });

      // Create splits based on split type
      let splits: SplitData[] = [];

      if (validatedData.splitType === 'EQUAL') {
        // Split equally among all members
        const amountPerPerson = validatedData.amount / circleMembers.length;
        splits = circleMembers.map(member => ({
          transactionId: newTransaction.id,
          userId: member.user.id,
          amount: amountPerPerson,
        }));
      } else if (validatedData.splitType === 'PERCENTAGE') {
        // Use provided percentages
        if (!validatedData.splits) {
          throw new Error('Splits are required for percentage split type');
        }
        splits = validatedData.splits.map(split => ({
          transactionId: newTransaction.id,
          userId: split.userId,
          percentage: split.percentage,
          amount: (validatedData.amount * (split.percentage || 0)) / 100,
        }));
      } else if (validatedData.splitType === 'CUSTOM') {
        // Use provided custom amounts
        if (!validatedData.splits) {
          throw new Error('Splits are required for custom split type');
        }
        splits = validatedData.splits.map(split => ({
          transactionId: newTransaction.id,
          userId: split.userId,
          amount: split.amount || 0,
        }));
      }

      // Create all splits
      if (splits.length > 0) {
        await tx.transactionSplit.createMany({
          data: splits,
        });
      }

      return newTransaction;
    });

    // Fetch the created transaction with splits
    const transactionWithSplits = await prisma.transaction.findUnique({
      where: { id: transaction.id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        splits: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(transactionWithSplits, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.flatten().fieldErrors }, { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await ensureUser();
    const { id } = await params;

    // Check if user is a member of the circle
    const circleMember = await prisma.circleMember.findUnique({
      where: {
        circleId_userId: {
          circleId: id,
          userId,
        },
      },
    });

    if (!circleMember) {
      return NextResponse.json({ error: 'Not a member of this circle' }, { status: 403 });
    }

    // Get URL parameters for filtering
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const transactions = await prisma.transaction.findMany({
      where: {
        circleId: id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        splits: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await prisma.transaction.count({
      where: {
        circleId: id,
      },
    });

    return NextResponse.json({
      transactions,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
