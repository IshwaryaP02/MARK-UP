import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Settings, Moon, Sun, Bell, Shield } from 'lucide-react';
import { BackButton } from './BackButton';

export const SettingsPage: React.FC = () => {
  const { isDarkMode, toggleDarkMode, addToast } = useApp();
  const [emailAlerts, setEmailAlerts] = useState(true);

  const handleSave = () => {
    addToast('Settings Preferences Saved', 'System preferences and theme palette saved', 'success');
  };

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="pb-2 border-b border-[#E2E8F0] dark:border-zinc-800">
        <h2 className="text-lg font-bold text-[#0F172A] dark:text-zinc-100 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#2563EB] dark:text-[#3B82F6]" /> System Settings & Themes
        </h2>
      </div>

      <div className="bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6 max-w-3xl">
        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between pb-5 border-b border-[#E2E8F0] dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-zinc-100 flex items-center gap-2">
              {isDarkMode ? <Moon className="w-4 h-4 text-[#2563EB]" /> : <Sun className="w-4 h-4 text-[#2563EB]" />}
              Interface Appearance
            </h3>
            <p className="text-xs text-[#000000] dark:text-[#64748B]">Toggle between Dark Mode and Light Mode</p>
          </div>
          <button
            onClick={toggleDarkMode}
            className="px-4 py-2 bg-[#2563EB] hover:bg-[#FFFFFF] dark:bg-[#2563EB] dark:hover:bg-[#2563EB] text-white dark:text-[#FFFFFF] rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-2"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </button>
        </div>

        {/* Email Alert Preferences */}
        <div className="space-y-3 pb-5 border-b border-[#E2E8F0] dark:border-zinc-800">
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-zinc-100">Email Alerts</h3>

          <label className="flex items-center justify-between text-xs cursor-pointer">
            <span className="text-[#1E293B] dark:text-zinc-300 font-semibold">Email Alerts for Low Attendance (&lt;75%)</span>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="w-4 h-4 text-[#2563EB] rounded"
            />
          </label>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-2.5 bg-[#2563EB] hover:bg-[#FFFFFF] text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
};
