import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Session } from 'next-auth';

export default async function Home() {
  const session = (await getServerSession(
    authOptions as any
  )) as Session | null;

  if (session?.user?.id) {
    redirect('/scan');
  }

  redirect('/marketing');
}
