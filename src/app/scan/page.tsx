'use client';

import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/AppLayout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SubscribeDialog } from '@/components/SubscribeDialog';
import { Camera, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

function classNames(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

export default function ScanPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [loginOpen, setLoginOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);

  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      setLoginOpen(true);
    }
  }, [status]);

  // Проверяем подписку при загрузке
  useEffect(() => {
    if (status === 'authenticated') {
      checkSubscriptionStatus();
    }
  }, [status]);

  // Проверяем intent из URL при загрузке страницы
  useEffect(() => {
    const intent = searchParams.get('intent');
    
    if (intent === 'premium' && status === 'authenticated' && hasSubscription === false) {
      setSubscribeOpen(true);
    }
  }, [status, hasSubscription, searchParams]);

  async function checkSubscriptionStatus() {
    try {
      const res = await fetch('/api/billing/status');
      if (res.ok) {
        const data = await res.json();
        const sub = data.subscription;
        const now = new Date();
        const periodValid = sub?.currentPeriodEnd 
          ? new Date(sub.currentPeriodEnd) > now 
          : false;
        const active = sub?.status === 'active' && periodValid 
          || (sub?.status === 'canceled' && periodValid);
        setHasSubscription(active);
      }
    } catch (error) {
      setHasSubscription(false);
    }
  }

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }, [file]);

  async function handleCredentialsLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    if (username.trim().length < 3) {
      setAuthError('Минимум 3 символа в псевдониме');
      return;
    }
    if (password.length < 6) {
      setAuthError('Минимум 6 символов в пароле');
      return;
    }
    const res = await signIn('credentials', {
      username: username.trim(),
      password,
      redirect: false,
    });
    if (res?.error) {
      setAuthError('Ошибка входа. Проверьте данные и попробуйте снова.');
    } else {
      setLoginOpen(false);
      setUsername('');
      setPassword('');
    }
  }

  async function startScan() {
    if (!file) {
      setUploadError('Сначала выберите изображение');
      return;
    }
    if (scanning) return;
    setUploadError(null);
    setScanning(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/analyze', { method: 'POST', body: fd });
      if (r.status === 401) {
        setScanning(false);
        setUploadError(
          'Чтобы сканировать растения, необходимо войти в аккаунт'
        );
        setLoginOpen(true);
        return;
      }
      if (r.status === 402) {
        setScanning(false);
        setSubscribeOpen(true);
        return;
      }
      if (!r.ok) {
        setScanning(false);
        const error = await r.json().catch(() => ({ error: 'Ошибка сервера' }));
        setUploadError(error.error || 'Ошибка сервера. Попробуйте позже.');
        toast.error(error.error || 'Ошибка сервера');
        return;
      }

      const data = await r.json();

      if (!data?.id) {
        setScanning(false);
        setUploadError('Ответ сервера некорректен');
        return;
      }

      window.location.href = `/scan/${data.id}`;
    } catch (e: any) {
      console.error('ANALYZE ERROR:', e);
      setScanning(false);
      setUploadError('Не удалось выполнить сканирование. Попробуйте снова.');
      toast.error('Не удалось выполнить сканирование');
    }
  }

  async function createCheckout() {
    try {
      setSubscribeOpen(false);
      window.location.href = '/billing';
    } catch (e: any) {
      console.error('CHECKOUT ERROR:', e);
      toast.error('Не удалось перейти к оплате');
    }
  }

  function handleFileSelect(file: File | null) {
    if (file && file.type.startsWith('image/')) {
      setFile(file);
      setUploadError(null);
    } else {
      setUploadError('Пожалуйста, выберите изображение');
    }
  }

  return (
    <TooltipProvider>
      <AppLayout>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl'>
          <div className='text-center mb-8'>
            <h1 className='text-3xl font-bold mb-2'>Сканирование растения</h1>
            <p className='text-muted-foreground'>
              Загрузите фотографию растения для анализа
            </p>
          </div>

          {/* Upload area */}
          <div className='relative w-full'>
            <div
              className={classNames(
                'rounded-2xl border-2 border-dashed border-primary/50 bg-muted/30 text-center w-full',
                'p-8 sm:p-12 transition-colors hover:border-primary/80 hover:bg-muted/50',
                'cursor-pointer',
                uploadError ? 'border-destructive' : '',
                scanning && 'pointer-events-none opacity-90'
              )}
              onClick={() => {
                if (!scanning) inputRef.current?.click();
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('border-primary');
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('border-primary');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-primary');
                const f = e.dataTransfer.files?.[0];
                if (f) handleFileSelect(f);
              }}
            >
              {!preview ? (
                <div className='space-y-4'>
                  <div className='mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center'>
                    <Upload className='h-12 w-12 text-primary' />
                  </div>
                  <div>
                    <p className='text-lg font-medium mb-2'>
                      Нажмите или перетащите изображение
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      Поддерживаются форматы: JPG, PNG, WebP
                    </p>
                  </div>
                  <div className='flex flex-col sm:flex-row gap-3 justify-center mt-6'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={(e) => {
                        e.stopPropagation();
                        inputRef.current?.click();
                      }}
                      className='gap-2'
                    >
                      <Upload className='h-4 w-4' />
                      Выбрать файл
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={(e) => {
                        e.stopPropagation();
                        cameraRef.current?.click();
                      }}
                      className='gap-2'
                    >
                      <Camera className='h-4 w-4' />
                      Сфотографировать
                    </Button>
                  </div>
                </div>
              ) : (
                <div className='relative flex items-center justify-center overflow-hidden rounded-xl bg-background'>
                  <img
                    src={preview}
                    alt='Предпросмотр'
                    className='max-w-full max-h-[60vh] object-contain'
                  />

                  {/* Scanning overlay */}
                  {scanning && (
                    <div className='absolute inset-0 z-10 pointer-events-none'>
                      <div className='absolute inset-0 bg-black/40 backdrop-blur-[1px]' />
                      <div
                        className='absolute inset-0 opacity-30'
                        style={{
                          backgroundImage:
                            'linear-gradient(rgba(0,255,120,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,120,0.15) 1px, transparent 1px)',
                          backgroundSize: '40px 40px',
                        }}
                      />
                      <div className='absolute left-0 right-0 h-[2px] bg-green-400 shadow-[0_0_20px_rgba(0,255,120,0.9)] animate-scanline' />
                      <div className='absolute bottom-4 left-4 text-green-400 text-xs tracking-widest font-mono'>
                        СКАНИРОВАНИЕ...
                      </div>
                    </div>
                  )}

                  {/* Remove button */}
                  {!scanning && (
                    <Button
                      variant='destructive'
                      size='icon'
                      className='absolute top-4 right-4 z-20'
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setUploadError(null);
                      }}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Error message */}
            {uploadError && (
              <div className='mt-4'>
                <div className='w-full text-center text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2'>
                  {uploadError}
                </div>
              </div>
            )}

            {/* Action buttons */}
            {preview && !scanning && (
              <div className='mt-6 flex justify-center'>
                <Button
                  onClick={startScan}
                  size='lg'
                  className='gap-2 min-w-[200px]'
                >
                  {scanning ? (
                    <>
                      <div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                      Сканирование…
                    </>
                  ) : (
                    <>
                      <Camera className='h-5 w-5' />
                      Сканировать растение
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Hidden file inputs */}
          <input
            ref={inputRef}
            type='file'
            accept='image/*'
            className='hidden'
            onChange={(e) => {
              handleFileSelect(e.target.files?.[0] || null);
            }}
          />
          <input
            ref={cameraRef}
            type='file'
            accept='image/*'
            capture='environment'
            className='hidden'
            onChange={(e) => {
              handleFileSelect(e.target.files?.[0] || null);
            }}
          />
        </div>

        {/* Login dialog */}
        <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>Вход или регистрация</DialogTitle>
            </DialogHeader>
            <div className='space-y-3'>
              <Button
                variant='secondary'
                onClick={() => signIn('google')}
                className='w-full flex items-center justify-center gap-2'
              >
                <img src='/google-logo.png' alt='Google' className='h-5 w-5' />
                Войти через Google
              </Button>
              <div className='h-px bg-border my-2' />
              <form onSubmit={handleCredentialsLogin} className='space-y-3'>
                <div className='space-y-1'>
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
                <div className='space-y-1'>
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
                <DialogFooter>
                  <Button type='submit' className='w-full'>
                    Войти
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        <SubscribeDialog
          open={subscribeOpen}
          onOpenChange={setSubscribeOpen}
          onSubscribe={createCheckout}
        />
      </AppLayout>
    </TooltipProvider>
  );
}
