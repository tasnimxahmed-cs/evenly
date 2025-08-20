import { NextRequest, NextResponse } from 'next/server';
import { ensureUser } from '@/lib/auth';
import { exchangePublicToken, getAccounts } from '@/lib/plaid';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const exchangeTokenSchema = z.object({
  publicToken: z.string(),
  metadata: z.object({
    institution: z.object({
      name: z.string(),
      institution_id: z.string(),
    }),
    accounts: z.array(z.object({
      id: z.string(),
      name: z.string(),
      mask: z.string(),
      type: z.string(),
      subtype: z.string(),
    })),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await ensureUser();
    const body = await request.json();
    const validatedData = exchangeTokenSchema.parse(body);

    // Exchange public token for access token
    const exchangeResponse = await exchangePublicToken(validatedData.publicToken);
    const accessToken = exchangeResponse.access_token;
    const itemId = exchangeResponse.item_id;

    // Get account details from Plaid
    const plaidAccounts = await getAccounts(accessToken);

    if (!plaidAccounts || plaidAccounts.length === 0) {
      throw new Error('No accounts found');
    }

    // Save all bank accounts to database
    const savedAccounts = [];
    for (const account of plaidAccounts) {
      const bankAccount = await prisma.bankAccount.create({
        data: {
          userId,
          plaidItemId: itemId,
          plaidAccountId: account.account_id,
          plaidAccessToken: accessToken, // Store the access token
          accountName: account.name,
          accountType: account.type,
          mask: account.mask,
          institution: validatedData.metadata.institution.name,
        },
      });
      savedAccounts.push(bankAccount);
    }

    return NextResponse.json({
      message: `Successfully connected ${savedAccounts.length} bank account(s)`,
      bankAccounts: savedAccounts.map(account => ({
        id: account.id,
        institution: account.institution,
        accountName: account.accountName,
      })),
    });
  } catch (error) {
    console.error('Error exchanging token:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to connect bank account' },
      { status: 500 }
    );
  }
}
