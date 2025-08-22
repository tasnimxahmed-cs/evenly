import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureUser } from '@/lib/auth';
import { z } from 'zod';

const updatePhoneSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
});

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await ensureUser();
    const body = await request.json();
    const { phone } = updatePhoneSchema.parse(body);

    // Update phone number in our database
    await prisma.user.update({
      where: { id: userId },
      data: { phone },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating phone number:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Failed to update phone number' }, { status: 500 });
  }
}
