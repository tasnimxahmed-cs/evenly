import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureUser } from '@/lib/auth';
import { z } from 'zod';

const sendFriendRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await ensureUser();

    // Get user's friends
    const friendships = await prisma.friendship.findMany({
      where: {
        userId,
      },
      include: {
        friend: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get pending friend requests sent by user
    const sentRequests = await prisma.friendRequest.findMany({
      where: {
        senderId: userId,
        status: 'PENDING',
      },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get pending friend requests received by user
    const receivedRequests = await prisma.friendRequest.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      friends: friendships.map(f => f.friend),
      sentRequests: sentRequests.map(r => ({
        id: r.id,
        user: r.receiver,
        createdAt: r.createdAt,
      })),
      receivedRequests: receivedRequests.map(r => ({
        id: r.id,
        user: r.sender,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching friends:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await ensureUser();

    const body = await request.json();
    const validatedData = sendFriendRequestSchema.parse(body);

    // Find the user by email
    const targetUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.id === userId) {
      return NextResponse.json({ error: 'Cannot send friend request to yourself' }, { status: 400 });
    }

    // Check if friendship already exists
    const existingFriendship = await prisma.friendship.findUnique({
      where: {
        userId_friendId: {
          userId,
          friendId: targetUser.id,
        },
      },
    });

    if (existingFriendship) {
      return NextResponse.json({ error: 'Already friends with this user' }, { status: 400 });
    }

    // Check if friend request already exists
    const existingRequest = await prisma.friendRequest.findUnique({
      where: {
        senderId_receiverId: {
          senderId: userId,
          receiverId: targetUser.id,
        },
      },
    });

    if (existingRequest) {
      return NextResponse.json({ error: 'Friend request already sent' }, { status: 400 });
    }

    // Create friend request
    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId: userId,
        receiverId: targetUser.id,
      },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Friend request sent successfully',
      request: {
        id: friendRequest.id,
        user: friendRequest.receiver,
        createdAt: friendRequest.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error sending friend request:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.flatten().fieldErrors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
