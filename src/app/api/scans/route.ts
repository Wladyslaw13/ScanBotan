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
  const hasActive =
    !!sub &&
    sub.status === 'active' &&
    (!sub.currentPeriodEnd || sub.currentPeriodEnd > new Date());

  if (!hasActive) {
    return NextResponse.json({ subscribed: false, scans: [] }, { status: 402 });
  }

  const scans = await prisma.scan.findMany({
    where: { userId, plantFound: true },
    orderBy: { createdAt: 'desc' },
    select: { id: true, createdAt: true, result: true },
  });

  return NextResponse.json({ subscribed: true, scans });
}
