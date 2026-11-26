import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Toast 类型
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  // 便捷方法
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// 生成唯一 ID
const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// Toast Provider
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = generateId();
    const newToast: ToastMessage = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
    };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 便捷方法
  const success = useCallback((title: string, description?: string) => {
    addToast({ type: 'success', title, description });
  }, [addToast]);

  const error = useCallback((title: string, description?: string) => {
    addToast({ type: 'error', title, description, duration: 8000 });
  }, [addToast]);

  const warning = useCallback((title: string, description?: string) => {
    addToast({ type: 'warning', title, description });
  }, [addToast]);

  const info = useCallback((title: string, description?: string) => {
    addToast({ type: 'info', title, description });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// Hook 使用 toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const silentToast = {
  success() {},
  error() {},
  warning() {},
  info() {},
};

export function useOptionalToast() {
  return useContext(ToastContext) ?? silentToast;
}

// Toast 配置
const toastIcons = { success: CheckCircle, error: AlertCircle, warning: AlertTriangle, info: Info } satisfies Record<ToastType, typeof CheckCircle>;

// 单个 Toast 组件
function Toast({ toast, onRemove }: { toast: ToastMessage; onRemove: () => void }) {
  const { t } = useTranslation('common');
  const Icon = toastIcons[toast.type];

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(onRemove, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, onRemove]);

  return (
    <div
      className="aegis-toast"
      data-tone={toast.type}
      role={toast.type === 'error' || toast.type === 'warning' ? 'alert' : 'status'}
    >
      <span className="aegis-toast-icon" aria-hidden="true"><Icon size={17} /></span>
      <div className="flex-1 min-w-0">
        <p className="aegis-toast-title">{toast.title}</p>
        {toast.description && (
          <p className="aegis-toast-description">{toast.description}</p>
        )}
      </div>
      <button
        onClick={onRemove}
        type="button"
        className="aegis-toast-close"
        aria-label={t('button.close')}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Toast 容器
function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 top-[4.25rem] z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 pointer-events-none" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onRemove={() => removeToast(toast.id)} />
        </div>
      ))}
    </div>
  );
}
