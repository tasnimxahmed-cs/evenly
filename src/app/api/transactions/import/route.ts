import { NextRequest, NextResponse } from 'next/server';
import { ensureUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const importTransactionsSchema = z.object({
  transactions: z.array(z.object({
    transaction_id: z.string(),
    account_id: z.string(),
    amount: z.number(),
    date: z.string(),
    name: z.string(),
    category: z.array(z.string()).nullable().optional(),
    pending: z.boolean(),
    bankAccountId: z.string(),
    institutionName: z.string(),
  })),
  circleId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await ensureUser();
    const body = await request.json();
    const validatedData = importTransactionsSchema.parse(body);

    // Check if user is a member of the circle
    const circleMember = await prisma.circleMember.findUnique({
      where: {
        circleId_userId: {
          circleId: validatedData.circleId,
          userId,
        },
      },
    });

    if (!circleMember) {
      return NextResponse.json({ error: 'Not a member of this circle' }, { status: 403 });
    }

    // Get circle members for splitting
    const circleMembers = await prisma.circleMember.findMany({
      where: { circleId: validatedData.circleId },
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

    const importedTransactions = [];

    // Import each transaction
    for (const plaidTransaction of validatedData.transactions) {
      try {
        // Create transaction with splits
        const transaction = await prisma.$transaction(async (tx) => {
          // Create the transaction
          const newTransaction = await tx.transaction.create({
            data: {
              circleId: validatedData.circleId,
              createdById: userId,
              name: plaidTransaction.name,
              amount: plaidTransaction.amount, // Preserve the original sign
              date: new Date(plaidTransaction.date),
              category: plaidTransaction.category?.join(', ') || null,
              description: `Imported from ${plaidTransaction.institutionName}`,
              splitType: 'EQUAL',
            },
          });

          // Split equally among all members
          const amountPerPerson = Math.abs(plaidTransaction.amount) / circleMembers.length;
          const splits = circleMembers.map(member => ({
            transactionId: newTransaction.id,
            userId: member.user.id,
            amount: amountPerPerson,
          }));

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

        importedTransactions.push(transactionWithSplits);
      } catch (error) {
        console.error(`Error importing transaction ${plaidTransaction.transaction_id}:`, error);
        // Continue with other transactions even if one fails
      }
    }

    return NextResponse.json({
      message: `Successfully imported ${importedTransactions.length} transactions`,
      importedTransactions,
    }, { status: 201 });
  } catch (error) {
    console.error('Error importing transactions:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.flatten().fieldErrors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
