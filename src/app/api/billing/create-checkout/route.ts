import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import YooKassa from 'yookassa';

const BASE_PRICE = 9900; // 99 рублей в копейках

export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!session || !(session as any).user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = Number((session as any).user.id);
  const { promoCode } = await req.json().catch(() => ({}));

  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secret = process.env.YOOKASSA_SECRET;
  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  let finalPrice = BASE_PRICE;
  let appliedPromoCode: string | null = null;

  // Обработка промокода
  if (promoCode && typeof promoCode === 'string') {
    const promoCodeUpper = promoCode.trim().toUpperCase();
    const promo = await prisma.promoCode.findUnique({
      where: { code: promoCodeUpper },
    });

    if (
      promo &&
      promo.active &&
      (!promo.expiresAt || promo.expiresAt > new Date()) &&
      (!promo.maxUses || promo.usedCount < promo.maxUses)
    ) {
      // Проверяем, использовал ли пользователь уже промокод
      const existingSub = await prisma.subscription.findUnique({
        where: { userId },
      });

      if (existingSub?.provider === 'promo') {
        const now = new Date();
        const periodValid = existingSub.currentPeriodEnd
          ? existingSub.currentPeriodEnd > now
          : false;
        if (periodValid || existingSub.status === 'active') {
          return NextResponse.json(
            {
              error:
                'Вы уже использовали промокод для этого аккаунта. Каждый промокод можно использовать только один раз.',
            },
            { status: 400 }
          );
        }
      }

      if (promo.percentOff !== null) {
        finalPrice = Math.max(
          0,
          Math.round(BASE_PRICE * (1 - promo.percentOff / 100))
        );
      }

      appliedPromoCode = promo.code;
    }
  }

  // Если промокод дает 100% скидку — активируем подписку сразу
  if (finalPrice === 0) {
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await prisma.subscription.upsert({
      where: { userId },
      update: {
        status: 'active',
        currentPeriodEnd: periodEnd,
        provider: 'promo',
      },
      create: {
        userId,
        status: 'active',
        currentPeriodEnd: periodEnd,
        provider: 'promo',
      },
    });

    if (appliedPromoCode) {
      await prisma.promoCode.update({
        where: { code: appliedPromoCode },
        data: { usedCount: { increment: 1 } },
      });
    }

    return NextResponse.json({ free: true });
  }

  // Иначе создаем платеж в YooKassa
  if (!shopId || !secret) {
    return NextResponse.json(
      { error: 'YooKassa не настроена' },
      { status: 500 }
    );
  }

  const yoo = new (YooKassa as any)({ shopId, secretKey: secret });

  try {
    const payment = await yoo.createPayment({
      amount: { value: (finalPrice / 100).toFixed(2), currency: 'RUB' },
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: `${siteUrl}/billing`,
      },
      payment_method_data: {
        type: 'bank_card',
      },
      save_payment_method: true,
      description: 'СканБотан — подписка 1 месяц',
      metadata: { userId, promoCode: appliedPromoCode },
    });

    return NextResponse.json({
      url:
        payment?.confirmation?.confirmation_url ||
        payment?.confirmation?.return_url,
    });
  } catch (e: any) {
    console.error('YOOKASSA ERROR', e);

    if (e?.code === 'forbidden') {
      return NextResponse.json(
        {
          error:
            'Этот магазин YooKassa не поддерживает сохранение карты/повторные платежи. Обратитесь к вашему менеджеру YooKassa, чтобы включить автоплатежи.',
          details: { id: e?.id, code: e?.code },
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: e?.message || 'Ошибка создания платежа' },
      { status: 500 }
    );
  }
}
