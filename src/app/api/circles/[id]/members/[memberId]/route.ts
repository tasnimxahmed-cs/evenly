import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureUser } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { userId } = await ensureUser();
    const { id, memberId } = await params;

    // Check if the current user is an admin of the circle
    const currentUserMember = await prisma.circleMember.findFirst({
      where: {
        circleId: id,
        userId,
        role: 'ADMIN',
      },
    });

    if (!currentUserMember) {
      return NextResponse.json({ error: 'Only admins can remove members' }, { status: 403 });
    }

            // Check if the member to be removed exists in the circle
        const memberToRemove = await prisma.circleMember.findFirst({
          where: {
            circleId: id,
            id: memberId,
          },
        });

    if (!memberToRemove) {
      return NextResponse.json({ error: 'Member not found in circle' }, { status: 404 });
    }

            // Prevent removing the last admin
        if (memberToRemove.role === 'ADMIN') {
          const adminCount = await prisma.circleMember.count({
            where: {
              circleId: id,
              role: 'ADMIN',
            },
          });

      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Cannot remove the last admin from the circle' }, { status: 400 });
      }
    }

            // Remove the member
        await prisma.circleMember.delete({
          where: { id: memberId },
        });

    return NextResponse.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
