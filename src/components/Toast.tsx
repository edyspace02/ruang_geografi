import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full no-print">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center justify-between p-3.5 rounded-xl shadow-lg border text-sm transition-all duration-300 transform translate-y-0 ${
            t.type === 'success'
              ? 'bg-emerald-900/90 text-emerald-100 border-emerald-700/60 backdrop-blur-md'
              : t.type === 'error'
              ? 'bg-rose-900/90 text-rose-100 border-rose-700/60 backdrop-blur-md'
              : 'bg-slate-900/90 text-slate-100 border-slate-700/60 backdrop-blur-md'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-sky-400 shrink-0" />}
            <span className="font-medium text-xs sm:text-sm">{t.message}</span>
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
