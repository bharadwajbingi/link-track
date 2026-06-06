import { ContactStatus } from '../types';
import { Clock, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';

const options: { value: ContactStatus; label: string; icon: typeof Clock; color: string }[] = [
  { value: 'pending', label: 'Pending', icon: Clock, color: 'text-amber-600' },
  { value: 'accepted', label: 'Accepted', icon: CheckCircle2, color: 'text-emerald-600' },
  { value: 'declined', label: 'Declined', icon: XCircle, color: 'text-rose-600' },
  { value: 'no_response', label: 'No Response', icon: MinusCircle, color: 'text-slate-400' },
];

export function StatusDropdown({
  status,
  onChange,
}: {
  status: ContactStatus;
  onChange: (s: ContactStatus) => void;
}) {
  const current = options.find(o => o.value === status)!;
  const Icon = current.icon;

  return (
    <div className="relative group">
      <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium text-slate-600">
        <Icon size={14} className={current.color} />
        {current.label}
      </button>
      <div className="absolute left-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
        {options.map(opt => {
          const OptIcon = opt.icon;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm hover:bg-slate-50 transition-colors ${
                opt.value === status ? 'font-semibold' : 'font-medium text-slate-600'
              }`}
            >
              <OptIcon size={15} className={opt.color} />
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
