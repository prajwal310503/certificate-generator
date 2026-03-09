import React, { useEffect, useState, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTheme } from '../theme/ThemeContext.jsx';

const CAL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CAL_DAYS   = ['Mo','Tu','We','Th','Fr','Sa','Su'];

export default function CalendarPicker({ value, onChange, placeholder = 'Pick date', minDate, maxDate, fullWidth = false }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const today = new Date();
  const parsed = value ? new Date(value + 'T00:00:00') : null;
  const [open, setOpen]           = useState(false);
  const [viewYear, setViewYear]   = useState(parsed?.getFullYear() || today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth());
  const ref = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const prevM = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); } else setViewMonth((m) => m - 1); };
  const nextM = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); } else setViewMonth((m) => m + 1); };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const offset      = firstDay === 0 ? 6 : firstDay - 1;
  const cells = Array.from({ length: Math.ceil((offset + daysInMonth) / 7) * 7 }, (_, i) => {
    const d = i - offset + 1;
    return d >= 1 && d <= daysInMonth ? d : null;
  });

  const pad = (n) => String(n).padStart(2, '0');
  const toStr = (d) => `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`;
  const isSelected = (d) => !!d && value === toStr(d);
  const isToday    = (d) => !!d && today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === d;
  const isDisabled = (d) => { if (!d) return true; const s = toStr(d); return (minDate && s < minDate) || (maxDate && s > maxDate); };

  const handleDay = (d) => { if (!d || isDisabled(d)) return; onChange(toStr(d)); setOpen(false); };
  const goToday   = () => {
    const s = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
    if ((!minDate || s >= minDate) && (!maxDate || s <= maxDate)) onChange(s);
    setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); setOpen(false);
  };

  const displayVal = parsed
    ? `${pad(parsed.getDate())} ${CAL_MONTHS[parsed.getMonth()].slice(0,3)} ${parsed.getFullYear()}`
    : null;

  const active = !!value;
  const activeColor = dark ? '#60a5fa' : '#2563eb';

  return (
    <div ref={ref} style={{ position: 'relative', display: fullWidth ? 'block' : 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className={
          fullWidth
            ? 'w-full inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200'
            : 'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-all duration-150 hover:scale-105 whitespace-nowrap'
        }
        style={
          fullWidth
            ? {
                background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(235,246,255,0.7)',
                border: `1px solid ${active ? (dark ? 'rgba(96,165,250,0.5)' : 'rgba(59,130,246,0.5)') : dark ? 'rgba(255,255,255,0.1)' : 'rgba(147,197,239,0.5)'}`,
                color: active ? (dark ? '#f1f5f9' : '#0f172a') : dark ? 'rgba(255,255,255,0.3)' : '#94a3b8',
                boxShadow: active ? `0 0 0 3px ${dark ? 'rgba(96,165,250,0.12)' : 'rgba(59,130,246,0.12)'}` : 'none',
              }
            : {
                background: active ? (dark ? 'rgba(37,99,235,0.2)' : 'rgba(37,99,235,0.1)') : dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.85)',
                border: `1px solid ${active ? (dark ? 'rgba(96,165,250,0.4)' : 'rgba(37,99,235,0.35)') : dark ? 'rgba(255,255,255,0.12)' : 'rgba(186,214,243,0.6)'}`,
                color: active ? activeColor : dark ? 'rgba(255,255,255,0.4)' : '#94a3b8',
                minWidth: '108px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }
        }
      >
        <Calendar
          size={fullWidth ? 14 : 12}
          style={{
            color: fullWidth
              ? (active ? (dark ? '#94a3b8' : '#64748b') : dark ? 'rgba(255,255,255,0.3)' : '#94a3b8')
              : (active ? activeColor : dark ? 'rgba(255,255,255,0.4)' : '#94a3b8'),
            flexShrink: 0,
          }}
        />
        <span className="flex-1 text-left">
          {displayVal || placeholder}
        </span>
        {active && (
          <span onClick={(e) => { e.stopPropagation(); onChange(''); }} style={{ cursor: 'pointer', color: dark ? 'rgba(255,255,255,0.35)' : '#94a3b8', lineHeight: 1 }}>
            <X size={fullWidth ? 13 : 11} />
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute z-50 rounded-2xl p-3"
          style={{
            top: 'calc(100% + 6px)',
            left: 0,
            width: '248px',
            background: dark ? 'rgba(15,23,42,0.97)' : 'rgba(255,255,255,0.99)',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(186,214,243,0.7)'}`,
            boxShadow: '0 12px 40px rgba(37,99,235,0.14), 0 2px 8px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2.5">
            <button type="button" onClick={prevM}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: activeColor }}
              onMouseEnter={(e) => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.08)' : 'rgba(37,99,235,0.06)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-bold" style={{ color: dark ? 'rgba(255,255,255,0.85)' : '#334155' }}>{CAL_MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextM}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: activeColor }}
              onMouseEnter={(e) => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.08)' : 'rgba(37,99,235,0.06)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-1">
            {CAL_DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-bold py-0.5" style={{ color: dark ? 'rgba(255,255,255,0.3)' : '#94a3b8' }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-px">
            {cells.map((d, i) => {
              const sel = isSelected(d);
              const tod = isToday(d);
              const dis = isDisabled(d);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleDay(d)}
                  disabled={!d || dis}
                  className="flex items-center justify-center text-[11px] font-semibold rounded-lg transition-all"
                  style={{
                    height: '30px',
                    color: !d ? 'transparent' : sel ? '#fff' : dis ? (dark ? 'rgba(255,255,255,0.15)' : '#d1d5db') : tod ? activeColor : dark ? 'rgba(255,255,255,0.75)' : '#374151',
                    background: sel ? (dark ? '#3b82f6' : '#2563eb') : tod ? 'rgba(37,99,235,0.12)' : 'transparent',
                    cursor: !d || dis ? 'default' : 'pointer',
                  }}
                  onMouseEnter={(e) => { if (d && !dis && !sel) e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.08)' : 'rgba(37,99,235,0.07)'; }}
                  onMouseLeave={(e) => { if (d && !dis && !sel) e.currentTarget.style.background = tod ? 'rgba(37,99,235,0.12)' : 'transparent'; }}
                >
                  {d || ''}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex justify-between mt-2.5 pt-2.5" style={{ borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(186,214,243,0.35)'}` }}>
            <button type="button" onClick={() => { onChange(''); setOpen(false); }}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
              style={{ color: '#ef4444' }}
              onMouseEnter={(e) => e.currentTarget.style.background = dark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.06)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>Clear</button>
            <button type="button" onClick={goToday}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
              style={{ color: activeColor }}
              onMouseEnter={(e) => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.08)' : 'rgba(37,99,235,0.06)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>Today</button>
          </div>
        </div>
      )}
    </div>
  );
}
