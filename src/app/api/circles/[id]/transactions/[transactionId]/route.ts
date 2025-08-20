import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureUser } from '@/lib/auth';
import { z } from 'zod';

const updateTransactionSchema = z.object({
  name: z.string().min(1, 'Transaction name is required').max(100, 'Transaction name must be less than 100 characters').optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  date: z.string().datetime('Invalid date format').optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  splitType: z.enum(['EQUAL', 'PERCENTAGE', 'CUSTOM']).optional(),
  splits: z.array(z.object({
    userId: z.string(),
    amount: z.number().optional(),
    percentage: z.number().optional(),
  })).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; transactionId: string }> }
) {
  try {
    const { userId } = await ensureUser();
    const { id, transactionId } = await params;

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

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
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
  { params }: { params: Promise<{ id: string; transactionId: string }> }
) {
  try {
    const { userId } = await ensureUser();
    const { id, transactionId } = await params;

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

    // Check if transaction exists and user is the creator or admin
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        circleId: id,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Only creator or admin can edit
    if (transaction.createdById !== userId && circleMember.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized to edit this transaction' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateTransactionSchema.parse(body);

    // Update transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.amount && { amount: validatedData.amount }),
        ...(validatedData.date && { date: new Date(validatedData.date) }),
        ...(validatedData.category !== undefined && { category: validatedData.category }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.splitType && { splitType: validatedData.splitType }),
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
    });

    // If splits are provided, update them
    if (validatedData.splits) {
      // Delete existing splits
      await prisma.transactionSplit.deleteMany({
        where: { transactionId },
      });

      // Create new splits based on split type
      let splits: any[] = [];

      if (validatedData.splitType === 'EQUAL') {
        // Split equally among all members
        const circleMembers = await prisma.circleMember.findMany({
          where: { circleId: id },
          include: { user: true },
        });
        const amountPerPerson = validatedData.amount / circleMembers.length;
        splits = circleMembers.map(member => ({
          transactionId,
          userId: member.user.id,
          amount: amountPerPerson,
        }));
      } else if (validatedData.splitType === 'PERCENTAGE') {
        // Use provided percentages
        splits = validatedData.splits.map(split => ({
          transactionId,
          userId: split.userId,
          percentage: split.percentage,
          amount: (validatedData.amount * (split.percentage || 0)) / 100,
        }));
      } else if (validatedData.splitType === 'CUSTOM') {
        // Use provided custom amounts
        splits = validatedData.splits.map(split => ({
          transactionId,
          userId: split.userId,
          amount: split.amount || 0,
        }));
      }

      if (splits.length > 0) {
        await prisma.transactionSplit.createMany({
          data: splits,
        });
      }

      // Fetch updated transaction with new splits
      const transactionWithSplits = await prisma.transaction.findUnique({
        where: { id: transactionId },
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

      return NextResponse.json(transactionWithSplits);
    }

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.flatten().fieldErrors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; transactionId: string }> }
) {
  try {
    const { userId } = await ensureUser();
    const { id, transactionId } = await params;

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

    // Check if transaction exists
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        circleId: id,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Only creator or admin can delete
    if (transaction.createdById !== userId && circleMember.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized to delete this transaction' }, { status: 403 });
    }

    // Delete transaction (splits will be deleted automatically due to cascade)
    await prisma.transaction.delete({
      where: { id: transactionId },
    });

    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
