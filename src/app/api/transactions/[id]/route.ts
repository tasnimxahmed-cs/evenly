import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureUser } from '@/lib/auth';
import { z } from 'zod';

const updateTransactionSchema = z.object({
  name: z.string().min(1, 'Transaction name is required').max(100, 'Transaction name must be less than 100 characters'),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().min(1, 'Date is required'),
  category: z.string().optional(),
  description: z.string().optional(),
  splitType: z.enum(['EQUAL', 'PERCENTAGE', 'CUSTOM']).default('EQUAL'),
  splits: z.array(z.object({
    userId: z.string(),
    amount: z.number().optional(),
    percentage: z.number().optional(),
  })).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await ensureUser();
    const { id } = await params;

    // Fetch transaction with circle membership check
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        circle: {
          members: {
            some: {
              userId,
            },
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
            email: true,
            avatar: true,
          },
        },
        splits: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await ensureUser();
    const { id } = await params;

    // Check if user is a member of the circle that contains this transaction
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        circle: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
      include: {
        circle: {
          include: {
            members: {
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
        },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateTransactionSchema.parse(body);

    // Update transaction with splits
    const updatedTransaction = await prisma.$transaction(async (tx) => {
      // Update the transaction
      const updated = await tx.transaction.update({
        where: { id },
        data: {
          name: validatedData.name,
          amount: validatedData.amount,
          date: new Date(validatedData.date + 'T00:00:00Z'),
          category: validatedData.category,
          description: validatedData.description,
          splitType: validatedData.splitType,
        },
      });

      // Delete existing splits
      await tx.transactionSplit.deleteMany({
        where: { transactionId: id },
      });

      // Create new splits based on split type
      if (validatedData.splitType === 'EQUAL') {
        // Split equally among all members
        const amountPerPerson = validatedData.amount / transaction.circle.members.length;
        const splits = transaction.circle.members.map(member => ({
          transactionId: id,
          userId: member.user.id,
          amount: amountPerPerson,
          isPaid: false,
        }));
        await tx.transactionSplit.createMany({ data: splits });
      } else if (validatedData.splitType === 'PERCENTAGE' || validatedData.splitType === 'CUSTOM') {
        // Use provided splits
        if (!validatedData.splits) {
          throw new Error('Splits are required for percentage or custom split types');
        }
        
        const splits = validatedData.splits.map(split => ({
          transactionId: id,
          userId: split.userId,
          amount: split.amount || 0,
          percentage: split.percentage,
          isPaid: false,
        }));
        await tx.transactionSplit.createMany({ data: splits });
      }

      return updated;
    });

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (error instanceof Error && error.message.includes('Splits are required')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
