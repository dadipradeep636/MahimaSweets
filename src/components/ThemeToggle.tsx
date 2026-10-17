'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const sync = () => setDark(document.documentElement.dataset.theme !== 'light');
    sync();
    const storage = (event: StorageEvent) => {
      if (event.key === 'mahima-theme') {
        document.documentElement.dataset.theme = event.newValue === 'light' ? 'light' : 'dark';
        sync();
      }
    };
    window.addEventListener('storage', storage);
    return () => window.removeEventListener('storage', storage);
  }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
    try {
      localStorage.setItem('mahima-theme', next ? 'dark' : 'light');
    } catch {}
  }
  return (
    <button className="theme-toggle" type="button" role="switch" aria-checked={dark} aria-label="Dark theme" title={dark ? 'Switch to light theme' : 'Switch to dark theme'} onClick={toggle}>
      <span className="theme-toggle-knob">{dark ? <Moon size={13} /> : <Sun size={13} />}</span>
    </button>
  );
}
