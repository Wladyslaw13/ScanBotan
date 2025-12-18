import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import YooKassa from 'yookassa';

const GRACE_DAYS = 3;

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secret = process.env.YOOKASSA_SECRET;

  if (!shopId || !secret) {
    return NextResponse.json(
      { error: 'YooKassa not configured' },
      { status: 500 }
    );
  }

  const yoo = new (YooKassa as any)({ shopId, secretKey: secret });

  const now = new Date();

  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: { in: ['active', 'past_due'] },
      paymentMethodId: { not: null },
      currentPeriodEnd: {
        not: null,
        lte: now,
      },
    },
  });

  for (const sub of subscriptions) {
    try {
      const payment = await yoo.createPayment({
        amount: { value: '99.00', currency: 'RUB' },
        capture: true,

        payment_method_id: sub.paymentMethodId,
        confirmation: { type: 'automatic' },

        description: 'Продление подписки',
        metadata: { userId: sub.userId },
      });

      if (payment?.status === 'succeeded') {
        const nextPeriodEnd = new Date(sub.currentPeriodEnd!);
        nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);

        await prisma.subscription.update({
          where: { userId: sub.userId },
          data: {
            status: 'active',
            currentPeriodEnd: nextPeriodEnd,
            externalId: payment.id,
          },
        });

        await prisma.payment.create({
          data: {
            userId: sub.userId,
            provider: 'yookassa',
            providerPaymentId: payment.id,
            amount: 9900,
            status: 'succeeded',
          },
        });
      }
    } catch (e) {
      if (sub.status === 'active') {
        await prisma.subscription.update({
          where: { userId: sub.userId },
          data: { status: 'past_due' },
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
