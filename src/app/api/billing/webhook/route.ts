import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.YOOKASSA_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'No secret' }, { status: 500 });
    }

    const rawBody = await req.text();

    const signature = req.headers.get('YooKassa-Signature');
    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = JSON.parse(rawBody);

    const event = body?.event || body?.type;
    const object = body?.object || body?.payment || body?.data?.object;

    if (!object) return NextResponse.json({ ok: true });

    const isChangeCard = object.metadata?.changeCard === true;

    if (event === 'payment.succeeded' || object?.status === 'succeeded') {
      const paymentId: string = object.id;
      const paymentMethodId = object.payment_method?.id;
      const userId = Number(object.metadata?.userId);
      const promoCode = object.metadata?.promoCode;

      if (!userId || !paymentId) {
        return NextResponse.json({ ok: true });
      }

      if (isChangeCard && paymentMethodId) {
        await prisma.subscription.update({
          where: { userId },
          data: {
            paymentMethodId,
            status: 'active',
          },
        });

        return NextResponse.json({ ok: true });
      }

      const existingPayment = await prisma.payment.findUnique({
        where: { providerPaymentId: paymentId },
      });

      if (existingPayment) {
        return NextResponse.json({ ok: true });
      }

      const amountKopeks = Math.round(
        parseFloat(object.amount?.value || '0') * 100
      );

      await prisma.payment.create({
        data: {
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
          paymentMethodId,
          externalId: paymentId,
          currentPeriodEnd: periodEnd,
        },
        create: {
          userId,
          status: 'active',
          paymentMethodId,
          provider: 'yookassa',
          externalId: paymentId,
          currentPeriodEnd: periodEnd,
        },
      });

      if (promoCode) {
        await prisma.promoCode.update({
          where: { code: promoCode },
          data: { usedCount: { increment: 1 } },
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
