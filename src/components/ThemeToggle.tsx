'use client';
import React, { useEffect, useState } from 'react';

const themes = ['light', 'dark'] as const;
type Theme = (typeof themes)[number];

export default function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      if (savedTheme && themes.includes(savedTheme)) {
        setTheme(savedTheme);
        updateHtmlClass(savedTheme);
      } else {
        setTheme('light');
        removeAllClasses();
      }
    } catch {
      setTheme('light');
      removeAllClasses();
    }
  }, []);

  function updateHtmlClass(newTheme: Theme) {
    const html = document.documentElement;
    html.classList.remove('dark');
    if (newTheme === 'dark') {
      html.classList.add('dark');
    }
  }

  function removeAllClasses() {
    const html = document.documentElement;
    html.classList.remove('dark');
  }

  function handleClick() {
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    updateHtmlClass(nextTheme);
  }

  const classes =
    'flex items-center justify-center w-9 h-9 rounded-md transition-colors text-foreground/90 border-2 border-border bg-transparent hover:bg-muted/20 ' +
    (className || '');

  return (
    <button
      type='button'
      onClick={handleClick}
      aria-label='Переключить тему'
      className={classes}
    >
      {theme === 'dark' ? (
        <img
          src='/sun.svg'
          alt='Солнце'
          className='w-5 h-5 object-contain block'
          width={20}
          height={20}
        />
      ) : (
        <img
          src='/moon.svg'
          alt='Луна'
          className='w-5 h-5 object-contain block'
          width={20}
          height={20}
        />
      )}
    </button>
  );
}
