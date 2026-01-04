'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AppLayout } from '@/components/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { is } from 'date-fns/locale';

export function BillingClient() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [changingCard, setChangingCard] = useState(false);
  const [unbindingCard, setUnbindingCard] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoInfo, setPromoInfo] = useState<{
    valid: boolean;
    discountPercent?: number;
    finalPrice?: number;
    error?: string;
  } | null>(null);

  useEffect(() => {
    loadBillingData();
  }, []);

  useEffect(() => {
    console.log('subscription from api:', subscription);
  }, [subscription]);

  async function loadBillingData() {
    try {
      const res = await fetch('/api/billing/status');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setSubscription(data.subscription);
      setPayments(data.payments || []);
    } catch (error) {
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }

  async function handleChangeCard() {
    setChangingCard(true);
    try {
      const res = await fetch('/api/billing/change-card', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      if (data.url) window.location.href = data.url;
    } catch (error: any) {
      toast.error(error.message || 'Не удалось изменить карту');
    } finally {
      setChangingCard(false);
    }
  }

  async function handleCancelSubscription() {
    setCancelling(true);
    try {
      const res = await fetch('/api/billing/cancel', { method: 'POST' });
      if (!res.ok) throw new Error('Ошибка отмены');
      toast.success(
        'Подписка отменена. Доступ сохранится до конца оплаченного периода.'
      );
      await loadBillingData();
    } catch (error) {
      toast.error('Не удалось отменить подписку');
    } finally {
      setCancelling(false);
    }
  }

  async function handleUnbindCard() {
    setUnbindingCard(true);
    try {
      const res = await fetch('/api/billing/unbind-card', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      toast.success('Карта отвязана. Автопродление отключено.');
      await loadBillingData();
    } catch (error: any) {
      toast.error(error.message || 'Не удалось отвязать карту');
    } finally {
      setUnbindingCard(false);
    }
  }

  const validatePromoCode = useCallback(async (code: string) => {
    if (!code.trim()) {
      setPromoInfo(null);
      return;
    }

    setPromoValidating(true);
    try {
      const res = await fetch('/api/billing/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promoCode: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      setPromoInfo(data);
      if (data.valid) {
        toast.success(`Промокод применен! Скидка ${data.discountPercent}%`);
      } else {
        toast.error(data.error || 'Неверный промокод');
      }
    } catch (error) {
      setPromoInfo({ valid: false, error: 'Ошибка проверки промокода' });
      toast.error('Ошибка проверки промокода');
    } finally {
      setPromoValidating(false);
    }
  }, []);

  // Проверяем промокод из URL при загрузке
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const promoFromUrl = params.get('promo');
    if (promoFromUrl && !promoInfo) {
      setPromoCode(promoFromUrl.toUpperCase());
      validatePromoCode(promoFromUrl);
    }
  }, [validatePromoCode, promoInfo]);

  const handleApplyPromo = () => {
    if (promoCode.trim()) {
      validatePromoCode(promoCode);
    }
  };

  const handleClearPromo = () => {
    setPromoCode('');
    setPromoInfo(null);
  };

  async function handleSubscribe() {
    try {
      const res = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promoCode: promoCode.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      if (data.url) window.location.href = data.url;
      if (data.free) {
        toast.success('Подписка активирована!');
        await loadBillingData();
      }
    } catch (error: any) {
      toast.error(error.message || 'Не удалось оформить подписку');
    }
  }

  const subscriptionStatusUI: Record<
    string,
    { label: string; variant: any; icon: any }
  > = {
    active: {
      label: 'Активна',
      variant: 'default',
      icon: CheckCircle2,
    },
    past_due: {
      label: 'Проблемы с оплатой',
      variant: 'destructive',
      icon: XCircle,
    },
    canceled: {
      label: 'Неактивна',
      variant: 'secondary',
      icon: XCircle,
    },
  };

  // Проверяем период подписки
  const now = new Date();
  const periodValid = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd) > now
    : false;

  // Для UI: подписка активна только если статус 'active' И период не истек
  const isActive = subscription?.status === 'active' && periodValid;

  // Отмененная подписка с действующим периодом
  const isCanceledWithAccess =
    subscription?.status === 'canceled' && periodValid;

  const hasSavedCard = !!subscription?.hasSavedCard;

  return (
    <AppLayout>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl xl:max-w-5xl 2xl:max-w-6xl'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold'>Управление подпиской</h1>
          <p className='text-muted-foreground mt-2'>
            Просмотрите и управляйте вашей подпиской и платежами
          </p>
        </div>

        {loading ? (
          <div className='flex items-center justify-center py-12'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : (
          <div className='space-y-6'>
            {/* Subscription Status */}
            <Card>
              <CardHeader>
                <CardTitle>Подписка</CardTitle>
                <CardDescription>Текущий статус вашей подписки</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                  <div>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span className='font-medium'>Статус:</span>
                      {subscription?.status && (
                        <>
                          {isCanceledWithAccess ? (
                            <Badge variant='secondary' className='gap-1'>
                              <XCircle className='h-3 w-3' />
                              Отменена (действует до конца периода)
                            </Badge>
                          ) : subscriptionStatusUI[subscription.status] ? (
                            <Badge
                              variant={
                                subscriptionStatusUI[subscription.status]
                                  .variant
                              }
                              className='gap-1'
                            >
                              {(() => {
                                const Icon =
                                  subscriptionStatusUI[subscription.status]
                                    .icon;
                                return <Icon className='h-3 w-3' />;
                              })()}
                              {subscriptionStatusUI[subscription.status].label}
                            </Badge>
                          ) : null}
                        </>
                      )}
                      {subscription && !subscription.status && (
                        <Badge variant='secondary'>Статус неизвестен</Badge>
                      )}
                    </div>
                    {subscription?.currentPeriodEnd && periodValid && (
                      <p className='text-sm text-muted-foreground mt-1'>
                        Действует до:{' '}
                        {format(
                          new Date(subscription.currentPeriodEnd),
                          'd MMMM yyyy',
                          { locale: ru }
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {!isActive && (
                  <div className='pt-4 space-y-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='promo-code'>
                        Промокод (необязательно)
                      </Label>
                      <div className='flex gap-2'>
                        <Input
                          id='promo-code'
                          placeholder='Введите промокод'
                          value={promoCode}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase();
                            setPromoCode(value);
                            // Сбрасываем результат валидации при изменении
                            if (promoInfo) setPromoInfo(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && promoCode.trim()) {
                              e.preventDefault();
                              handleApplyPromo();
                            }
                          }}
                          disabled={
                            promoValidating || (promoInfo?.valid ?? false)
                          }
                          className='flex-1'
                        />
                        {promoInfo?.valid ? (
                          <Button
                            variant='outline'
                            onClick={handleClearPromo}
                            type='button'
                          >
                            Убрать
                          </Button>
                        ) : (
                          <Button
                            variant='secondary'
                            onClick={handleApplyPromo}
                            disabled={promoValidating || !promoCode.trim()}
                            type='button'
                          >
                            {promoValidating ? 'Проверка...' : 'Применить'}
                          </Button>
                        )}
                      </div>
                      {promoValidating && (
                        <p className='text-sm text-muted-foreground'>
                          Проверка промокода...
                        </p>
                      )}
                      {promoInfo && promoInfo.valid && (
                        <div className='text-sm text-green-600 dark:text-green-400'>
                          ✓ Промокод применен! Скидка{' '}
                          {promoInfo.discountPercent}%
                          {promoInfo.finalPrice !== undefined && (
                            <span className='block mt-1'>
                              Итоговая цена:{' '}
                              {(promoInfo.finalPrice / 100).toFixed(2)} ₽
                            </span>
                          )}
                        </div>
                      )}
                      {promoInfo && !promoInfo.valid && (
                        <p className='text-sm text-destructive'>
                          {promoInfo.error || 'Неверный промокод'}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={handleSubscribe}
                      className='w-full sm:w-auto'
                      disabled={promoValidating}
                    >
                      {promoInfo?.valid && promoInfo.finalPrice === 0
                        ? 'Активировать подписку бесплатно'
                        : promoInfo?.valid && promoInfo.finalPrice !== undefined
                          ? `Оформить подписку за ${(promoInfo.finalPrice / 100).toFixed(2)} ₽/мес`
                          : 'Оформить подписку за 99 ₽/мес'}
                    </Button>
                  </div>
                )}

                {isActive && (
                  <div className='flex flex-col sm:flex-row gap-3 pt-4'>
                    <Button
                      variant='outline'
                      onClick={handleChangeCard}
                      disabled={changingCard}
                      className='gap-2'
                    >
                      <CreditCard className='h-4 w-4' />
                      {changingCard ? 'Загрузка...' : 'Изменить карту'}
                    </Button>

                    {isActive && hasSavedCard && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant='outline'
                            disabled={unbindingCard}
                            className='gap-2'
                          >
                            <CreditCard className='h-4 w-4' />
                            {unbindingCard ? 'Загрузка...' : 'Отвязать карту'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Отвязать карту?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Мы отключим сохраненный способ оплаты в YooKassa.
                              Автопродление подписки будет выключено, но доступ
                              сохранится до конца оплаченного периода.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleUnbindCard}
                              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                            >
                              Отвязать карту
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant='destructive' disabled={cancelling}>
                          Отменить подписку
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Отменить подписку?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Вы уверены, что хотите отменить подписку? Вы
                            сохраните доступ до конца текущего периода оплаты.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleCancelSubscription}
                            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                          >
                            Отменить подписку
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle>История платежей</CardTitle>
                <CardDescription>Последние платежи</CardDescription>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <p className='text-muted-foreground text-center py-4'>
                    Платежей пока нет
                  </p>
                ) : (
                  <div className='space-y-3'>
                    {payments.map((payment) => (
                      <div
                        key={payment.id}
                        className='flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between'
                      >
                        <div className='min-w-0'>
                          <div className='font-medium'>
                            {(payment.amount / 100).toFixed(2)}{' '}
                            {payment.currency}
                          </div>
                          <div className='text-sm text-muted-foreground break-words'>
                            {format(
                              new Date(payment.createdAt),
                              'd MMMM yyyy, HH:mm',
                              { locale: ru }
                            )}
                          </div>
                        </div>
                        <div className='flex justify-start sm:justify-end'>
                          <Badge
                            variant={
                              payment.status === 'succeeded'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {payment.status === 'succeeded'
                              ? 'Оплачено'
                              : payment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
