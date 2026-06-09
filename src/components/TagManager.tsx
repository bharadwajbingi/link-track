import { useState } from 'react';
import { Tag } from '../types';
import { Plus, X, Palette } from 'lucide-react';

interface TagManagerProps {
  tags: Tag[];
  selectedTags: string[];
  onToggleTag: (tagId: string) => void;
  onAddTag: (name: string, color: string) => void;
  onDeleteTag: (tagId: string) => void;
  compact?: boolean;
  theme?: string;
}

const TAG_COLORS = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

export function TagManager({ tags, selectedTags, onToggleTag, onAddTag, onDeleteTag, compact = false, theme = 'dark' }: TagManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(TAG_COLORS[0]);

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAddTag(newName, newColor);
    setNewName('');
    setNewColor(TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]);
    setIsAdding(false);
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {tags.map(tag => {
          const isSelected = selectedTags.includes(tag.id);
          return (
            <button
              key={tag.id}
              onClick={() => onToggleTag(tag.id)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                isSelected
                  ? 'text-white shadow-sm scale-105'
                  : theme === 'dark'
                    ? 'text-surface-400 bg-white/[0.06] hover:bg-white/[0.1]'
                    : 'text-surface-600 bg-surface-100 hover:bg-surface-200'
              }`}
              style={isSelected ? { backgroundColor: tag.color } : undefined}
            >
              {!isSelected && (
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
              )}
              {tag.name}
              {isSelected && <X size={10} className="ml-0.5" />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${theme === 'dark' ? 'text-surface-500' : 'text-surface-600'}`}>
          <Palette size={12} />
          Tags
        </h4>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
        >
          <Plus size={12} />
          New Tag
        </button>
      </div>

      {isAdding && (
        <div className={`rounded-lg border p-3 space-y-2 animate-in ${
          theme === 'dark' ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-surface-50 border-surface-200'
        }`}>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Tag name"
            className={theme === 'dark' ? 'input-premium' : 'input-premium-light'}
            autoFocus
          />
          <div className="flex items-center gap-1.5 flex-wrap">
            {TAG_COLORS.map(color => (
              <button
                key={color}
                onClick={() => setNewColor(color)}
                className={`w-6 h-6 rounded-full transition-transform ${
                  newColor === color ? 'ring-2 ring-offset-1 ring-brand-400 scale-110' : 'hover:scale-110'
                } ${theme === 'dark' ? 'ring-offset-surface-900' : 'ring-offset-white'}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsAdding(false)} className={theme === 'dark' ? 'btn-secondary text-xs' : 'btn-secondary-light text-xs'}>
              Cancel
            </button>
            <button onClick={handleAdd} disabled={!newName.trim()} className="btn-primary text-xs !px-3 !py-1.5">
              Create
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {tags.map(tag => {
          const isSelected = selectedTags.includes(tag.id);
          return (
            <div key={tag.id} className="group relative">
              <button
                onClick={() => onToggleTag(tag.id)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  isSelected
                    ? 'text-white shadow-sm'
                    : theme === 'dark'
                      ? 'text-surface-400 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.06]'
                      : 'text-surface-600 bg-surface-100 hover:bg-surface-200 border border-surface-200'
                }`}
                style={isSelected ? { backgroundColor: tag.color } : undefined}
              >
                {!isSelected && (
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                )}
                {tag.name}
              </button>
              <button
                onClick={() => onDeleteTag(tag.id)}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={8} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TagBadges({ tags, allTags }: { tags: string[]; allTags: Tag[] }) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map(tagId => {
        const tag = allTags.find(t => t.id === tagId);
        if (!tag) return null;
        return (
          <span
            key={tagId}
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold text-white"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
          </span>
        );
      })}
    </div>
  );
}
