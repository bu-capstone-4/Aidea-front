import { useToastStore } from '@/store/toastStore';
import Toast from './Toast';

export default function ToastContainer() {
  const { toasts } = useToastStore();

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-9999 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
