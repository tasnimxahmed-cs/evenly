import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureUser } from '@/lib/auth';
import { z } from 'zod';

const updateCircleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await ensureUser();
    const { id } = await params;

    const circle = await prisma.circle.findFirst({
      where: {
        id,
        members: {
          some: {
            userId,
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
        transactions: {
          include: {
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
            createdAt: 'desc',
          },
          take: 5,
        },
      },
    });

    if (!circle) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    return NextResponse.json(circle);
  } catch (error) {
    console.error('Error fetching circle:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await ensureUser();
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateCircleSchema.parse(body);

    // Check if user is an admin of the circle
    const circleMember = await prisma.circleMember.findFirst({
      where: {
        circleId: id,
        userId,
        role: 'ADMIN',
      },
    });

    if (!circleMember) {
      return NextResponse.json({ error: 'Only admins can update circle settings' }, { status: 403 });
    }

            const updatedCircle = await prisma.circle.update({
          where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        color: validatedData.color,
      },
    });

    return NextResponse.json(updatedCircle);
  } catch (error) {
    console.error('Error updating circle:', error);

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

    // Check if user is an admin of the circle
    const circleMember = await prisma.circleMember.findFirst({
      where: {
        circleId: id,
        userId,
        role: 'ADMIN',
      },
    });

    if (!circleMember) {
      return NextResponse.json({ error: 'Only admins can delete circles' }, { status: 403 });
    }

            // Delete the circle and all related data (transactions, splits, members)
        await prisma.circle.delete({
          where: { id },
        });

    return NextResponse.json({ message: 'Circle deleted successfully' });
  } catch (error) {
    console.error('Error deleting circle:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
