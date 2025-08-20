import { NextRequest, NextResponse } from 'next/server';
import { ensureUser } from '@/lib/auth';
import { createLinkToken } from '@/lib/plaid';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await ensureUser();

    const linkToken = await createLinkToken(userId);

    return NextResponse.json({ linkToken });
  } catch (error) {
    console.error('Error creating link token:', error);
    return NextResponse.json(
      { error: 'Failed to create link token' },
      { status: 500 }
    );
  }
}
