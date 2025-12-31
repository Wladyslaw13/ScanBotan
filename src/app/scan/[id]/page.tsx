import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Session } from 'next-auth';
import { notFound } from 'next/navigation';
import { checkSubscription } from '@/lib/checkSubscription';
import { ScanResultClient } from './ScanResultClient';
import { AppLayout } from '@/components/AppLayout';
import { AspectRatio } from '@/components/ui/aspect-ratio';

export default async function ScanResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = (await getServerSession(
    authOptions as any
  )) as Session | null;

  if (!session?.user?.id) return notFound();

  const userId = Number(session.user.id);
  const { id } = await params;

  const numericId = Number(id);
  if (!Number.isFinite(numericId)) return notFound();

  const hasSubscription = await checkSubscription(userId);

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

  const originContinent: string | null =
    (typeof result?.originContinent === 'string' && result.originContinent) ||
    (typeof result?.origin === 'string' && result.origin) ||
    null;

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
      <AppLayout>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-12'>
          <div className='max-w-2xl mx-auto text-center'>
            <p className='text-destructive text-3xl font-semibold mb-4'>
              Растение не распознано
            </p>
            <p className='text-muted-foreground mb-6'>{reason}</p>
            <Link
              href='/scan'
              className='inline-flex items-center text-primary hover:underline'
            >
              ← Назад к сканированию
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='max-w-5xl mx-auto'>
          <div className='mb-6'>
            <Link
              href='/scan'
              className='text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1'
            >
              ← Назад к сканированию
            </Link>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='rounded-xl border border-green-400/50 bg-muted/40 p-3 h-full'>
              {/* Mobile: фиксируем высоту через aspect ratio, чтобы блок не схлопывался */}
              <div className='md:hidden'>
                <AspectRatio
                  ratio={4 / 3}
                  className='relative rounded-lg overflow-hidden bg-muted'
                >
                  <Image
                    src={scan.imageUrl}
                    alt='Загруженное растение'
                    fill
                    className='object-cover'
                    sizes='100vw'
                  />
                </AspectRatio>
              </div>

              {/* Desktop/tablet: тянем фото по высоте строки grid */}
              <div className='hidden md:block h-full'>
                <div className='relative rounded-lg overflow-hidden bg-muted h-full min-h-105'>
                  <Image
                    src={scan.imageUrl}
                    alt='Загруженное растение'
                    fill
                    className='object-cover'
                    sizes='(min-width: 768px) 50vw, 100vw'
                  />
                </div>
              </div>
            </div>

            <div className='space-y-4'>
              <div className='rounded-xl border p-4'>
                <h2 className='text-lg font-semibold mb-2'>
                  Название растения
                </h2>
                <p className='text-foreground/90'>
                  {capitalize(plantName) || 'Неизвестно'}
                </p>
              </div>

              <div className='rounded-xl border p-4'>
                <h2 className='text-lg font-semibold mb-2'>
                  Состояние здоровья
                </h2>
                <p className='text-foreground/90'>
                  {capitalize(healthCondition) || '—'}
                </p>
              </div>

              <div className='rounded-xl border p-4'>
                <h2 className='text-lg font-semibold mb-2'>
                  Место происхождения
                </h2>
                <p className='text-foreground/90'>
                  {originContinent ? capitalize(originContinent) : '—'}
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

          <div className='mt-6 justify-center flex'>
            <ScanResultClient
              scanId={scan.id}
              hasSubscription={hasSubscription}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
