import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const GRACE_DAYS = 3;

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const graceLimit = new Date();
  graceLimit.setDate(graceLimit.getDate() - GRACE_DAYS);

  await prisma.subscription.updateMany({
    where: {
      status: 'past_due',
      currentPeriodEnd: {
        not: null,
        lte: graceLimit,
      },
    },
    data: {
      status: 'canceled',
    },
  });

  return NextResponse.json({ ok: true });
}
