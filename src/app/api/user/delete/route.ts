import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureUser } from '@/lib/auth';

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await ensureUser();

    // Delete all user data in a transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // Delete transaction splits
      await tx.transactionSplit.deleteMany({
        where: { userId },
      });

      // Delete transactions created by user
      await tx.transaction.deleteMany({
        where: { createdById: userId },
      });

      // Delete circle memberships
      await tx.circleMember.deleteMany({
        where: { userId },
      });

      // Delete circles where user is the only member (orphaned circles)
      const userCircles = await tx.circle.findMany({
        where: {
          members: {
            some: { userId },
          },
        },
        include: {
          members: true,
        },
      });

      for (const circle of userCircles) {
        if (circle.members.length === 1) {
          // User is the only member, delete the circle
          await tx.circle.delete({
            where: { id: circle.id },
          });
        }
      }

      // Delete friend requests
      await tx.friendRequest.deleteMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId },
          ],
        },
      });

      // Delete friendships
      await tx.friendship.deleteMany({
        where: {
          OR: [
            { userId },
            { friendId: userId },
          ],
        },
      });

      // Delete bank accounts
      await tx.bankAccount.deleteMany({
        where: { userId },
      });

      // Finally, delete the user
      await tx.user.delete({
        where: { id: userId },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user account:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
