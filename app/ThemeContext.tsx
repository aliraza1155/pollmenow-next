'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type ThemeContextType = {
  isDark: boolean;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('pmn-theme');
    if (stored === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else if (stored === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggle = () => {
    setIsDark(prev => {
      const newVal = !prev;
      if (newVal) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('pmn-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('pmn-theme', 'light');
      }
      return newVal;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}