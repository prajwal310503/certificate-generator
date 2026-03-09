import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../theme/ThemeContext.jsx';

export default function TagInput({ value = [], onChange, placeholder = 'Type and press Enter', error }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  const addTag = (raw) => {
    const tag = raw.trim().replace(/,$/, '').trim();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(inputValue); }
    else if (e.key === 'Backspace' && !inputValue && value.length > 0) onChange(value.slice(0, -1));
  };

  return (
    <div>
      <div
        className={`flex flex-wrap gap-2 p-2.5 min-h-[44px] rounded-xl cursor-text transition-all duration-200 ${
          error
            ? 'focus-within:ring-2 focus-within:ring-red-400/50'
            : 'focus-within:ring-2 focus-within:ring-blue-400/40'
        }`}
        style={{
          background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(235,246,255,0.7)',
          border: error ? '1px solid rgba(239,68,68,0.5)' : `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(147,197,239,0.5)'}`,
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{ background: dark ? 'rgba(59,130,246,0.18)' : 'rgba(37,99,235,0.1)', color: dark ? '#93c5fd' : '#2563eb', border: `1px solid ${dark ? 'rgba(96,165,250,0.3)' : 'rgba(37,99,235,0.2)'}` }}>
            {tag}
            <button type="button" onClick={(e) => { e.stopPropagation(); onChange(value.filter((_, j) => j !== i)); }} className="hover:opacity-70 transition-opacity">
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (inputValue.trim()) addTag(inputValue); }}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm text-slate-800 dark:text-white/90 placeholder-slate-400 dark:placeholder-white/30"
        />
      </div>
      <p className="text-xs text-slate-400 dark:text-white/25 mt-1">Press Enter or comma to add a tag</p>
    </div>
  );
}
