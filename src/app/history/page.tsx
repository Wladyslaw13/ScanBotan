import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { HistoryClient } from './HistoryClient';

export default async function HistoryPage() {
  const session = await getServerSession(authOptions as any);
  const userId = Number((session as any)?.user?.id);

  if (!userId) {
    redirect('/');
  }

  return <HistoryClient />;
}
