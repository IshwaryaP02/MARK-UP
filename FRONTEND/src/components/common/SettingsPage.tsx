import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Settings, Moon, Sun, Bell, Shield } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { isDarkMode, toggleDarkMode, addToast } = useApp();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);

  const handleSave = () => {
    addToast('Settings Preferences Saved', 'System preferences and theme palette saved', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#313866] dark:text-[#8A92D0]" /> System Settings & Themes
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Customize interface themes, dark/light appearance, and system alerts.
        </p>
      </div>

      <div className="bg-white dark:bg-[#161B33] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6 max-w-3xl">
        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between pb-5 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              {isDarkMode ? <Moon className="w-4 h-4 text-[#8A92D0]" /> : <Sun className="w-4 h-4 text-[#313866]" />}
              Interface Appearance
            </h3>
            <p className="text-xs text-zinc-500">Toggle between Dark Mode and Light Mode</p>
          </div>
          <button
            onClick={toggleDarkMode}
            className="px-4 py-2 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:hover:bg-[#a3a8e0] text-white dark:text-[#0D1127] rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-2"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </button>
        </div>

        {/* Notification Preferences */}
        <div className="space-y-3 pb-5 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Notification Channels</h3>

          <label className="flex items-center justify-between text-xs cursor-pointer">
            <span className="text-zinc-700 dark:text-zinc-300 font-semibold">Email Alerts for Low Attendance (&lt;75%)</span>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="w-4 h-4 text-[#313866] rounded"
            />
          </label>

          <label className="flex items-center justify-between text-xs cursor-pointer">
            <span className="text-zinc-700 dark:text-zinc-300 font-semibold">SMS Alerts to Parents on Absence</span>
            <input
              type="checkbox"
              checked={smsAlerts}
              onChange={(e) => setSmsAlerts(e.target.checked)}
              className="w-4 h-4 text-[#313866] rounded"
            />
          </label>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-2.5 bg-[#313866] hover:bg-[#161B33] text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
};
