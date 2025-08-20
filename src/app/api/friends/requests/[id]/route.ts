import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureUser } from '@/lib/auth';
import { z } from 'zod';

const updateRequestSchema = z.object({
  action: z.enum(['accept', 'reject']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await ensureUser();
    const { id } = await params;

    const body = await request.json();
    const validatedData = updateRequestSchema.parse(body);

    // Find the friend request
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id },
    });

    if (!friendRequest) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
    }

    // Check if the current user is the receiver of the request
    if (friendRequest.receiverId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (validatedData.action === 'accept') {
      // Accept the friend request
      await prisma.$transaction([
        // Update the friend request status
        prisma.friendRequest.update({
          where: { id },
          data: { status: 'ACCEPTED' },
        }),
        // Create friendship records (bidirectional)
        prisma.friendship.create({
          data: {
            userId: friendRequest.senderId,
            friendId: friendRequest.receiverId,
          },
        }),
        prisma.friendship.create({
          data: {
            userId: friendRequest.receiverId,
            friendId: friendRequest.senderId,
          },
        }),
      ]);

      return NextResponse.json({ message: 'Friend request accepted' });
    } else {
      // Reject the friend request
      await prisma.friendRequest.update({
        where: { id },
        data: { status: 'REJECTED' },
      });

      return NextResponse.json({ message: 'Friend request rejected' });
    }
  } catch (error) {
    console.error('Error updating friend request:', error);
    
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await ensureUser();
    const { id } = await params;

    // Find the friend request
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id },
    });

    if (!friendRequest) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
    }

    // Check if the current user is the sender of the request
    if (friendRequest.senderId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the friend request
    await prisma.friendRequest.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Friend request cancelled' });
  } catch (error) {
    console.error('Error cancelling friend request:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
