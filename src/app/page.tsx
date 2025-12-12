'use client';
import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function classNames(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

export default function Home() {
  const { data: session, status } = useSession();
  const [loginOpen, setLoginOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [scanning, setScanning] = useState(false);

  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [scans, setScans] = useState<
    { id: number; createdAt: string; result: any }[]
  >([]);
  const [subscribed, setSubscribed] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      setLoginOpen(true);
    }
  }, [status]);

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

  async function openHistory() {
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const r = await fetch('/api/scans');
      if (r.status === 402) {
        setSubscribed(false);
        setScans([]);
      } else if (r.ok) {
        const data = await r.json();
        setSubscribed(true);
        setScans(data.scans || []);
      } else if (r.status === 401) {
        setHistoryError('Требуется войти в аккаунт');
      } else {
        setHistoryError('Ошибка загрузки истории');
      }
    } catch (e) {
      setHistoryError('Ошибка сети');
    } finally {
      setHistoryLoading(false);
    }
  }

  async function startScan() {
    if (!file) {
      setUploadError('Сначала выберите изображение');
      return;
    }
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
        setUploadError('Ошибка сервера. Попробуйте позже.');
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
    }
  }

  async function createCheckout() {
    try {
      const r = await fetch('/api/billing/create-checkout', { method: 'POST' });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'Не удалось создать оплату');
      if (data.url) window.location.href = data.url;
    } catch (e: any) {
      alert(e?.message || 'Ошибка оплаты');
    }
  }

  return (
    <TooltipProvider>
      <div className='relative min-h-screen flex items-stretch justify-center bg-background'>
        {/* Top actions */}
        <div className='absolute top-4 left-4'>
          {status === 'authenticated' && (
            <Button variant='ghost' onClick={openHistory}>
              История
            </Button>
          )}
        </div>
        <div className='absolute top-4 right-4 flex items-center gap-2'>
          <ThemeToggle />
          {status === 'authenticated' ? (
            <div className='flex items-center gap-2'>
              <span className='text-sm text-foreground/80 truncate max-w-[180px]'>
                {(session?.user as any)?.username ||
                  session?.user?.name ||
                  'Профиль'}
              </span>
              <Button variant='ghost' onClick={() => signOut()}>
                Выйти
              </Button>
            </div>
          ) : (
            <Button onClick={() => setLoginOpen(true)}>Войти в аккаунт</Button>
          )}
        </div>

        {/* Centered content */}
        <main className='w-full max-w-3xl px-4 sm:px-6 py-5 text-center flex flex-col'>
          <div className='flex-1 flex flex-col gap-2'>
            {/* Logo image styled as plant word */}
            <img
              src='/logo.png'
              alt='СканБотан'
              className='mx-auto h-24 w-auto select-none pointer-events-none'
            />

            {/* Upload area */}
            <div className='relative w-full mt-2 cursor-pointer h-[55vh] sm:h-[50vh] max-h-[75vh] min-h-[20rem]'>
              <div
                className={classNames(
                  'rounded-2xl border-2 border-green-500/70 bg-muted text-left w-full mx-auto',
                  'p-3 sm:p-4 pr-10 h-full overflow-hidden',
                  'transition-colors',
                  uploadError ? 'border-destructive' : ''
                )}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) setFile(f);
                }}
              >
                <div className='flex items-start h-full'>
                  <div className='flex-1 h-full'>
                    {!preview ? (
                      <div className='w-full h-full min-h-[16rem] sm:min-h-[18rem] grid place-items-center text-center text-foreground/70'>
                        <div>
                          <img
                            src='/plant.svg'
                            alt='Plant'
                            className='mx-auto h-48 sm:h-64 mb-8 select-none pointer-events-none user-select-none'
                          />
                          <p className='text-sm sm:text-base'>
                            Нажмите или перетащите изображение растения для
                            сканирования
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className='relative flex items-center justify-center overflow-hidden rounded-xl bg-background h-full'>
                        <img
                          src={preview}
                          alt='Предпросмотр'
                          className='max-w-full max-h-full object-contain'
                        />
                      </div>
                    )}
                  </div>
                </div>
                {/* uploadError moved below so it doesn't interfere with click area */}
              </div>

              {/* Error message — positioned under upload area, above action buttons */}
              {uploadError && (
                <div className='mt-3'>
                  <div className='w-full text-center text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2'>
                    {uploadError}
                  </div>
                </div>
              )}

              <div className='mt-3 flex items-center gap-3'>
                <input
                  ref={inputRef}
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setFile(f);
                    setUploadError(null);
                  }}
                />
                <Button className='flex-1' onClick={startScan}>
                  Сканировать
                </Button>
                {preview && (
                  <Button
                    variant='ghost'
                    onClick={() => {
                      setFile(null);
                      setUploadError(null);
                    }}
                  >
                    Удалить
                  </Button>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Fullscreen loader */}
        {scanning && (
          <div className='fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm'>
            <div className='text-center'>
              <div className='mx-auto mb-4 h-12 w-12 rounded-full border-4 border-green-500 border-t-transparent animate-spin' />
              <p className='text-sm text-foreground/80'>Анализ изображения…</p>
            </div>
          </div>
        )}

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
                className='w-full'
              >
                Google
              </Button>
              <div className='h-px bg-border my-2' />
              <form onSubmit={handleCredentialsLogin} className='space-y-3'>
                <div className='space-y-1'>
                  <Label htmlFor='username'>Псевдоним</Label>
                  <Input
                    id='username'
                    placeholder='Например, botanist123'
                    value={username}
                    onChange={(e: {
                      target: { value: React.SetStateAction<string> };
                    }) => setUsername(e.target.value)}
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
                    onChange={(e: {
                      target: { value: React.SetStateAction<string> };
                    }) => setPassword(e.target.value)}
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

        {/* History dialog */}
        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogContent className='max-w-5xl w-[95vw] h-[85vh]'>
            <DialogHeader>
              <DialogTitle>История сканирований</DialogTitle>
            </DialogHeader>
            <div className='h-full overflow-auto'>
              {historyLoading ? (
                <div className='h-40 grid place-items-center text-foreground/70'>
                  Загрузка…
                </div>
              ) : historyError ? (
                <div className='text-destructive'>{historyError}</div>
              ) : subscribed === false ? (
                <div className='space-y-3'>
                  <p>
                    Подписка не активна. Оформите подписку, чтобы получить
                    доступ к истории и неограниченным сканированиям.
                  </p>
                  <Button
                    onClick={() => {
                      setHistoryOpen(false);
                      setSubscribeOpen(true);
                    }}
                  >
                    Оформить подписку
                  </Button>
                </div>
              ) : (
                <div className='space-y-3'>
                  {scans.length === 0 ? (
                    <p className='text-muted-foreground'>История пуста.</p>
                  ) : (
                    <div className='rounded-lg border'>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Дата</TableHead>
                            <TableHead>Растение</TableHead>
                            <TableHead>Ссылка</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {scans.map((s) => {
                            const name = s.result?.plantName || '—';
                            const date = new Date(s.createdAt).toLocaleString();
                            return (
                              <TableRow key={s.id}>
                                <TableCell>{date}</TableCell>
                                <TableCell>{name}</TableCell>
                                <TableCell>
                                  <a
                                    className='text-primary underline'
                                    href={`/scan/${s.id}`}
                                  >
                                    Открыть
                                  </a>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Subscribe dialog */}
        <Dialog open={subscribeOpen} onOpenChange={setSubscribeOpen}>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>Подписка — 200 ₽/мес</DialogTitle>
            </DialogHeader>
            <p className='text-sm text-foreground/80'>
              Неограниченные сканирования и доступ к истории. Оплата российской
              картой через YooKassa.
            </p>
            <div className='flex gap-2'>
              <Button className='flex-1' onClick={createCheckout}>
                Оформить подписку
              </Button>
              <Button variant='ghost' onClick={() => setSubscribeOpen(false)}>
                Позже
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
