import React from 'react';
import { useToast, Toast as ToastType, ToastType as ToastTypeEnum } from '../context/ToastContext';

const getToastStyles = (type: ToastTypeEnum) => {
  const baseStyles = 'px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 text-white text-sm animate-in fade-in slide-in-from-top-4 duration-300';
  switch (type) {
    case 'success':
      return `${baseStyles} bg-green-500`;
    case 'error':
      return `${baseStyles} bg-red-500`;
    case 'warning':
      return `${baseStyles} bg-yellow-500`;
    case 'info':
      return `${baseStyles} bg-blue-500`;
    default:
      return baseStyles;
  }
};

const getIcon = (type: ToastTypeEnum) => {
  switch (type) {
    case 'success':
      return '✓';
    case 'error':
      return '✕';
    case 'warning':
      return '⚠';
    case 'info':
      return 'ℹ';
  }
};

const Toast: React.FC<{ toast: ToastType; onClose: () => void }> = ({ toast, onClose }) => {
  React.useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(onClose, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, onClose]);

  return (
    <div className={getToastStyles(toast.type)}>
      <span className="text-lg font-bold">{getIcon(toast.type)}</span>
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={onClose}
        className="ml-2 hover:opacity-80 font-bold text-lg"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onClose={() => removeToast(toast.id)} />
        </div>
      ))}
    </div>
  );
};
