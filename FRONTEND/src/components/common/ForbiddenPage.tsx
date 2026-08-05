import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const ForbiddenPage: React.FC = () => {
  const { setActiveScreen, currentUser } = useApp();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/80 text-rose-600 rounded-3xl flex items-center justify-center">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">403 — Access Forbidden</h2>
      <p className="text-xs text-zinc-500 max-w-sm">
        Your assigned role (<strong>{currentUser.role.toUpperCase()}</strong>) does not have sufficient administrative privileges to access this module.
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
