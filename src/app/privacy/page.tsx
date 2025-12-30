'use client';

import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPage() {
  return (
    <AppLayout>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl'>
        <h1 className='text-3xl font-bold mb-8'>Политика конфиденциальности</h1>

        <div className='prose prose-sm dark:prose-invert max-w-none space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>1. Общие положения</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <p>
                Настоящая Политика конфиденциальности определяет порядок
                обработки и защиты персональных данных пользователей сервиса
                СканБотан (далее — «Сервис»).
              </p>
              <p>
                Используя Сервис, вы соглашаетесь с условиями настоящей Политики
                конфиденциальности.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Собираемая информация</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <p>Мы собираем следующую информацию:</p>
              <ul className='list-disc list-inside space-y-2'>
                <li>
                  Данные для входа: имя пользователя, email (при регистрации
                  через email)
                </li>
                <li>Изображения растений, загруженные вами для сканирования</li>
                <li>Результаты анализа растений</li>
                <li>
                  Информация о платежах и подписках (обрабатывается через
                  платежную систему YooKassa)
                </li>
                <li>
                  Техническая информация: IP-адрес, тип браузера, данные об
                  использовании Сервиса
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Использование информации</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <p>Собранная информация используется для:</p>
              <ul className='list-disc list-inside space-y-2'>
                <li>Предоставления и улучшения функций Сервиса</li>
                <li>Обработки ваших запросов и сканирований</li>
                <li>Обработки платежей и управления подписками</li>
                <li>Связи с вами по вопросам использования Сервиса</li>
                <li>Обеспечения безопасности и предотвращения мошенничества</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Защита данных</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <p>Мы принимаем меры для защиты ваших персональных данных:</p>
              <ul className='list-disc list-inside space-y-2'>
                <li>Использование шифрования для передачи данных</li>
                <li>Безопасное хранение данных в защищенных базах данных</li>
                <li>
                  Ограничение доступа к персональным данным только
                  уполномоченным сотрудникам
                </li>
                <li>Регулярное обновление систем безопасности</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Передача данных третьим лицам</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <p>
                Мы не продаем ваши персональные данные третьим лицам. Данные
                могут передаваться только:
              </p>
              <ul className='list-disc list-inside space-y-2'>
                <li>Платежным системам (YooKassa) для обработки платежей</li>
                <li>Поставщикам услуг для анализа изображений (Together AI)</li>
                <li>По требованию закона или для защиты наших прав</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Ваши права</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <p>Вы имеете право:</p>
              <ul className='list-disc list-inside space-y-2'>
                <li>Получать доступ к своим персональным данным</li>
                <li>Требовать исправления неточных данных</li>
                <li>Требовать удаления ваших данных</li>
                <li>Отказаться от обработки ваших данных</li>
                <li>
                  Для реализации этих прав обратитесь к нам по контактным
                  данным, указанным на странице{' '}
                  <a href='/contact' className='text-primary underline'>
                    Контакты
                  </a>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Хранение данных</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <p>
                Мы храним ваши персональные данные до тех пор, пока это
                необходимо для предоставления Сервиса или до момента удаления
                вашего аккаунта.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Изменения в Политике</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <p>
                Мы можем периодически обновлять настоящую Политику
                конфиденциальности. О существенных изменениях мы уведомим вас
                через Сервис или по email.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Контакты</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <p>
                По вопросам конфиденциальности обращайтесь на{' '}
                <a href='/contact' className='text-primary underline'>
                  страницу контактов
                </a>
                .
              </p>
              <p className='text-sm text-muted-foreground'>
                Дата последнего обновления:{' '}
                {new Date().toLocaleDateString('ru-RU')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
