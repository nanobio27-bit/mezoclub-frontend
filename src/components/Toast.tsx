import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useToastStore } from '../stores/toastStore';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const colors = {
  success: 'bg-green/20 border-green/30 text-green',
  error: 'bg-error/20 border-error/30 text-error',
  info: 'bg-gold/20 border-gold/30 text-gold',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm min-w-[300px] max-w-[400px] ${colors[toast.type]}`}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className="text-sm font-medium flex-1">{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} className="flex-shrink-0 cursor-pointer opacity-70 hover:opacity-100">
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
