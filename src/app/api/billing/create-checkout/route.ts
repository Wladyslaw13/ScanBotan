import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import YooKassa from 'yookassa';

export async function POST() {
  const session = await getServerSession(authOptions as any);
  if (!session || !(session as any).user?.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = Number((session as any).user.id);

  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secret = process.env.YOOKASSA_SECRET;
  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  if (!shopId || !secret)
    return NextResponse.json(
      { error: 'YooKassa не настроена' },
      { status: 500 }
    );

  console.log('YOOKASSA_SHOP_ID', shopId);
  console.log('YOOKASSA_SECRET', secret ? 'OK' : 'MISSING');

  const yoo = new (YooKassa as any)({ shopId, secretKey: secret });

  try {
    const amountValue = '100.00';
    const payment = await yoo.createPayment({
      amount: { value: amountValue, currency: 'RUB' },
      capture: true,
      confirmation: { type: 'redirect', return_url: `${siteUrl}/` },
      description: 'СканБотан — подписка 1 месяц',
      metadata: { userId },
    });

    return NextResponse.json({
      url:
        payment?.confirmation?.confirmation_url ||
        payment?.confirmation?.return_url,
    });
  } catch (e: any) {
    console.error('YOOKASSA ERROR', e);
    return NextResponse.json(
      { error: e?.message || 'Ошибка создания платежа' },
      { status: 500 }
    );
  }
}
