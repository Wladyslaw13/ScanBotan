import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions as any);
  if (!session || !(session as any).user?.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = Number((session as any).user.id);

  const sub = await prisma.subscription.findUnique({ where: { userId } });
  const now = new Date();
  const periodValid = sub?.currentPeriodEnd 
    ? sub.currentPeriodEnd > now 
    : false;
  
  // Подписка активна если статус 'active' и период не истек, ИЛИ
  // период еще не истек (даже если статус 'canceled' - отмена только отменяет продление)
  const hasActive =
    !!sub &&
    periodValid &&
    (sub.status === 'active' || sub.status === 'canceled');

  if (!hasActive) {
    return NextResponse.json({ subscribed: false, scans: [] }, { status: 402 });
  }

  const scans = await prisma.scan.findMany({
    where: { userId, plantFound: true },
    orderBy: { createdAt: 'desc' },
    select: { id: true, createdAt: true, result: true, isFavorite: true },
  });

  return NextResponse.json({ subscribed: true, scans });
}
