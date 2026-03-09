import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../theme/ThemeContext.jsx';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="flex items-center gap-0.5 p-1 rounded-xl transition-all duration-200 hover:scale-105"
      style={{
        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)',
        border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(186,214,243,0.6)',
      }}
    >
      <div className={`p-1.5 rounded-lg transition-all duration-200 ${
        !isDark
          ? 'bg-white shadow-sm text-amber-500'
          : 'text-white/30 hover:text-white/50'
      }`}>
        <Sun size={14} />
      </div>
      <div className={`p-1.5 rounded-lg transition-all duration-200 ${
        isDark
          ? 'bg-blue-600/60 text-blue-200 shadow-sm'
          : 'text-slate-400 hover:text-slate-600'
      }`}>
        <Moon size={14} />
      </div>
    </button>
  );
}
