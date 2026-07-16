import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../lib/theme';

// A quiet sun/moon switch. Sits in the shell header; flips the whole app between
// the Calm Clinical light and dark palettes (one [data-theme] attribute).
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { resolved, toggle } = useTheme();
  const dark = resolved === 'dark';
  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={dark ? 'Light theme' : 'Dark theme'}
      className={`shrink-0 grid place-items-center w-11 h-11 rounded-lg text-ink-soft hover:text-ink hover:bg-surface-alt transition-colors focus:outline-none focus-visible:shadow-focus ${className}`}
    >
      {dark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
    </button>
  );
}
