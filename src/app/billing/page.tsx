import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { BillingClient } from './BillingClient';

export default async function BillingPage() {
  const session = await getServerSession(authOptions as any);
  if (!session?.user?.id) {
    redirect('/');
  }

  return <BillingClient />;
}

