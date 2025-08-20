import { NextRequest, NextResponse } from 'next/server';
import { ensureUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await ensureUser();

    const bankAccounts = await prisma.bankAccount.findMany({
      where: { userId },
      select: {
        id: true,
        institution: true,
        accountName: true,
        accountType: true,
        mask: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ bankAccounts });
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bank accounts' },
      { status: 500 }
    );
  }
}
