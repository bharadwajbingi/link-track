import { useState, useRef, useEffect } from 'react';
import { ContactStatus } from '../types';
import { Clock, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';

const options: { value: ContactStatus; label: string; icon: typeof Clock; color: string }[] = [
  { value: 'pending', label: 'Pending', icon: Clock, color: 'text-amber-400' },
  { value: 'accepted', label: 'Accepted', icon: CheckCircle2, color: 'text-emerald-400' },
  { value: 'declined', label: 'Declined', icon: XCircle, color: 'text-rose-400' },
  { value: 'no_response', label: 'No Response', icon: MinusCircle, color: 'text-surface-400' },
];

export function StatusDropdown({
  status,
  onChange,
  theme = 'dark',
}: {
  status: ContactStatus;
  onChange: (s: ContactStatus) => void;
  theme?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find(o => o.value === status)!;
  const Icon = current.icon;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors text-sm font-medium ${
          theme === 'dark'
            ? 'hover:bg-white/[0.06] text-surface-400'
            : 'hover:bg-surface-100 text-surface-600'
        }`}
      >
        <Icon size={14} className={current.color} />
        <span className="hidden sm:inline">{current.label}</span>
      </button>
      {open && (
        <div className={`absolute right-0 top-full mt-1 w-44 rounded-xl shadow-xl border py-1.5 z-30 animate-in ${
          theme === 'dark'
            ? 'bg-surface-800 border-white/[0.08]'
            : 'bg-white border-surface-200'
        }`}>
          {options.map(opt => {
            const OptIcon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors ${
                  opt.value === status ? 'font-semibold' : 'font-medium'
                } ${
                  theme === 'dark'
                    ? `hover:bg-white/[0.06] ${opt.value === status ? 'text-white' : 'text-surface-400'}`
                    : `hover:bg-surface-50 ${opt.value === status ? 'text-surface-900' : 'text-surface-600'}`
                }`}
              >
                <OptIcon size={15} className={opt.color} />
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
