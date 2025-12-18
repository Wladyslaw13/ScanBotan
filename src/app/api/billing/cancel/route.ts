import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const session = await getServerSession(authOptions as any);
  if (!session || !(session as any).user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = Number((session as any).user.id);

  await prisma.subscription.upsert({
    where: { userId },
    update: {
      status: 'canceled',
    },
    create: {
      userId,
      status: 'canceled',
      provider: 'yookassa',
    },
  });

  return NextResponse.json({ ok: true });
}
