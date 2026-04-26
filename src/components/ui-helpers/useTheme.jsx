import { useState, useEffect } from 'react';

export function useTheme() {
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem('cc-theme') === 'dark'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('cc-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return { isDark, toggle: () => setIsDark(d => !d) };
}
