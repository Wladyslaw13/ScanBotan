import { prisma } from '@/lib/prisma';

export async function checkSubscription(userId: number) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  return subscription?.status === 'active';
}
