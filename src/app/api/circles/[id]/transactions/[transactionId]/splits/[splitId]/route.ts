import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureUser } from '@/lib/auth';
import { z } from 'zod';

const updateSplitSchema = z.object({
  isPaid: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; transactionId: string; splitId: string }> }
) {
  try {
    const { userId } = await ensureUser();
    const { id, transactionId, splitId } = await params;

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

    // Check if split exists and belongs to the transaction
    const split = await prisma.transactionSplit.findFirst({
      where: {
        id: splitId,
        transactionId: transactionId,
        transaction: {
          circleId: id,
        },
      },
      include: {
        transaction: {
          select: {
            id: true,
            circleId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!split) {
      return NextResponse.json({ error: 'Split not found' }, { status: 404 });
    }

    // Only the user who owes money or admin can mark as paid
    if (split.userId !== userId && circleMember.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized to update this split' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateSplitSchema.parse(body);

    // Update the split and check if all splits are paid
    const result = await prisma.$transaction(async (tx) => {
      // Update the split
      const updatedSplit = await tx.transactionSplit.update({
        where: { id: splitId },
        data: {
          isPaid: validatedData.isPaid,
          paidAt: validatedData.isPaid ? new Date() : null,
        },
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

      // Check if all splits for this transaction are now paid
      const allSplits = await tx.transactionSplit.findMany({
        where: { transactionId },
      });

      const allPaid = allSplits.every(split => split.isPaid);

      // Update the transaction's isSettled status
      await tx.transaction.update({
        where: { id: transactionId },
        data: { isSettled: allPaid },
      });

      return updatedSplit;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating split:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.flatten().fieldErrors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
