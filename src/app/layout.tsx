import type { Metadata } from 'next';
import './globals.css';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Providers from './providers';
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'СканБотан',
  description: 'Ваш Партнёр По Уходу За Растениями',
  openGraph: {
    title: 'СканБотан',
    description: 'Ваш Партнёр По Уходу За Растениями',
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
    <html
      lang='ru'
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
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
