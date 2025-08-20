import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function ensureUser() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Check if user exists in our database, if not create them
  let user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    // For now, create a basic user record with the userId
    // The webhook will handle proper user creation for new signups
    user = await prisma.user.create({
      data: {
        id: userId,
        email: `user-${userId}@placeholder.com`, // Placeholder email
        name: 'User', // Placeholder name
      },
    });
  }

  return { userId, user };
}
