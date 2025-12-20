import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const BASE_PRICE = 9900;

export async function POST(req: Request) {
  const { promoCode } = await req.json().catch(() => ({}));

  if (!promoCode || typeof promoCode !== 'string') {
    return NextResponse.json({ valid: false, error: 'Промокод не указан' });
  }

  const session = await getServerSession(authOptions as any);
  const userId = session?.user?.id ? Number((session as any).user.id) : null;

  const promo = await prisma.promoCode.findUnique({
    where: { code: promoCode.trim().toUpperCase() },
  });

  if (!promo) {
    return NextResponse.json({ valid: false, error: 'Промокод не найден' });
  }

  if (!promo.active) {
    return NextResponse.json({ valid: false, error: 'Промокод неактивен' });
  }

  if (promo.expiresAt && promo.expiresAt <= new Date()) {
    return NextResponse.json({ valid: false, error: 'Промокод истек' });
  }

  if (promo.maxUses && promo.usedCount >= promo.maxUses) {
    return NextResponse.json({ valid: false, error: 'Промокод уже использован максимальное количество раз' });
  }

  if (promo.percentOff === null) {
    return NextResponse.json({ valid: false, error: 'Неверный промокод' });
  }

  // Проверяем, использовал ли пользователь уже этот промокод (если авторизован)
  if (userId) {
    const existingSub = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (existingSub?.provider === 'promo') {
      const now = new Date();
      const periodValid = existingSub.currentPeriodEnd 
        ? existingSub.currentPeriodEnd > now 
        : false;
      if (periodValid || existingSub.status === 'active') {
        return NextResponse.json({ 
          valid: false, 
          error: 'Вы уже использовали промокод для этого аккаунта. Каждый промокод можно использовать только один раз.' 
        });
      }
    }
  }

  const discountPercent = promo.percentOff;
  const finalPrice = Math.max(0, Math.round(BASE_PRICE * (1 - discountPercent / 100)));

  return NextResponse.json({
    valid: true,
    discountPercent,
    originalPrice: BASE_PRICE,
    finalPrice,
  });
}
