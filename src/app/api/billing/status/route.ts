import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions as any);
  if (!session || !(session as any).user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = Number((session as any).user.id);

  let subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: {
      status: true,
      currentPeriodEnd: true,
      createdAt: true,
      updatedAt: true,
      paymentMethodId: true,
      provider: true,
    },
  });

  if (!subscription) {
    subscription = await prisma.subscription.create({
      data: {
        userId,
        status: 'canceled',
      },
      select: {
        status: true,
        currentPeriodEnd: true,
        createdAt: true,
        updatedAt: true,
        paymentMethodId: true,
        provider: true,
      },
    });
  }

  const payments = await prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      amount: true,
      currency: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    subscription: subscription
      ? {
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
          createdAt: subscription.createdAt,
          updatedAt: subscription.updatedAt,
          hasSavedCard:
            subscription.provider === 'yookassa' &&
            !!subscription.paymentMethodId,
        }
      : null,
    payments,
  });
}
