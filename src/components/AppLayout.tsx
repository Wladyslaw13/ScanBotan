'use client';

import { Navigation } from '@/components/Navigation';
import { ReactNode } from 'react';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navigation />
      <main className='flex-1'>{children}</main>
      <footer className='border-t bg-background py-6'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex flex-col items-center justify-between gap-4 md:flex-row'>
            <div className='flex flex-col items-center gap-2 text-sm text-muted-foreground md:flex-row'>
              <span>© 2026 СканБотан. Все права защищены.</span>
            </div>
            <div className='flex gap-4 text-sm'>
              <a
                href='/privacy'
                className='text-muted-foreground hover:text-foreground transition-colors'
              >
                Политика конфиденциальности
              </a>
              <a
                href='/contact'
                className='text-muted-foreground hover:text-foreground transition-colors'
              >
                Контакты
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
