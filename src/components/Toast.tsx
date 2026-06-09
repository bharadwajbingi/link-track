import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

interface ToastProps {
  message: string;
  visible: boolean;
  onClose: () => void;
  theme?: string;
}

export function Toast({ message, visible, onClose, theme = 'dark' }: ToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible && !show) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 z-[60] flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl transition-all duration-300 border ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${
        theme === 'dark'
          ? 'bg-surface-800/95 backdrop-blur-xl text-white border-white/[0.08]'
          : 'bg-white/95 backdrop-blur-xl text-surface-900 border-surface-200/60 shadow-elevated'
      }`}
    >
      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-brand-500 to-violet-500 flex items-center justify-center shrink-0">
        <Check size={12} strokeWidth={3} className="text-white" />
      </div>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}
