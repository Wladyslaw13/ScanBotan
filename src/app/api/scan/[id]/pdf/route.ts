import { Buffer } from 'buffer';
import fontkit from '@pdf-lib/fontkit';
import { PDFDocument as PDFLibDocument, StandardFonts, rgb } from 'pdf-lib';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { checkSubscription } from '@/lib/checkSubscription';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const fontUrl =
  'https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf';

let cachedFontBytes: Uint8Array | null = null;

async function getFontBytes(): Promise<Uint8Array> {
  if (cachedFontBytes) return cachedFontBytes;
  const res = await fetch(fontUrl);
  if (!res.ok) {
    throw new Error(`Failed to load font: ${res.status} ${res.statusText}`);
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  cachedFontBytes = buf;
  return buf;
}

function safeText(value: unknown, fallback = '—'): string {
  const s = String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  return s ? s : fallback;
}

function normalizeRecommendations(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input
      .map((x) => safeText(x, ''))
      .map((x) => x.trim())
      .filter(Boolean);
  }

  if (typeof input === 'string') {
    return input
      .split(/\r?\n|;+/)
      .map((x) => x.replace(/^\s*[•\-–—]\s*/, '').trim())
      .filter(Boolean);
  }

  return [];
}

async function getImageBytes(
  imageUrl: string,
  baseUrl: string
): Promise<{ bytes: Uint8Array; mime?: string } | null> {
  const url = imageUrl.trim();
  if (!url) return null;

  if (url.startsWith('data:')) {
    const match = url.match(/^data:([^;]+);base64,(.*)$/);
    if (!match) return null;
    const mime = match[1];
    const bytes = new Uint8Array(Buffer.from(match[2], 'base64'));
    return { bytes, mime };
  }

  try {
    const absolute = new URL(url, baseUrl);
    const res = await fetch(absolute);
    if (!res.ok) return null;
    const mime = res.headers.get('content-type')?.split(';')[0] ?? undefined;
    const bytes = new Uint8Array(await res.arrayBuffer());
    return { bytes, mime };
  } catch {
    return null;
  }
}

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

  const scan = await prisma.scan.findUnique({ where: { id: scanId } });
  if (!scan || scan.userId !== Number(session.user.id)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const hasSubscription = await checkSubscription(Number(session.user.id));
  if (!hasSubscription) {
    return new NextResponse('Subscription required', { status: 402 });
  }

  const result: any = scan.result || {};

  const pdfDoc = await PDFLibDocument.create();
  const addPage = () => pdfDoc.addPage([595.28, 841.89]); // A4 portrait

  let page = addPage();
  let { width, height } = page.getSize();
  const margin = 32;
  const minY = margin;
  let cursorY = height - margin;
  const contentWidth = width - margin * 2;
  const gap = 16;

  const primary = rgb(0.1, 0.55, 0.34);
  const muted = rgb(0.36, 0.39, 0.45);
  const border = rgb(0.88, 0.92, 0.9);
  const cardBg = rgb(0.95, 0.98, 0.96);

  const fontBytes = await getFontBytes().catch(() => null);
  if (fontBytes) {
    pdfDoc.registerFontkit(fontkit);
  }

  const font = fontBytes
    ? await pdfDoc.embedFont(fontBytes, { subset: true })
    : await pdfDoc.embedFont(StandardFonts.Helvetica);

  const wrapText = (text: string, size: number, maxWidth: number) => {
    const safe = safeText(text, '');
    if (!safe) return ['—'];
    const words = safe.split(' ');
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      const widthAtSize = font.widthOfTextAtSize(candidate, size);
      if (widthAtSize <= maxWidth) {
        current = candidate;
        continue;
      }

      if (!current) {
        let slice = '';
        for (const char of word) {
          const trySlice = slice + char;
          if (font.widthOfTextAtSize(trySlice, size) > maxWidth) {
            if (slice) lines.push(slice);
            slice = char;
          } else {
            slice = trySlice;
          }
        }
        current = slice;
      } else {
        lines.push(current);
        current = word;
      }
    }

    if (current) lines.push(current);
    return lines.length ? lines : ['—'];
  };

  const ensureSpace = (needed: number) => {
    if (cursorY - needed < minY) {
      page = addPage();
      ({ width, height } = page.getSize());
      cursorY = height - margin;
    }
  };

  const drawDivider = () => {
    ensureSpace(20);
    page.drawRectangle({
      x: margin,
      y: cursorY - 10,
      width: contentWidth,
      height: 1,
      color: border,
    });
    cursorY -= 20;
  };

  const drawTextRight = (text: string, y: number, size: number) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: margin + contentWidth - textWidth,
      y,
      size,
      color: muted,
      font,
    });
  };

  const drawInfoCard = (
    label: string,
    value: unknown,
    cardX: number,
    cardW: number,
    opts?: { labelSize?: number; valueSize?: number; minHeight?: number }
  ) => {
    const pad = 14;
    const labelSize = opts?.labelSize ?? 12;
    const valueSize = opts?.valueSize ?? 20;
    const lineGap = 8;

    const valueLines = wrapText(safeText(value), valueSize, cardW - pad * 2);
    const contentH =
      labelSize +
      8 +
      valueLines.length * valueSize +
      Math.max(0, valueLines.length - 1) * lineGap;
    const cardH = Math.max(opts?.minHeight ?? 0, pad * 2 + contentH);

    page.drawRectangle({
      x: cardX,
      y: cursorY - cardH,
      width: cardW,
      height: cardH,
      color: cardBg,
      borderColor: border,
      borderWidth: 1,
    });

    page.drawText(label, {
      x: cardX + pad,
      y: cursorY - pad - labelSize,
      size: labelSize,
      color: primary,
      font,
    });

    let textY = cursorY - pad - labelSize - 10;
    for (const line of valueLines) {
      page.drawText(line, {
        x: cardX + pad,
        y: textY - valueSize,
        size: valueSize,
        color: rgb(0, 0, 0),
        font,
      });
      textY -= valueSize + lineGap;
    }

    return cardH;
  };

  const drawSingleCard = (
    label: string,
    value: unknown,
    opts?: { labelSize?: number; valueSize?: number; minHeight?: number }
  ) => {
    const cardH = (() => {
      const pad = 14;
      const labelSize = opts?.labelSize ?? 12;
      const valueSize = opts?.valueSize ?? 20;
      const lineGap = 8;
      const lines = wrapText(
        safeText(value),
        valueSize,
        contentWidth - pad * 2
      );
      const contentH =
        labelSize +
        8 +
        lines.length * valueSize +
        Math.max(0, lines.length - 1) * lineGap;
      return Math.max(opts?.minHeight ?? 0, pad * 2 + contentH);
    })();

    ensureSpace(cardH + gap);
    drawInfoCard(label, value, margin, contentWidth, opts);
    cursorY -= cardH + gap;
  };

  const drawTwoCardsRow = (
    left: { label: string; value: unknown },
    right: { label: string; value: unknown }
  ) => {
    const gutter = 14;
    const colW = (contentWidth - gutter) / 2;

    const heightLeft = (() => {
      const pad = 14;
      const labelSize = 12;
      const valueSize = 18;
      const lineGap = 8;
      const lines = wrapText(safeText(left.value), valueSize, colW - pad * 2);
      const contentH =
        labelSize +
        8 +
        lines.length * valueSize +
        Math.max(0, lines.length - 1) * lineGap;
      return pad * 2 + contentH;
    })();

    const heightRight = (() => {
      const pad = 14;
      const labelSize = 12;
      const valueSize = 18;
      const lineGap = 8;
      const lines = wrapText(safeText(right.value), valueSize, colW - pad * 2);
      const contentH =
        labelSize +
        8 +
        lines.length * valueSize +
        Math.max(0, lines.length - 1) * lineGap;
      return pad * 2 + contentH;
    })();

    const rowH = Math.max(heightLeft, heightRight);
    ensureSpace(rowH + gap);

    // Draw left
    drawInfoCard(left.label, left.value, margin, colW, {
      labelSize: 12,
      valueSize: 18,
      minHeight: rowH,
    });

    // Draw right
    drawInfoCard(right.label, right.value, margin + colW + gutter, colW, {
      labelSize: 12,
      valueSize: 18,
      minHeight: rowH,
    });

    cursorY -= rowH + gap;
  };

  const drawBulletsSection = (title: string, input: unknown) => {
    const items = normalizeRecommendations(input);
    const titleSize = 18;
    const bodySize = 16;
    const lineGap = 7;
    const bulletGap = 6;

    ensureSpace(32);
    page.drawText(title, {
      x: margin,
      y: cursorY - titleSize,
      size: titleSize,
      color: primary,
      font,
    });
    cursorY -= 28;

    if (items.length === 0) {
      ensureSpace(bodySize + 12);
      page.drawText('Нет рекомендаций', {
        x: margin,
        y: cursorY - bodySize,
        size: bodySize,
        color: muted,
        font,
      });
      cursorY -= bodySize + 14;
      return;
    }

    for (const item of items) {
      const wrapped = wrapText(item, bodySize, contentWidth - 22);
      const blockH =
        wrapped.length * bodySize +
        Math.max(0, wrapped.length - 1) * lineGap +
        bulletGap;
      ensureSpace(blockH);
      let firstLine = true;

      for (const line of wrapped) {
        page.drawText(firstLine ? '•' : '', {
          x: margin,
          y: cursorY - bodySize,
          size: bodySize,
          color: primary,
          font,
        });
        page.drawText(line, {
          x: margin + 18,
          y: cursorY - bodySize,
          size: bodySize,
          color: rgb(0, 0, 0),
          font,
        });
        cursorY -= bodySize + lineGap;
        firstLine = false;
      }

      cursorY -= bulletGap;
    }
  };

  // Header
  const headerSize = 12;
  page.drawText('ScanBotan', {
    x: margin,
    y: cursorY,
    size: headerSize,
    color: muted,
    font,
  });
  drawTextRight(
    new Date(scan.createdAt).toLocaleString('ru-RU'),
    cursorY,
    headerSize
  );
  cursorY -= 22;

  // Title
  const titleSize = 30;
  ensureSpace(44);
  page.drawText('Результат сканирования растения', {
    x: margin,
    y: cursorY - titleSize,
    size: titleSize,
    color: primary,
    font,
  });
  cursorY -= 44;

  drawDivider();

  if (typeof scan.imageUrl === 'string' && scan.imageUrl.trim()) {
    try {
      const image = await getImageBytes(scan.imageUrl, req.url);
      if (image) {
        const isPng = image.mime?.includes('png');
        const embedded = isPng
          ? await pdfDoc.embedPng(image.bytes)
          : await pdfDoc.embedJpg(image.bytes).catch(async () => {
              return pdfDoc.embedPng(image.bytes);
            });

        const dims = embedded.scale(1);
        const cardPadding = 14;
        const maxImgWidth = contentWidth - cardPadding * 2;
        const maxImgHeight = 520;
        const maxScale = 1.5;
        const scale = Math.min(
          maxScale,
          maxImgWidth / dims.width,
          maxImgHeight / dims.height
        );
        const imgW = dims.width * scale;
        const imgH = dims.height * scale;
        const cardHeight = imgH + cardPadding * 2 + 12;

        ensureSpace(cardHeight + gap);
        page.drawRectangle({
          x: margin,
          y: cursorY - cardHeight,
          width: contentWidth,
          height: cardHeight,
          color: cardBg,
          borderColor: border,
          borderWidth: 1,
        });

        page.drawImage(embedded, {
          x: margin + cardPadding + (maxImgWidth - imgW) / 2,
          y: cursorY - cardPadding - imgH,
          width: imgW,
          height: imgH,
        });

        page.drawText('Фото растения', {
          x: margin + cardPadding,
          y: cursorY - cardHeight + 8,
          size: 11,
          color: muted,
          font,
        });

        cursorY -= cardHeight + gap;
      }
    } catch (e) {
      console.warn('Не удалось вставить изображение в pdf-lib:', e);
    }
  }

  // Main content (larger typography)
  drawSingleCard(
    'Название растения',
    result.plantName ?? result.name ?? 'Неизвестно',
    {
      labelSize: 13,
      valueSize: 26,
      minHeight: 96,
    }
  );

  drawTwoCardsRow(
    {
      label: 'Состояние здоровья',
      value: result.condition ?? result.healthCondition ?? '—',
    },
    {
      label: 'Место происхождения',
      value: result.originContinent ?? 'Неизвестно',
    }
  );

  drawDivider();
  drawBulletsSection('Рекомендации по уходу', result.recommendations);

  ensureSpace(20);
  page.drawText(`Scan ID: ${scan.id}`, {
    x: width - margin - 120,
    y: margin / 2,
    size: 10,
    color: muted,
    font,
  });

  const pdfBytes = await pdfDoc.save();
  return new NextResponse(pdfBytes as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="scan-${scan.id}.pdf"`,
      'Cache-Control': 'private, no-store, max-age=0',
    },
  });
}
