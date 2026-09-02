import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          let bg = 'bg-white dark:bg-[#0A0A0A] border-zinc-200 dark:border-[#232326] text-zinc-900 dark:text-zinc-100';
          let icon = <Info className="w-5 h-5 text-[#1E40AF] dark:text-[#3B82F6] shrink-0" />;

          if (toast.type === 'success') {
            bg = 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
          } else if (toast.type === 'danger') {
            bg = 'bg-rose-50 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100';
            icon = <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />;
          } else if (toast.type === 'warning') {
            bg = 'bg-amber-50 dark:bg-amber-950/90 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100';
            icon = <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />;
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className={`pointer-events-auto p-4 rounded-xl border shadow-lg flex items-start gap-3 backdrop-blur-md ${bg}`}
            >
              {icon}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold">{toast.title}</h4>
                {toast.message && <p className="text-xs opacity-80 mt-0.5 leading-relaxed">{toast.message}</p>}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
