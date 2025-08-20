import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureUser } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await ensureUser();
    const { id } = await params;

    // Check if the bank account belongs to the user
    const bankAccount = await prisma.bankAccount.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!bankAccount) {
      return NextResponse.json({ error: 'Bank account not found' }, { status: 404 });
    }

    // Delete the bank account
    await prisma.bankAccount.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Bank account disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting bank account:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
