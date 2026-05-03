import { createContext, useContext, useMemo, useState } from 'react';
import { X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = crypto.randomUUID();
    setToasts((items) => [...items, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((items) => items.filter((item) => item.id !== id));
    }, 4200);
  };

  const removeToast = (id) => {
    setToasts((items) => items.filter((item) => item.id !== id));
  };

  const value = useMemo(() => ({ showToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 grid w-[min(420px,calc(100vw-2rem))] gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start justify-between gap-3 rounded-lg border p-4 shadow-lg ${
              toast.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-800'
                : toast.type === 'info'
                  ? 'border-blue-200 bg-blue-50 text-blue-800'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
          >
            <p className="text-sm font-semibold">{toast.message}</p>
            <button className="rounded p-1 hover:bg-black/5" onClick={() => removeToast(toast.id)} aria-label="Dismiss notification">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
