import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export const runtime = 'nodejs';

function getBasicAuth(shopId: string, secret: string) {
  const token = Buffer.from(`${shopId}:${secret}`, 'utf8').toString('base64');
  return `Basic ${token}`;
}

async function disableYooKassaPaymentMethod(paymentMethodId: string) {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secret = process.env.YOOKASSA_SECRET;

  if (!shopId || !secret) {
    return { ok: false as const, error: 'YooKassa не настроена' };
  }

  const res = await fetch(
    `https://api.yookassa.ru/v3/payment_methods/${encodeURIComponent(paymentMethodId)}/disable`,
    {
      method: 'POST',
      headers: {
        Authorization: getBasicAuth(shopId, secret),
        'Content-Type': 'application/json',
        'Idempotence-Key': crypto.randomUUID(),
      },
    }
  );

  if (res.ok) {
    return { ok: true as const };
  }

  // ЮKassa иногда возвращает 400/404 если метод уже неактивен/не найден.
  // Это не должно блокировать очистку локального состояния.
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // ignore
  }

  const message =
    body?.description ||
    body?.message ||
    `YooKassa disable failed: ${res.status}`;

  return { ok: false as const, error: message, status: res.status };
}

export async function POST() {
  const session = await getServerSession(authOptions as any);
  if (!session || !(session as any).user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = Number((session as any).user.id);

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: {
      id: true,
      provider: true,
      paymentMethodId: true,
      status: true,
      currentPeriodEnd: true,
    },
  });

  if (!subscription?.paymentMethodId) {
    // Нечего отвязывать (или карта уже отвязана)
    if (subscription && subscription.status !== 'canceled') {
      await prisma.subscription.update({
        where: { userId },
        data: { status: 'canceled' },
      });
    }

    return NextResponse.json({ ok: true });
  }

  // Пробуем отвязать в YooKassa (disable payment method)
  const disableResult = await disableYooKassaPaymentMethod(
    subscription.paymentMethodId
  );

  // Локально считаем карту отвязанной даже если YooKassa вернула
  // "уже отключено"/"не найдено" — иначе пользователь не сможет
  // выполнить требование ЮKassa через интерфейс.
  const shouldClearLocal =
    disableResult.ok ||
    disableResult.status === 400 ||
    disableResult.status === 404;

  if (!shouldClearLocal) {
    return NextResponse.json(
      { error: disableResult.error || 'Не удалось отвязать карту' },
      { status: 502 }
    );
  }

  await prisma.subscription.update({
    where: { userId },
    data: {
      paymentMethodId: null,
      status: 'canceled',
    },
  });

  return NextResponse.json({ ok: true });
}
