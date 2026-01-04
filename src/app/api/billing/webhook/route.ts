import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    console.error('[Webhook] Failed to parse JSON body');
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = body?.event;
  const object = body?.object;

  console.log(
    '[Webhook] Received:',
    JSON.stringify({ event, paymentId: object?.id, metadata: object?.metadata })
  );

  if (!event || !object) {
    console.warn('[Webhook] Missing event or object');
    return NextResponse.json({ ok: true });
  }

  // ✅ Проверяем что это реальный платёж через API YooKassa
  if (event === 'payment.succeeded') {
    const isValid = await verifyPaymentWithYooKassa(object.id);
    if (!isValid) {
      console.warn('[Webhook] Payment verification failed:', object.id);
      return NextResponse.json({ error: 'Invalid payment' }, { status: 400 });
    }
    return handlePaymentSucceeded(object);
  }

  if (event === 'payment.canceled') {
    console.log(`[Webhook] Payment canceled: ${object.id}`);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

// ✅ Проверяем платёж через API YooKassa (вместо Basic Auth)
async function verifyPaymentWithYooKassa(paymentId: string): Promise<boolean> {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secret = process.env.YOOKASSA_SECRET;

  if (!shopId || !secret) {
    console.error('[Webhook] Missing YOOKASSA credentials for verification');
    return false;
  }

  try {
    const response = await fetch(
      `https://api.yookassa.ru/v3/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${shopId}:${secret}`).toString('base64')}`,
        },
      }
    );

    if (!response.ok) {
      console.error('[Webhook] YooKassa API error:', response.status);
      return false;
    }

    const payment = await response.json();
    console.log('[Webhook] Payment verified:', payment.status);
    return payment.status === 'succeeded';
  } catch (e) {
    console.error('[Webhook] Failed to verify payment:', e);
    return false;
  }
}

async function handlePaymentSucceeded(object: any) {
  try {
    const paymentId: string = object.id;
    const paymentMethodId = object.payment_method?.id;
    const rawUserId = object.metadata?.userId;
    const promoCode = object.metadata?.promoCode;

    // ✅ Строгая валидация userId
    const userId = parseInt(String(rawUserId), 10);
    if (!paymentId || !Number.isFinite(userId) || userId <= 0) {
      console.warn('[Webhook] Invalid paymentId or userId', {
        paymentId,
        rawUserId,
      });
      return NextResponse.json({ ok: true });
    }

    const amountKopeks = Math.round(
      parseFloat(object.amount?.value || '0') * 100
    );

    // ✅ Upsert вместо findUnique + create (защита от race condition)
    const payment = await prisma.payment.upsert({
      where: { providerPaymentId: paymentId },
      update: {}, // Уже существует — ничего не меняем
      create: {
        userId,
        provider: 'yookassa',
        providerPaymentId: paymentId,
        amount: amountKopeks,
        status: 'succeeded',
      },
    });

    // Если платёж уже был обработан — не дублируем подписку
    if (payment.createdAt < new Date(Date.now() - 5000)) {
      console.log(`[Webhook] Payment already processed: ${paymentId}`);
      return NextResponse.json({ ok: true });
    }

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await prisma.subscription.upsert({
      where: { userId },
      update: {
        status: 'active',
        paymentMethodId: paymentMethodId || undefined,
        externalId: paymentId,
        currentPeriodEnd: periodEnd,
      },
      create: {
        userId,
        status: 'active',
        paymentMethodId: paymentMethodId || null,
        provider: 'yookassa',
        externalId: paymentId,
        currentPeriodEnd: periodEnd,
      },
    });

    console.log(`[Webhook] Subscription activated for user ${userId}`);

    if (promoCode) {
      try {
        await prisma.promoCode.update({
          where: { code: promoCode },
          data: { usedCount: { increment: 1 } },
        });
      } catch (e) {
        console.warn(`[Webhook] Failed to update promo code: ${promoCode}`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[Webhook] Error processing payment:', e);
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}
