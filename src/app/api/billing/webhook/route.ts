import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secret = process.env.YOOKASSA_SECRET;

  if (!shopId || !secret) {
    console.error('[Webhook] Missing YOOKASSA credentials');
    return NextResponse.json({ error: 'Config error' }, { status: 500 });
  }

  // ✅ Basic Auth
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Basic ')) {
    console.warn('[Webhook] No Basic auth header');
    return NextResponse.json({ error: 'No auth' }, { status: 401 });
  }

  const decoded = Buffer.from(auth.split(' ')[1], 'base64').toString();
  const [login, password] = decoded.split(':');

  if (login !== shopId || password !== secret) {
    console.warn('[Webhook] Invalid credentials');
    return NextResponse.json({ error: 'Invalid auth' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    console.error('[Webhook] Failed to parse JSON body');
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = body?.event;
  const object = body?.object;

  console.log(`[Webhook] Event: ${event}, PaymentId: ${object?.id}`);

  if (!event || !object) {
    return NextResponse.json({ ok: true });
  }

  // ✅ Обработка разных событий
  if (event === 'payment.succeeded') {
    return handlePaymentSucceeded(object);
  }

  if (event === 'payment.canceled') {
    console.log(`[Webhook] Payment canceled: ${object.id}`);
    // Можно обновить статус платежа если нужно
    return NextResponse.json({ ok: true });
  }

  // Неизвестное событие — просто подтверждаем получение
  return NextResponse.json({ ok: true });
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
