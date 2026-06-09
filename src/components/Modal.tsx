import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  theme?: string;
}

export function Modal({ open, onClose, title, children, theme = 'dark' }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col animate-in ${
        theme === 'dark'
          ? 'bg-surface-900 border border-white/[0.08]'
          : 'bg-white border border-surface-200/60'
      }`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${
          theme === 'dark' ? 'border-white/[0.06]' : 'border-surface-200/60'
        }`}>
          <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-surface-900'}`}>{title}</h2>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'hover:bg-white/[0.06] text-surface-400 hover:text-white'
                : 'hover:bg-surface-100 text-surface-400 hover:text-surface-600'
            }`}
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
