import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions as any);
  if (!session || !(session as any).user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = Number((session as any).user.id);
  const { id } = await params;
  const scanId = Number(id);

  if (!Number.isFinite(scanId)) {
    return NextResponse.json({ error: 'Invalid scan ID' }, { status: 400 });
  }

  // Verify ownership and get current favorite status
  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    select: { userId: true, isFavorite: true },
  });

  if (!scan || scan.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Toggle favorite
  const updated = await prisma.scan.update({
    where: { id: scanId },
    data: { isFavorite: !scan.isFavorite },
    select: { isFavorite: true },
  });

  return NextResponse.json({ isFavorite: updated.isFavorite });
}

