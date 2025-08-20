import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin of the circle
    const circle = await prisma.circle.findFirst({
      where: {
        id,
        members: {
          some: {
            userId,
            role: 'ADMIN',
          },
        },
        isActive: true,
      },
    });

    if (!circle) {
      return NextResponse.json({ error: 'Circle not found or access denied' }, { status: 404 });
    }

    // Generate a unique invite token
    const inviteToken = crypto.randomUUID();
    
    // Store the invite token (you might want to create a separate table for this)
    // For now, we'll just return a link with the token
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/join-circle?token=${inviteToken}&circleId=${id}`;

    // TODO: Store the invite token in the database with expiration
    // This would typically be stored in a separate InviteToken table

    return NextResponse.json({ 
      inviteLink,
      token: inviteToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    });
  } catch (error) {
    console.error('Error generating invite link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
