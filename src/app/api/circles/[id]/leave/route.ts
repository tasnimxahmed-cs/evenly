import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureUser } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await ensureUser();
    const { id } = await params;

    // Check if the user is a member of the circle
    const circleMember = await prisma.circleMember.findFirst({
      where: {
        circleId: id,
        userId,
      },
    });

    if (!circleMember) {
      return NextResponse.json({ error: 'You are not a member of this circle' }, { status: 404 });
    }

            // Prevent the last admin from leaving
        if (circleMember.role === 'ADMIN') {
          const adminCount = await prisma.circleMember.count({
            where: {
              circleId: id,
              role: 'ADMIN',
            },
          });

      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Cannot leave circle as the last admin. Please transfer admin role or delete the circle.' }, { status: 400 });
      }
    }

    // Remove the user from the circle
    await prisma.circleMember.delete({
      where: { id: circleMember.id },
    });

    return NextResponse.json({ message: 'Successfully left the circle' });
  } catch (error) {
    console.error('Error leaving circle:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
