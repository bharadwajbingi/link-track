import { useState } from 'react';
import { ActivityNote, ACTIVITY_TYPES } from '../types';
import { Plus, Trash2, MessageCircle } from 'lucide-react';

interface ActivityLogProps {
  contactId: string;
  notes: ActivityNote[];
  onAddNote: (contactId: string, text: string, type: ActivityNote['type']) => void;
  onDeleteNote: (noteId: string) => void;
  theme?: string;
}

export function ActivityLog({ contactId, notes, onAddNote, onDeleteNote, theme = 'dark' }: ActivityLogProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [text, setText] = useState('');
  const [type, setType] = useState<ActivityNote['type']>('note');

  const contactNotes = notes.filter(n => n.contactId === contactId);

  const handleAdd = () => {
    if (!text.trim()) return;
    onAddNote(contactId, text, type);
    setText('');
    setType('note');
    setIsAdding(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${theme === 'dark' ? 'text-surface-500' : 'text-surface-600'}`}>
          <MessageCircle size={12} />
          Activity Log
        </h4>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
        >
          <Plus size={12} />
          Add Note
        </button>
      </div>

      {isAdding && (
        <div className={`rounded-lg border p-3 space-y-2 animate-in ${
          theme === 'dark' ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-surface-50 border-surface-200'
        }`}>
          <div className="flex gap-2 flex-wrap">
            {ACTIVITY_TYPES.map(at => (
              <button
                key={at.value}
                onClick={() => setType(at.value)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors border ${
                  type === at.value
                    ? 'bg-brand-500/10 text-brand-400 border-brand-500/20'
                    : theme === 'dark'
                      ? 'bg-white/[0.03] text-surface-400 border-white/[0.06] hover:border-white/[0.12]'
                      : 'bg-white text-surface-600 border-surface-200 hover:border-surface-300'
                }`}
              >
                {at.emoji} {at.label}
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="What happened?"
            rows={2}
            className={`resize-none ${theme === 'dark' ? 'input-premium' : 'input-premium-light'}`}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setIsAdding(false); setText(''); }}
              className={theme === 'dark' ? 'btn-secondary text-xs' : 'btn-secondary-light text-xs'}
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!text.trim()}
              className="btn-primary text-xs !px-3 !py-1.5"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {contactNotes.length === 0 && !isAdding && (
        <p className={`text-xs py-2 ${theme === 'dark' ? 'text-surface-600' : 'text-surface-400'}`}>No activity logged yet</p>
      )}

      <div className="space-y-1.5 max-h-60 overflow-y-auto">
        {contactNotes.map(note => {
          const typeInfo = ACTIVITY_TYPES.find(t => t.value === note.type) || ACTIVITY_TYPES[0];
          return (
            <div key={note.id} className={`flex items-start gap-2 group py-1.5 px-2 rounded-lg transition-colors ${
              theme === 'dark' ? 'hover:bg-white/[0.03]' : 'hover:bg-surface-50'
            }`}>
              <span className="text-sm shrink-0 mt-0.5">{typeInfo.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${theme === 'dark' ? 'text-surface-300' : 'text-surface-700'}`}>{note.text}</p>
                <p className={`text-[10px] mt-0.5 ${theme === 'dark' ? 'text-surface-600' : 'text-surface-400'}`}>{formatDate(note.createdAt)}</p>
              </div>
              <button
                onClick={() => onDeleteNote(note.id)}
                className="p-1 rounded hover:bg-rose-500/10 text-surface-500 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
              >
                <Trash2 size={11} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
