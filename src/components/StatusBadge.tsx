import { ContactStatus } from '../types';
import { Clock, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';

const darkConfig: Record<ContactStatus, { label: string; bg: string; text: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', bg: 'bg-amber-500/10', text: 'text-amber-400', icon: Clock },
  accepted: { label: 'Accepted', bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: CheckCircle2 },
  declined: { label: 'Declined', bg: 'bg-rose-500/10', text: 'text-rose-400', icon: XCircle },
  no_response: { label: 'No Response', bg: 'bg-surface-500/10', text: 'text-surface-400', icon: MinusCircle },
};

const lightConfig: Record<ContactStatus, { label: string; bg: string; text: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
  accepted: { label: 'Accepted', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
  declined: { label: 'Declined', bg: 'bg-rose-50', text: 'text-rose-700', icon: XCircle },
  no_response: { label: 'No Response', bg: 'bg-surface-100', text: 'text-surface-500', icon: MinusCircle },
};

export function StatusBadge({ status, theme = 'dark' }: { status: ContactStatus; theme?: string }) {
  const config = theme === 'dark' ? darkConfig : lightConfig;
  const c = config[status];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${c.bg} ${c.text} ${
      theme === 'dark' ? 'border-white/[0.06]' : 'border-transparent'
    }`}>
      <Icon size={11} />
      {c.label}
    </span>
  );
}
