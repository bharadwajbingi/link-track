import { useState } from 'react';
import { FollowUpReminder, Company } from '../types';
import { Bell, Plus, Check, Trash2, Calendar, AlertTriangle } from 'lucide-react';

interface ReminderPanelProps {
  reminders: FollowUpReminder[];
  companies: Company[];
  onAddReminder: (contactId: string, dueDate: string, note: string) => void;
  onCompleteReminder: (reminderId: string) => void;
  onDeleteReminder: (reminderId: string) => void;
  contactId?: string;
  theme?: string;
}

export function ReminderPanel({
  reminders, companies, onAddReminder, onCompleteReminder, onDeleteReminder, contactId, theme = 'dark',
}: ReminderPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');

  const filteredReminders = contactId
    ? reminders.filter(r => r.contactId === contactId)
    : reminders;

  const activeReminders = filteredReminders.filter(r => !r.completed);
  const completedReminders = filteredReminders.filter(r => r.completed);

  const now = new Date();

  const isOverdue = (dateStr: string) => new Date(dateStr) < now;
  const isDueToday = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toDateString() === now.toDateString();
  };

  const getContactName = (cId: string) => {
    for (const company of companies) {
      const contact = company.contacts.find(ct => ct.id === cId);
      if (contact) return { name: contact.name, company: company.name };
    }
    return { name: 'Unknown', company: '' };
  };

  const handleAdd = () => {
    if (!dueDate || !contactId) return;
    onAddReminder(contactId, new Date(dueDate).toISOString(), note);
    setDueDate('');
    setNote('');
    setIsAdding(false);
  };

  const formatDueDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isDueToday(dateStr)) return 'Today';
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${theme === 'dark' ? 'text-surface-500' : 'text-surface-600'}`}>
          <Bell size={12} />
          Follow-up Reminders
          {activeReminders.filter(r => isOverdue(r.dueDate)).length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-[10px] font-bold">
              {activeReminders.filter(r => isOverdue(r.dueDate)).length} overdue
            </span>
          )}
        </h4>
        {contactId && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1 text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
          >
            <Plus size={12} />
            Set Reminder
          </button>
        )}
      </div>

      {isAdding && (
        <div className={`rounded-lg border p-3 space-y-2 animate-in ${
          theme === 'dark' ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-surface-50 border-surface-200'
        }`}>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className={theme === 'dark' ? 'input-premium' : 'input-premium-light'}
          />
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Reminder note (optional)"
            className={theme === 'dark' ? 'input-premium' : 'input-premium-light'}
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsAdding(false)} className={theme === 'dark' ? 'btn-secondary text-xs' : 'btn-secondary-light text-xs'}>
              Cancel
            </button>
            <button onClick={handleAdd} disabled={!dueDate} className="btn-primary text-xs !px-3 !py-1.5">
              Add
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1.5 max-h-60 overflow-y-auto">
        {activeReminders.length === 0 && completedReminders.length === 0 && !isAdding && (
          <p className={`text-xs py-2 ${theme === 'dark' ? 'text-surface-600' : 'text-surface-400'}`}>No reminders set</p>
        )}

        {activeReminders
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
          .map(reminder => {
            const overdue = isOverdue(reminder.dueDate);
            const today = isDueToday(reminder.dueDate);
            const contactInfo = !contactId ? getContactName(reminder.contactId) : null;
            return (
              <div
                key={reminder.id}
                className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                  overdue
                    ? 'bg-rose-500/5 border-rose-500/20'
                    : today
                      ? 'bg-amber-500/5 border-amber-500/20'
                      : theme === 'dark'
                        ? 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                        : 'bg-white border-surface-200 hover:bg-surface-50'
                }`}
              >
                <button
                  onClick={() => onCompleteReminder(reminder.id)}
                  className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors hover:bg-emerald-500 hover:border-emerald-500 hover:text-white ${
                    overdue ? 'border-rose-400/60' : theme === 'dark' ? 'border-surface-600' : 'border-surface-300'
                  }`}
                >
                  <Check size={10} className="opacity-0 hover:opacity-100" />
                </button>
                <div className="flex-1 min-w-0">
                  {contactInfo && (
                    <p className={`text-xs font-medium truncate ${theme === 'dark' ? 'text-surface-200' : 'text-surface-700'}`}>{contactInfo.name}</p>
                  )}
                  {reminder.note && (
                    <p className={`text-xs truncate ${theme === 'dark' ? 'text-surface-400' : 'text-surface-600'}`}>{reminder.note}</p>
                  )}
                  <div className="flex items-center gap-1 mt-0.5">
                    {overdue ? (
                      <AlertTriangle size={10} className="text-rose-400" />
                    ) : (
                      <Calendar size={10} className={theme === 'dark' ? 'text-surface-500' : 'text-surface-400'} />
                    )}
                    <span className={`text-[10px] font-medium ${
                      overdue ? 'text-rose-400' : today ? 'text-amber-400' : theme === 'dark' ? 'text-surface-500' : 'text-surface-400'
                    }`}>
                      {formatDueDate(reminder.dueDate)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onDeleteReminder(reminder.id)}
                  className="p-1 rounded hover:bg-rose-500/10 text-surface-500 hover:text-rose-400 transition-colors shrink-0"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            );
          })}

        {completedReminders.length > 0 && (
          <div className={`pt-2 border-t mt-2 ${theme === 'dark' ? 'border-white/[0.06]' : 'border-surface-100'}`}>
            <p className={`text-[10px] uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-surface-600' : 'text-surface-400'}`}>Completed</p>
            {completedReminders.slice(0, 3).map(reminder => (
              <div key={reminder.id} className="flex items-center gap-2 py-1 opacity-50">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Check size={10} className="text-emerald-400" />
                </div>
                <span className={`text-xs line-through truncate ${theme === 'dark' ? 'text-surface-500' : 'text-surface-500'}`}>{reminder.note || 'Follow up'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function FollowUpToday({ reminders, companies, theme = 'dark', onCompleteReminder }: {
  reminders: FollowUpReminder[];
  companies: Company[];
  theme?: string;
  onCompleteReminder: (id: string) => void;
}) {
  const now = new Date();
  const todayReminders = reminders.filter(r =>
    !r.completed && new Date(r.dueDate) <= new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  );

  if (todayReminders.length === 0) return null;

  const getContactInfo = (contactId: string) => {
    for (const company of companies) {
      const contact = company.contacts.find(c => c.id === contactId);
      if (contact) return { name: contact.name, company: company.name };
    }
    return { name: 'Unknown', company: '' };
  };

  const overdue = todayReminders.filter(r => new Date(r.dueDate) < now);
  const today = todayReminders.filter(r => new Date(r.dueDate).toDateString() === now.toDateString());

  return (
    <div className={`rounded-xl border p-4 ${
      theme === 'dark'
        ? 'bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-amber-500/20'
        : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200/60'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Bell size={16} className="text-amber-400" />
        </div>
        <div>
          <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-surface-900'}`}>Follow Up Today</h3>
          <p className="text-xs text-surface-500">
            {overdue.length > 0 && <span className="text-rose-400 font-medium">{overdue.length} overdue</span>}
            {overdue.length > 0 && today.length > 0 && ' · '}
            {today.length > 0 && <span>{today.length} due today</span>}
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {todayReminders.slice(0, 5).map(reminder => {
          const info = getContactInfo(reminder.contactId);
          const isOverdue = new Date(reminder.dueDate) < now;
          return (
            <div key={reminder.id} className={`flex items-center gap-2 rounded-lg p-2.5 border ${
              theme === 'dark'
                ? 'bg-white/[0.03] border-amber-500/10'
                : 'bg-white/80 border-amber-100'
            }`}>
              <button
                onClick={() => onCompleteReminder(reminder.id)}
                className="w-5 h-5 rounded-full border-2 border-amber-400/50 shrink-0 flex items-center justify-center hover:bg-emerald-500 hover:border-emerald-500 transition-colors group"
              >
                <Check size={10} className="text-transparent group-hover:text-white" />
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${theme === 'dark' ? 'text-surface-200' : 'text-surface-800'}`}>{info.name}</p>
                <p className="text-[10px] text-surface-500 truncate">{info.company}{reminder.note ? ` - ${reminder.note}` : ''}</p>
              </div>
              {isOverdue && (
                <span className="shrink-0 px-1.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-[10px] font-bold">
                  Overdue
                </span>
              )}
            </div>
          );
        })}
        {todayReminders.length > 5 && (
          <p className="text-xs text-amber-400 font-medium text-center">+{todayReminders.length - 5} more</p>
        )}
      </div>
    </div>
  );
}
