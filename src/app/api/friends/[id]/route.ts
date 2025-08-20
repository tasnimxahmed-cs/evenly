import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureUser } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await ensureUser();

    // Check if friendship exists
    const friendship = await prisma.friendship.findUnique({
      where: {
        userId_friendId: {
          userId,
          friendId: params.id,
        },
      },
    });

    if (!friendship) {
      return NextResponse.json({ error: 'Friendship not found' }, { status: 404 });
    }

    // Remove the friendship (both directions)
    await prisma.$transaction([
      prisma.friendship.delete({
        where: {
          userId_friendId: {
            userId,
            friendId: params.id,
          },
        },
      }),
      prisma.friendship.delete({
        where: {
          userId_friendId: {
            userId: params.id,
            friendId: userId,
          },
        },
      }),
    ]);

    return NextResponse.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Error removing friend:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
