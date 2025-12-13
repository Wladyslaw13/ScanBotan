import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Session } from 'next-auth';
import { notFound } from 'next/navigation';

export default async function ScanResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Получаем сессию и явно приводим тип
  const session = (await getServerSession(
    authOptions as any
  )) as Session | null;

  // Если нет сессии — скрываем ресурс (404)
  if (!session?.user?.id) return notFound();

  const userId = Number(session.user.id);
  const { id } = await params;

  const numericId = Number(id);
  if (!Number.isFinite(numericId)) return notFound();

  // Получаем скан
  const scan = await prisma.scan.findUnique({ where: { id: numericId } });

  // Если скан не найден или не принадлежит текущему пользователю — 404
  if (!scan || scan.userId !== userId) return notFound();

  const result: any = scan.result || {};

  // Поддерживаем оба возможных поля: condition или healthCondition
  const plantFound = !!scan.plantFound;
  const plantName: string | undefined = result?.plantName ?? result?.name;
  const healthCondition: string | undefined =
    result?.condition ?? result?.healthCondition;
  const recommendations: string[] = Array.isArray(result?.recommendations)
    ? result.recommendations
    : [];

  function capitalize(str?: unknown) {
    if (typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  if (!plantFound) {
    const reason =
      typeof result?.reason === 'string'
        ? result.reason
        : 'Выберите фото с одним чётким растением и попробуйте снова.';

    return (
      <div className='min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-900/20'>
        <div className='max-w-2xl p-6 text-center'>
          <p className='text-red-600 dark:text-red-400 text-3xl font-semibold mb-4'>
            Растение не распознано
          </p>
          <p className='text-muted-foreground mb-6'>{reason}</p>
          <Link href='/' className='inline-flex items-center text-primary'>
            ← Назад
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen'>
      <div className='max-w-5xl mx-auto p-6'>
        <div className='mb-6'>
          <Link
            href='/'
            className='text-sm text-foreground/70 hover:text-foreground'
          >
            ← Назад
          </Link>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='rounded-xl border border-green-400/50 bg-muted/40 p-3'>
            <div className='relative rounded-lg overflow-hidden bg-muted h-full'>
              <Image
                src={scan.imageUrl}
                alt='Загруженное растение'
                fill
                className='object-cover'
              />
            </div>
          </div>

          <div className='space-y-4'>
            <div className='rounded-xl border p-4'>
              <h2 className='text-lg font-semibold mb-2'>Название растения</h2>
              <p className='text-foreground/90'>
                {capitalize(plantName) || 'Неизвестно'}
              </p>
            </div>

            <div className='rounded-xl border p-4'>
              <h2 className='text-lg font-semibold mb-2'>Состояние здоровья</h2>
              <p className='text-foreground/90'>
                {capitalize(healthCondition) || '—'}
              </p>
            </div>

            <div className='rounded-xl border p-4'>
              <h2 className='text-lg font-semibold mb-2'>
                Рекомендации по уходу
              </h2>
              <ul className='list-disc pl-5 space-y-1 text-foreground/90'>
                {recommendations.length === 0 ? (
                  <li>Нет рекомендаций</li>
                ) : (
                  recommendations.map((r: string, i: number) => (
                    <li key={i}>{capitalize(r)}</li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
