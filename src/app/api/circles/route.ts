import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureUser } from '@/lib/auth';
import { z } from 'zod';

const createCircleSchema = z.object({
  name: z.string().min(1, 'Circle name is required').max(100, 'Circle name must be less than 100 characters'),
  description: z.string().optional(),
  color: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await ensureUser();

    const body = await request.json();
    const validatedData = createCircleSchema.parse(body);

    // Create the circle and add the creator as an admin member
    const circle = await prisma.circle.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        color: validatedData.color,
        members: {
          create: {
            userId,
            role: 'ADMIN',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(circle, { status: 201 });
  } catch (error) {
    console.error('Error creating circle:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.flatten().fieldErrors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await ensureUser();

    const circles = await prisma.circle.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
        isActive: true,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(circles);
  } catch (error) {
    console.error('Error fetching circles:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
