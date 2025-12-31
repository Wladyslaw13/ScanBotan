import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import YooKassa from 'yookassa';

export async function POST() {
  const session = await getServerSession(authOptions as any);
  if (!session || !(session as any).user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = Number((session as any).user.id);

  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secret = process.env.YOOKASSA_SECRET;
  const siteUrl = process.env.NEXTAUTH_URL!;

  if (!shopId || !secret) {
    return NextResponse.json(
      { error: 'YooKassa не настроена' },
      { status: 500 }
    );
  }

  if (!siteUrl) {
    return NextResponse.json(
      { error: 'NEXTAUTH_URL не настроен' },
      { status: 500 }
    );
  }

  const yoo = new (YooKassa as any)({ shopId, secretKey: secret });

  try {
    // ⚠️ Минимальная сумма — 1 рубль
    const payment = await yoo.createPayment({
      amount: { value: '1.00', currency: 'RUB' },
      capture: true,

      confirmation: {
        type: 'redirect',
        return_url: `${siteUrl}/billing/change-card/success`,
      },

      payment_method_data: { type: 'bank_card' },
      save_payment_method: true,

      description: 'Смена карты для подписки',
      metadata: {
        userId,
        changeCard: true,
      },
    });

    return NextResponse.json({
      url: payment.confirmation.confirmation_url,
    });
  } catch (e: any) {
    // Типичная ошибка YooKassa, когда для магазина не включены автоплатежи/повторные платежи.
    if (e?.code === 'forbidden') {
      return NextResponse.json(
        {
          error:
            'Этот магазин YooKassa не поддерживает сохранение карты/повторные платежи. Обратитесь к вашему менеджеру YooKassa, чтобы включить автоплатежи, или используйте оплату без привязки карты.',
          details: { id: e?.id, code: e?.code },
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: e?.message || 'Ошибка YooKassa',
        details: { id: e?.id, code: e?.code },
      },
      { status: 500 }
    );
  }
}
