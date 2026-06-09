import { useState } from 'react';
import { ActivityNote, ACTIVITY_TYPES } from '../types';
import { Plus, Trash2, MessageCircle } from 'lucide-react';

interface ActivityLogProps {
  contactId: string;
  notes: ActivityNote[];
  onAddNote: (contactId: string, text: string, type: ActivityNote['type']) => void;
  onDeleteNote: (noteId: string) => void;
}

export function ActivityLog({ contactId, notes, onAddNote, onDeleteNote }: ActivityLogProps) {
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
        <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
          <MessageCircle size={12} />
          Activity Log
        </h4>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          <Plus size={12} />
          Add Note
        </button>
      </div>

      {isAdding && (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 space-y-2 animate-in">
          <div className="flex gap-2 flex-wrap">
            {ACTIVITY_TYPES.map(at => (
              <button
                key={at.value}
                onClick={() => setType(at.value)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  type === at.value
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
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
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setIsAdding(false); setText(''); }}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!text.trim()}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {contactNotes.length === 0 && !isAdding && (
        <p className="text-xs text-slate-400 py-2">No activity logged yet</p>
      )}

      <div className="space-y-1.5 max-h-60 overflow-y-auto">
        {contactNotes.map(note => {
          const typeInfo = ACTIVITY_TYPES.find(t => t.value === note.type) || ACTIVITY_TYPES[0];
          return (
            <div key={note.id} className="flex items-start gap-2 group py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors">
              <span className="text-sm shrink-0 mt-0.5">{typeInfo.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-700">{note.text}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(note.createdAt)}</p>
              </div>
              <button
                onClick={() => onDeleteNote(note.id)}
                className="p-1 rounded hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
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
