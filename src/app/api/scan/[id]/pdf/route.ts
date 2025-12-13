import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import PDFDocument from 'pdfkit';
import { checkSubscription } from '@/lib/checkSubscription';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const scanId = Number(params.id);
  if (!Number.isFinite(scanId)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
  });

  if (!scan || scan.userId !== Number(session.user.id)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const hasSubscription = await checkSubscription(Number(session.user.id));

  if (!hasSubscription) {
    return new NextResponse('Subscription required', { status: 402 });
  }

  const result: any = scan.result || {};

  const doc = new PDFDocument({ margin: 40 });
  const chunks: Buffer[] = [];

  doc.on('data', (c) => chunks.push(c));
  doc.on('end', () => {});

  doc.fontSize(20).text('Результат сканирования растения', {
    align: 'center',
  });
  doc.moveDown();

  doc.fontSize(14).text(`Дата: ${new Date(scan.createdAt).toLocaleString()}`);
  doc.moveDown();

  doc.fontSize(16).text('Название растения:');
  doc.fontSize(14).text(result.plantName || result.name || 'Неизвестно');
  doc.moveDown();

  doc.fontSize(16).text('Состояние здоровья:');
  doc.fontSize(14).text(result.condition || result.healthCondition || '—');
  doc.moveDown();

  doc.fontSize(16).text('Рекомендации:');
  if (Array.isArray(result.recommendations)) {
    result.recommendations.forEach((r: string) =>
      doc.fontSize(14).text(`• ${r}`)
    );
  } else {
    doc.fontSize(14).text('Нет рекомендаций');
  }

  doc.end();

  return new NextResponse(Buffer.concat(chunks), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="scan-${scan.id}.pdf"`,
    },
  });
}
