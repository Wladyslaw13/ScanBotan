'use client';

import { useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/AppLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      const intent = searchParams.get('intent');
      const promo = searchParams.get('promo');
      
      if (intent === 'premium') {
        const promoParam = promo ? `?promo=${encodeURIComponent(promo)}` : '';
        router.push(`/billing${promoParam}`);
      } else {
        router.push('/scan');
      }
    }
  }, [status, router, searchParams]);

  async function handleCredentialsLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);
    
    if (username.trim().length < 3) {
      setAuthError('Минимум 3 символа в псевдониме');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setAuthError('Минимум 6 символов в пароле');
      setLoading(false);
      return;
    }
    
    const res = await signIn('credentials', {
      username: username.trim(),
      password,
      redirect: false,
      callbackUrl: window.location.href, // Сохраняем текущий URL с параметрами
    });
    
    if (res?.error) {
      setAuthError('Ошибка входа. Проверьте данные и попробуйте снова.');
    } else if (res?.ok) {
      // Редирект обработается в useEffect при изменении status
      const intent = searchParams.get('intent');
      const promo = searchParams.get('promo');
      
      if (intent === 'premium') {
        const promoParam = promo ? `?promo=${encodeURIComponent(promo)}` : '';
        router.push(`/billing${promoParam}`);
      } else {
        router.push('/scan');
      }
    }
    
    setLoading(false);
  }

  if (status === 'loading') {
    return (
      <AppLayout>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center min-h-[60vh]'>
          <div className='text-center'>Загрузка...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center min-h-[60vh]'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>Вход или регистрация</CardTitle>
            <CardDescription>
              Войдите в аккаунт для использования всех функций
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <Button
                variant='secondary'
                onClick={() => signIn('google')}
                className='w-full flex items-center justify-center gap-2'
              >
                <img src='/google-logo.png' alt='Google' className='h-5 w-5' />
                Войти через Google
              </Button>
              <div className='relative'>
                <div className='absolute inset-0 flex items-center'>
                  <span className='w-full border-t' />
                </div>
                <div className='relative flex justify-center text-xs uppercase'>
                  <span className='bg-card px-2 text-muted-foreground'>
                    Или
                  </span>
                </div>
              </div>
              <form onSubmit={handleCredentialsLogin} className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='username'>Псевдоним</Label>
                  <Input
                    id='username'
                    placeholder='Например, botanist123'
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    minLength={3}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='password'>Пароль</Label>
                  <Input
                    id='password'
                    type='password'
                    placeholder='Минимум 6 символов'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                {authError && (
                  <p className='text-destructive text-sm'>{authError}</p>
                )}
                <Button type='submit' className='w-full' disabled={loading}>
                  {loading ? 'Вход...' : 'Войти'}
                </Button>
                <p className='text-xs text-center text-muted-foreground'>
                  Если аккаунта нет, он будет создан автоматически
                </p>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

