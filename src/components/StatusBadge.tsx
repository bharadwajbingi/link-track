import { ContactStatus } from '../types';
import { Clock, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';

const config: Record<ContactStatus, { label: string; bg: string; text: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
  accepted: { label: 'Accepted', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
  declined: { label: 'Declined', bg: 'bg-rose-50', text: 'text-rose-700', icon: XCircle },
  no_response: { label: 'No Response', bg: 'bg-slate-100', text: 'text-slate-500', icon: MinusCircle },
};

export function StatusBadge({ status }: { status: ContactStatus }) {
  const c = config[status];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <Icon size={12} />
      {c.label}
    </span>
  );
}
