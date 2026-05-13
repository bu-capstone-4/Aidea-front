import { useEffect } from 'react';
import { cn } from '@/shared/cn';
import { useToastStore, type Toast as ToastType } from '@/store/toastStore';

const TOAST_DURATION = 4000;

const typeStyle: Record<ToastType['type'], string> = {
  error: 'bg-red-50 border-red-200 text-red-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconMap: Record<ToastType['type'], string> = {
  error: '❌',
  success: '✅',
  info: 'ℹ️',
};

interface ToastProps {
  toast: ToastType;
}

export default function Toast({ toast }: ToastProps) {
  const { removeToast } = useToastStore();

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [toast.id, removeToast]);

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border px-4 py-3 shadow-md text-sm min-w-[260px] max-w-[380px]',
        typeStyle[toast.type]
      )}
    >
      <span className="mt-0.5 shrink-0 font-bold">{iconMap[toast.type]}</span>
      <span className="flex-1 leading-snug">{toast.message}</span>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
        aria-label="닫기"
      >
        ✕
      </button>
    </div>
  );
}
