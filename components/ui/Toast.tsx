"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, X, Info } from "lucide-react";

type ToastType = "ok" | "error" | "info";

interface Toast {
  id: number;
  type: ToastType;
  text: string;
}

interface ToastContextValue {
  toast: (type: ToastType, text: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, text: string) => {
    const id = ++nextId;
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const ICON = {
    ok:    <CheckCircle2 size={14} className="shrink-0" />,
    error: <AlertCircle size={14} className="shrink-0" />,
    info:  <Info size={14} className="shrink-0" />,
  };
  const STYLE = {
    ok:    "bg-emerald-500/15 text-emerald-700 border-emerald-300/40",
    error: "bg-red-500/15 text-red-600 border-red-300/40",
    info:  "bg-brand-500/15 text-brand-700 border-brand-300/40",
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}

      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm" role="region" aria-label="Notificaciones">
          {toasts.map(t => (
            <div
              key={t.id}
              role="alert"
              aria-live="assertive"
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-lg text-xs font-medium animate-slide-in ${STYLE[t.type]}`}
            >
              {ICON[t.type]}
              <span className="flex-1">{t.text}</span>
              <button
                onClick={() => removeToast(t.id)}
                aria-label="Cerrar notificación"
                className="p-0.5 opacity-50 hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}
