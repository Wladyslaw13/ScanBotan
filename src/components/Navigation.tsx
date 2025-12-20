'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Home, History, CreditCard, Camera, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navigation() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthenticated = status === 'authenticated';

  const navItems = isAuthenticated
    ? [
        { href: '/scan', label: 'Сканирование', icon: Camera },
        { href: '/history', label: 'История', icon: History },
        { href: '/billing', label: 'Управление подпиской', icon: CreditCard },
      ]
    : [{ href: '/marketing', label: 'Главная', icon: Home }];

  return (
    <nav className='sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 items-center justify-between'>
          {/* Logo */}
          <Link
            href={isAuthenticated ? '/scan' : '/marketing'}
            className='flex items-center gap-1'
          >
            <img
              src='/logo.png'
              alt='СканБотан'
              className='h-8 w-auto'
              style={{ transform: 'scale(1.2) translateY(-1.5px)' }}
            />
            <span className='hidden text-xl font-semibold sm:inline-block'>
              СканБотан
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className='hidden items-center gap-1 md:flex'>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className='gap-2'
                  >
                    <Icon className='h-4 w-4' />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Right side - Auth & Theme */}
          <div className='flex items-center gap-2'>
            <ThemeToggle />
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    className='relative h-9 w-9 rounded-full'
                  >
                    <Avatar className='h-9 w-9'>
                      <AvatarFallback>
                        {(session?.user as any)?.username?.[0]?.toUpperCase() ||
                          session?.user?.name?.[0]?.toUpperCase() ||
                          'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-56'>
                  <div className='px-2 py-1.5'>
                    <p className='text-sm font-medium'>
                      {(session?.user as any)?.username ||
                        session?.user?.name ||
                        'Пользователь'}
                    </p>
                    {session?.user?.email && (
                      <p className='text-xs text-muted-foreground'>
                        {session.user.email}
                      </p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href='/history'>История</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href='/billing'>Управление подпиской</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href='/auth/login'>
                <Button size='sm'>Войти</Button>
              </Link>
            )}

            {/* Mobile menu button */}
            <Button
              variant='ghost'
              size='icon'
              className='md:hidden'
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className='h-5 w-5' />
              ) : (
                <Menu className='h-5 w-5' />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className='border-t pb-4 pt-4 md:hidden'>
            <div className='space-y-1'>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className='w-full justify-start gap-2'
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className='h-4 w-4' />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
              {!isAuthenticated && (
                <Link href='/auth/login'>
                  <Button
                    className='mt-2 w-full'
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Войти
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
