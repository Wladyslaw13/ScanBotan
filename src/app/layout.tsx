import type { Metadata } from 'next';
import './globals.css';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'СканБотан',
  description:
    'Удобный инструмент для сканирования и управления ботаническими данными.',
  openGraph: {
    title: 'СканБотан',
    description:
      'Удобный инструмент для сканирования и управления ботаническими данными.',
    url: 'https://scan-botan-13.vercel.app',
    siteName: 'СканБотан',
    images: [
      {
        url: 'https://scan-botan-13.vercel.app/og.png',
        width: 1200,
        height: 630,
        alt: 'СканБотан — сканирование и управление ботаническими данными',
      },
    ],
    locale: 'ru_RU',
    type: 'website',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang='ru' suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            })();`,
          }}
        />
      </head>
      <body className='antialiased'>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
