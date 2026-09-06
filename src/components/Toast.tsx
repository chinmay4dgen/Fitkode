import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number; // ms, default 5000
}

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const duration = toast.duration || 5000;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (elapsed >= duration) {
        clearInterval(interval);
        onDismiss(toast.id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.id, duration, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
    info: <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />,
  };

  const borders = {
    success: 'border-emerald-200 bg-white/95 text-emerald-950',
    error: 'border-rose-200 bg-white/95 text-rose-950',
    warning: 'border-amber-200 bg-white/95 text-amber-950',
    info: 'border-blue-200 bg-white/95 text-blue-950',
  };

  const barColors = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
  };

  return (
    <div
      role="alert"
      className={`relative overflow-hidden pointer-events-auto w-full rounded-2xl border shadow-xl backdrop-blur-md p-4 transition-all animate-in fade-in slide-in-from-top-4 duration-300 ${borders[toast.type]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3 min-w-0">
          {icons[toast.type]}
          <div className="min-w-0">
            <h4 className="text-xs font-black uppercase tracking-wider">{toast.title}</h4>
            {toast.message && (
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed break-words">
                {toast.message}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          aria-label="Close notification"
          className="text-gray-400 hover:text-gray-700 p-1 -mr-1 -mt-1 rounded-lg hover:bg-gray-100/80 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 5-second progress countdown bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100/60">
        <div
          className={`h-full transition-all ease-linear ${barColors[toast.type]}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100%-2.5rem)] pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
