'use client';

import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { Camera, CheckCircle2, MapPin, Download, Heart } from 'lucide-react';

export default function MarketingPage() {
  return (
    <AppLayout>
      {/* Hero Section */}
      <section className='relative overflow-hidden border-b bg-gradient-to-b from-background to-muted/20 py-20'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='mx-auto max-w-3xl text-center'>
            <h1 className='text-4xl font-bold tracking-tight sm:text-6xl'>
              Узнайте всё о ваших растениях
            </h1>
            <p className='mt-6 text-lg leading-8 text-muted-foreground'>
              Просто сфотографируйте растение — и получите мгновенную информацию
              о его виде, состоянии здоровья и рекомендации по уходу
            </p>
            <div className='mt-10 flex items-center justify-center gap-x-6'>
              <Link href='/auth/login?intent=scan'>
                <Button size='lg' className='gap-2'>
                  <Camera className='h-5 w-5' />
                  Начать сканирование
                </Button>
              </Link>
              <Link href='#features'>
                <Button variant='outline' size='lg'>
                  Узнать больше
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id='features' className='py-20'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='mx-auto max-w-2xl text-center'>
            <h2 className='text-3xl font-bold tracking-tight sm:text-4xl'>
              Возможности сервиса
            </h2>
            <p className='mt-4 text-lg text-muted-foreground'>
              Всё, что нужно для ухода за растениями
            </p>
          </div>
          <div className='mx-auto mt-16 max-w-5xl'>
            <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-3'>
              <Card>
                <CardHeader>
                  <Camera className='mb-4 h-10 w-10 text-primary' />
                  <CardTitle>Быстрое распознавание</CardTitle>
                  <CardDescription>
                    Определение вида растения за секунды с помощью
                    искусственного интеллекта
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Heart className='mb-4 h-10 w-10 text-primary' />
                  <CardTitle>Анализ здоровья</CardTitle>
                  <CardDescription>
                    Оценка состояния растения и выявление возможных проблем
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <MapPin className='mb-4 h-10 w-10 text-primary' />
                  <CardTitle>Место происхождения</CardTitle>
                  <CardDescription>
                    Информация о естественной среде обитания растения
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CheckCircle2 className='mb-4 h-10 w-10 text-primary' />
                  <CardTitle>Персональные рекомендации</CardTitle>
                  <CardDescription>
                    Индивидуальные советы по уходу для каждого растения
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Download className='mb-4 h-10 w-10 text-primary' />
                  <CardTitle>Экспорт результатов</CardTitle>
                  <CardDescription>
                    Скачивание детальных отчетов в формате PDF
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Heart className='mb-4 h-10 w-10 text-primary' />
                  <CardTitle>История и избранное</CardTitle>
                  <CardDescription>
                    Сохранение всех сканирований и возможность отметить важные
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Example Results Section */}
      <section className='border-t bg-muted/50 py-20'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='mx-auto max-w-2xl text-center'>
            <h2 className='text-3xl font-bold tracking-tight sm:text-4xl'>
              Примеры результатов
            </h2>
            <p className='mt-4 text-lg text-muted-foreground'>
              Что вы получите после сканирования
            </p>
          </div>
          <div className='mx-auto mt-16 max-w-4xl'>
            <div className='space-y-8'>
              <Card>
                <CardHeader>
                  <CardTitle>Определение вида растения</CardTitle>
                  <CardDescription>
                    Точное название растения на русском языке
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='rounded-lg border bg-background p-4'>
                    <p className='font-medium'>
                      Фикус Бенджамина (Ficus benjamina)
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Оценка состояния здоровья</CardTitle>
                  <CardDescription>
                    Детальный анализ текущего состояния растения
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='rounded-lg border bg-background p-4'>
                    <p className='font-medium mb-2'>Состояние: Хорошее</p>
                    <p className='text-sm text-muted-foreground'>
                      Растение выглядит здоровым. Листья имеют естественный
                      зеленый цвет, нет признаков вредителей или заболеваний.
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Место происхождения</CardTitle>
                  <CardDescription>
                    Информация о естественной среде обитания растения
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='rounded-lg border bg-background p-4'>
                    <p className='font-medium'>Родина: Океания</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Рекомендации по уходу</CardTitle>
                  <CardDescription>
                    Персональные советы для оптимального ухода
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    <div className='rounded-lg border bg-background p-4'>
                      <ul className='list-disc list-inside space-y-1 text-sm'>
                        <li>Полив: умеренный, 1-2 раза в неделю</li>
                        <li>Освещение: яркий рассеянный свет</li>
                        <li>Температура: 18-24°C</li>
                        <li>Подкормка: раз в месяц в период роста</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className='py-20'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='mx-auto max-w-2xl text-center'>
            <h2 className='text-3xl font-bold tracking-tight sm:text-4xl'>
              Тарифы
            </h2>
            <p className='mt-4 text-lg text-muted-foreground'>
              Начните с бесплатных сканирований
            </p>
          </div>
          <div className='mx-auto mt-16 max-w-4xl'>
            <div className='grid gap-8 sm:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Стартовый</CardTitle>
                  <CardDescription>Для начала работы</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='text-3xl font-bold'>0 ₽</div>
                  <ul className='space-y-2 text-sm'>
                    <li className='flex items-center gap-2'>
                      <CheckCircle2 className='h-4 w-4 text-primary' />
                      <span>10 сканирований</span>
                    </li>
                    <li className='flex items-center gap-2'>
                      <CheckCircle2 className='h-4 w-4 text-primary' />
                      <span>Определение растения</span>
                    </li>
                    <li className='flex items-center gap-2'>
                      <CheckCircle2 className='h-4 w-4 text-primary' />
                      <span>Базовый анализ здоровья</span>
                    </li>
                  </ul>
                  <Link href='/auth/login?intent=scan'>
                    <Button variant='outline' className='w-full'>
                      Начать бесплатно
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              <Card className='border-primary'>
                <CardHeader>
                  <CardTitle>Премиум</CardTitle>
                  <CardDescription>
                    Полный доступ ко всем функциям
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='text-3xl font-bold'>
                    99 ₽
                    <span className='text-base font-normal text-muted-foreground'>
                      /мес
                    </span>
                  </div>
                  <ul className='space-y-2 text-sm'>
                    <li className='flex items-center gap-2'>
                      <CheckCircle2 className='h-4 w-4 text-primary' />
                      <span>Неограниченное количество сканирований</span>
                    </li>
                    <li className='flex items-center gap-2'>
                      <CheckCircle2 className='h-4 w-4 text-primary' />
                      <span>Полная история сканирований</span>
                    </li>
                    <li className='flex items-center gap-2'>
                      <CheckCircle2 className='h-4 w-4 text-primary' />
                      <span>Избранное и закладки</span>
                    </li>
                    <li className='flex items-center gap-2'>
                      <CheckCircle2 className='h-4 w-4 text-primary' />
                      <span>Скачивание PDF отчетов</span>
                    </li>
                    <li className='flex items-center gap-2'>
                      <CheckCircle2 className='h-4 w-4 text-primary' />
                      <span>Приоритетная поддержка</span>
                    </li>
                  </ul>
                  <Link href='/auth/login?intent=premium'>
                    <Button className='w-full'>Оформить подписку</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='border-t bg-primary py-20'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='mx-auto max-w-2xl text-center'>
            <h2 className='text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl'>
              Готовы начать?
            </h2>
            <p className='mt-6 text-lg leading-8 text-primary-foreground/90'>
              СканБотан — всё, что нужно любителю растений
            </p>
            <div className='mt-10 flex items-center justify-center gap-x-6'>
              <Link href='/auth/login?intent=scan'>
                <Button size='lg' variant='secondary' className='gap-2'>
                  <Camera className='h-5 w-5' />
                  Попробовать бесплатно
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
