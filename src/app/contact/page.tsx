'use client';

import { AppLayout } from '@/components/AppLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, MessageCircle } from 'lucide-react';

export default function ContactPage() {
  const email = 'neuroperson4@gmail.com';

  return (
    <AppLayout>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl'>
        <div className='mb-8 text-center'>
          <h1 className='text-3xl font-bold mb-2'>Свяжитесь с нами</h1>
          <p className='text-muted-foreground'>
            Мы всегда рады помочь и ответить на ваши вопросы
          </p>
        </div>

        <div className='grid gap-6 md:grid-cols-2'>
          <Card>
            <CardHeader>
              <Mail className='mb-4 h-10 w-10 text-primary' />
              <CardTitle>Email</CardTitle>
              <CardDescription>
                Напишите нам на почту, и мы ответим в ближайшее время
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <a
                  href={`mailto:${email}`}
                  className='block text-lg font-medium text-primary hover:underline'
                >
                  {email}
                </a>
                <a href={`mailto:${email}`}>
                  <Button className='w-full gap-2'>
                    <Mail className='h-4 w-4' />
                    Написать письмо
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MessageCircle className='mb-4 h-10 w-10 text-primary' />
              <CardTitle>Поддержка</CardTitle>
              <CardDescription>
                Время ответа обычно составляет 24-48 часов
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <p className='text-sm text-muted-foreground'>
                  Если у вас возникли вопросы о работе сервиса, проблемах с
                  оплатой или вы хотите сообщить об ошибке, пожалуйста,
                  свяжитесь с нами.
                </p>
                <p className='text-sm text-muted-foreground'>
                  Мы постараемся помочь вам как можно быстрее.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className='mt-6'>
          <CardHeader>
            <CardTitle>Часто задаваемые вопросы</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <h3 className='font-medium mb-1'>
                Как работает сканирование растений?
              </h3>
              <p className='text-sm text-muted-foreground'>
                Просто загрузите фотографию растения через наш интерфейс. Наш
                ИИ-сервис проанализирует изображение и предоставит информацию о
                виде растения, его состоянии и рекомендации по уходу.
              </p>
            </div>
            <div>
              <h3 className='font-medium mb-1'>
                Сколько стоит использование сервиса?
              </h3>
              <p className='text-sm text-muted-foreground'>
                Вы можете бесплатно выполнить 10 сканирований. Для
                неограниченного использования доступна подписка за 99 ₽/месяц.
              </p>
            </div>
            <div>
              <h3 className='font-medium mb-1'>
                Можно ли использовать сервис на мобильных устройствах?
              </h3>
              <p className='text-sm text-muted-foreground'>
                Да, наш сервис полностью адаптирован для мобильных устройств. Вы
                можете фотографировать растения прямо через сайт на вашем
                смартфоне.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
