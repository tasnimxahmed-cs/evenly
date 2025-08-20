import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Webhook } from 'svix';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const headerPayload = headers();
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

    let evt: any;

    // Verify the payload with the headers
    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err) {
      console.error('Error verifying webhook:', err);
      return new Response('Error occured', {
        status: 400
      });
    }

    // Handle the webhook
    const eventType = evt.type;
    
    if (eventType === 'user.created') {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;
      
      // Get the primary email
      const primaryEmail = email_addresses?.find((email: any) => email.id === evt.data.primary_email_address_id);
      
      if (primaryEmail) {
        // Create user in our database
        await prisma.user.create({
          data: {
            id,
            email: primaryEmail.email_address,
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
