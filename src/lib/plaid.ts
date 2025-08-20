import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode, AccountSubtype } from 'plaid';

const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
      'PLAID-SECRET': process.env.PLAID_SECRET!,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

// Helper function to create link token
export async function createLinkToken(userId: string) {
  const request = {
    user: { client_user_id: userId },
    client_name: 'Evenly',
    products: ['transactions'] as Products[],
    country_codes: ['US'] as CountryCode[],
    language: 'en',
    account_filters: {
      depository: {
        account_subtypes: ['checking', 'savings'] as AccountSubtype[],
      },
    },
  };

  try {
    const createTokenResponse = await plaidClient.linkTokenCreate(request);
    return createTokenResponse.data.link_token;
  } catch (error) {
    console.error('Error creating link token:', error);
    throw error;
  }
}

// Helper function to exchange public token for access token
export async function exchangePublicToken(publicToken: string) {
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });
    return response.data;
  } catch (error) {
    console.error('Error exchanging public token:', error);
    throw error;
  }
}

// Helper function to get accounts
export async function getAccounts(accessToken: string) {
  try {
    const response = await plaidClient.accountsGet({
      access_token: accessToken,
    });
    return response.data.accounts;
  } catch (error) {
    console.error('Error getting accounts:', error);
    throw error;
  }
}

// Helper function to get transactions
export async function getTransactions(
  accessToken: string,
  startDate: string,
  endDate: string,
  accountIds?: string[]
) {
  try {
    const response = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
      options: {
        account_ids: accountIds,
      },
    });
    return response.data.transactions;
  } catch (error) {
    console.error('Error getting transactions:', error);
    throw error;
  }
}
