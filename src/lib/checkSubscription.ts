import { prisma } from '@/lib/prisma';

export async function checkSubscription(userId: number) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    return false;
  }

  // Подписка считается активной если:
  // 1. Статус 'active' И период не истек, ИЛИ
  // 2. Период еще не истек (даже если статус 'canceled' - отмена только отменяет продление, не текущий доступ)
  const now = new Date();
  const periodValid = subscription.currentPeriodEnd 
    ? subscription.currentPeriodEnd > now 
    : false;

  if (subscription.status === 'active' && periodValid) {
    return true;
  }

  // Если подписка отменена, но период еще не истек - доступ сохраняется
  if (subscription.status === 'canceled' && periodValid) {
    return true;
  }

  return false;
}
