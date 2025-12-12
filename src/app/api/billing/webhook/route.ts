import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body?.event || body?.type;
    const object = body?.object || body?.payment || body?.data?.object;

    if (!object) return NextResponse.json({ ok: true });

    if (event === 'payment.succeeded' || object?.status === 'succeeded') {
      const paymentId: string = object.id;
      const amountKopeks = Math.round(
        parseFloat(object.amount?.value || '0') * 100
      );
      const userId = Number(object.metadata?.userId);

      if (userId && paymentId) {
        await prisma.payment.upsert({
          where: { providerPaymentId: paymentId },
          update: {},
          create: {
            userId,
            provider: 'yookassa',
            providerPaymentId: paymentId,
            amount: amountKopeks,
            status: 'succeeded',
          },
        });

        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        await prisma.subscription.upsert({
          where: { userId },
          update: {
            status: 'active',
            provider: 'yookassa',
            externalId: paymentId,
            currentPeriodEnd: periodEnd,
          },
          create: {
            userId,
            status: 'active',
            provider: 'yookassa',
            externalId: paymentId,
            currentPeriodEnd: periodEnd,
          },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Webhook error' },
      { status: 500 }
    );
  }
}
