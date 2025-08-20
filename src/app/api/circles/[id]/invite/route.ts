import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
});

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

    const body = await request.json();
    const validatedData = inviteSchema.parse(body);

    // Check if user already exists
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    // If user doesn't exist, create them (this would typically be handled by Clerk)
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found. They need to sign up for Evenly first.' 
      }, { status: 400 });
    }

    // Check if user is already a member
    const existingMember = await prisma.circleMember.findUnique({
      where: {
        circleId_userId: {
          circleId: id,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this circle' }, { status: 400 });
    }

    // Add user to circle
    await prisma.circleMember.create({
      data: {
        circleId: id,
        userId: user.id,
        role: 'MEMBER',
      },
    });

    // TODO: Send email invitation (this would integrate with an email service)
    // For now, we'll just return success

    return NextResponse.json({ 
      message: 'User invited successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    });
  } catch (error) {
    console.error('Error inviting user:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
