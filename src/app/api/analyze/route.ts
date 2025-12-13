import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Together from 'together-ai';
import { getToken } from 'next-auth/jwt';
import { Buffer } from 'buffer';

/**
 * Извлекает первый JSON-объект из текста,
 * обходясь без регулярок и модификаторов.
 */
const JSON_EXTRACTOR = (text: string): any | null => {
  let start = -1;
  let depth = 0;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (c === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (c === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        const jsonString = text.slice(start, i + 1);
        try {
          return JSON.parse(jsonString);
        } catch {
          return null;
        }
      }
    }
  }

  return null;
};

export async function POST(req: NextRequest) {
  let token: any = null;
  try {
    token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  } catch (err) {
    console.error('Ошибка при getToken:', err);
  }

  if (!token?.id) {
    return NextResponse.json(
      { error: 'Вы не авторизованы. Войдите в аккаунт, чтобы продолжить.' },
      { status: 401 }
    );
  }

  const userId = Number(token.id);

  // Проверка формата multipart
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json(
      { error: 'Неверный формат запроса. Ожидается multipart/form-data.' },
      { status: 400 }
    );
  }

  // Получаем файл
  let file: Blob | null = null;
  try {
    const form = await req.formData();
    const maybeFile = form.get('file');
    if (!maybeFile || !(maybeFile instanceof Blob)) {
      return NextResponse.json(
        { error: 'Файл не найден или имеет неверный формат' },
        { status: 400 }
      );
    }
    file = maybeFile;
  } catch (err) {
    console.error('Ошибка при чтении formData:', err);
    return NextResponse.json(
      { error: 'Невозможно обработать форму' },
      { status: 400 }
    );
  }

  // Конвертируем файл в base64 dataURL
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = file.type || 'image/jpeg';
  const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`;

  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Together API ключ не настроен' },
      { status: 500 }
    );
  }

  const together = new Together({ apiKey });

  const systemPrompt = `Верни ТОЛЬКО валидный JSON.
Никакого текста, markdown, комментариев.

Если растение не распознано или растений в кадре много что мешает распознаванию какого-то определённого, верни plantFound: false, в reason верни строку с причиной ошибки распознавания.

Формат СТРОГО:
{
  "plantFound": boolean,
  "plantName": string | null,
  "healthCondition": string | null,
  "recommendations": string[],
  "reason": string | null
}

Язык: русский.`;

  try {
    const response = await together.chat.completions.create({
      model: 'mistralai/Ministral-3-14B-Instruct-2512',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Определи растение, его состояние здоровья и дай краткие, но полезные рекомендации по уходу.',
            },
            {
              type: 'image_url',
              image_url: {
                url: dataUrl,
              },
            },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 600,
    });

    const text = response.choices?.[0]?.message?.content || '';
    let parsed = JSON_EXTRACTOR(text);

    if (!parsed) {
      const retryResponse = await together.chat.completions.create({
        model: 'Qwen/Qwen3-VL-32B-Instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Определи растение, его состояние здоровья и дай краткие, но полезные рекомендации по уходу.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                },
              },
            ],
          },
        ],
        temperature: 0,
        max_tokens: 600,
      });

      const retryText = retryResponse.choices?.[0]?.message?.content || '';
      const retryParsed = JSON_EXTRACTOR(retryText);

      if (retryParsed) {
        parsed = retryParsed;
      } else {
        console.warn(
          'Невалидный ответ модели после повторного запроса:',
          retryText
        );
        return NextResponse.json(
          { error: 'Не удалось распознать ответ модели' },
          { status: 500 }
        );
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      console.warn('Невалидный ответ модели:', text);
      return NextResponse.json(
        { error: 'Не удалось распознать ответ модели' },
        { status: 500 }
      );
    }

    if (!Array.isArray(parsed.recommendations)) {
      parsed.recommendations = [];
    }

    const plantFound = Boolean(parsed.plantFound);

    // Проверка лимита бесплатных сканов
    const sub = await prisma.subscription.findUnique({ where: { userId } });

    const hasActive =
      sub &&
      sub.status === 'active' &&
      (!sub.currentPeriodEnd || sub.currentPeriodEnd > new Date());

    if (!hasActive && plantFound) {
      const count = await prisma.scan.count({
        where: { userId, plantFound: true },
      });

      if (count >= 10) {
        return NextResponse.json(
          {
            error:
              'Достигнут лимит 10 бесплатных сканов с растением. Оформите подписку, чтобы продолжить.',
          },
          { status: 402 }
        );
      }
    }

    // Сохраняем скан
    const scan = await prisma.scan.create({
      data: {
        userId,
        imageUrl: dataUrl,
        result: parsed,
        plantFound,
      },
    });

    return NextResponse.json({
      id: scan.id,
      plantFound,
      result: parsed,
    });
  } catch (e: any) {
    console.error('Ошибка анализа:', e);
    return NextResponse.json(
      { error: e?.response?.data || e?.message || 'Ошибка анализа' },
      { status: 500 }
    );
  }
}
