import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await ensureUser();

    // Get all circles where the user is a member
    const userCircles = await prisma.circleMember.findMany({
      where: { userId },
      select: { circleId: true },
    });

    const circleIds = userCircles.map(member => member.circleId);

    if (circleIds.length === 0) {
      return NextResponse.json({ transactions: [] });
    }

    // Get all transactions from circles where the user is a member
    const transactions = await prisma.transaction.findMany({
      where: {
        circleId: {
          in: circleIds,
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
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
