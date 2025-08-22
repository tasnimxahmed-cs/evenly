import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Webhook } from 'svix';
import { headers } from 'next/headers';

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{
      id: string;
      email_address: string;
    }>;
    phone_numbers?: Array<{
      id: string;
      phone_number: string;
    }>;
    primary_email_address_id?: string;
    primary_phone_number_id?: string;
    first_name?: string;
    last_name?: string;
    image_url?: string;
  };
}

interface EmailAddress {
  id: string;
  email_address: string;
}

export async function POST(request: NextRequest) {
  try {
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response('Error occured -- no svix headers', {
        status: 400
      });
    }

    // Get the body
    const payload = await request.json();
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your secret.
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

    let evt: ClerkWebhookEvent;

    // Verify the payload with the headers
    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as ClerkWebhookEvent;
    } catch (err) {
      console.error('Error verifying webhook:', err);
      return new Response('Error occured', {
        status: 400
      });
    }

    // Handle the webhook
    const eventType = evt.type;
    
    if (eventType === 'user.created') {
      const { id, email_addresses, phone_numbers, first_name, last_name, image_url } = evt.data;
      
      // Get the primary email
      const primaryEmail = email_addresses?.find((email: EmailAddress) => email.id === evt.data.primary_email_address_id);
      
      // Get the primary phone number (only available with Clerk Pro)
      const primaryPhone = phone_numbers?.find((phone) => phone.id === evt.data.primary_phone_number_id);
      
      if (primaryEmail) {
        // Create user in our database
        await prisma.user.create({
          data: {
            id,
            email: primaryEmail.email_address,
            phone: primaryPhone?.phone_number || null, // Will be null without Clerk Pro
            name: `${first_name || ''} ${last_name || ''}`.trim() || 'User',
            avatar: image_url,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
