import React from 'react';
import { useApp } from '../../context/AppContext';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const { setActiveScreen } = useApp();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 bg-[#313866]/10 dark:bg-[#313866]/40 text-[#313866] dark:text-[#8A92D0] rounded-3xl flex items-center justify-center">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">404 — Screen Not Found</h2>
      <p className="text-xs text-zinc-500 max-w-sm">
        The requested screen location could not be located in the application router.
      </p>
      <button
        onClick={() => setActiveScreen('dashboard')}
        className="px-4 py-2 bg-[#313866] hover:bg-[#161B33] text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Dashboard
      </button>
    </div>
  );
};
