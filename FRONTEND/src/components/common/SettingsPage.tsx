import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Settings, Moon, Sun, Bell, Shield, Palette, Check } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { isDarkMode, toggleDarkMode, currentTheme, setAppTheme, addToast } = useApp();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);

  const themeOptions = [
    {
      id: 'palette-classic',
      name: 'Palette Classic (Default)',
      description: 'Dark Navy (#0D1127), Slate Blue (#313866), Lavender (#8A92D0)',
      previewBg: 'bg-[#0D1127]',
      previewAccent: 'bg-[#313866]',
      previewHighlight: 'bg-[#8A92D0]'
    },
    {
      id: 'deep-sapphire',
      name: 'Deep Sapphire',
      description: 'Ocean Navy (#0A192F), Royal Blue (#1D4ED8), Sky Light (#93C5FD)',
      previewBg: 'bg-[#0A192F]',
      previewAccent: 'bg-[#1D4ED8]',
      previewHighlight: 'bg-[#93C5FD]'
    },
    {
      id: 'emerald-mint',
      name: 'Emerald Mint',
      description: 'Forest Green (#06231A), Emerald (#059669), Mint (#6EE7B7)',
      previewBg: 'bg-[#06231A]',
      previewAccent: 'bg-[#059669]',
      previewHighlight: 'bg-[#6EE7B7]'
    },
    {
      id: 'royal-indigo',
      name: 'Royal Indigo',
      description: 'Deep Indigo (#120E2E), Violet (#4F46E5), Lavender (#A5B4FC)',
      previewBg: 'bg-[#120E2E]',
      previewAccent: 'bg-[#4F46E5]',
      previewHighlight: 'bg-[#A5B4FC]'
    },
    {
      id: 'slate-charcoal',
      name: 'Slate Charcoal',
      description: 'Obsidian (#18181B), Dark Slate (#3F3F46), Steel (#A1A1AA)',
      previewBg: 'bg-[#18181B]',
      previewAccent: 'bg-[#3F3F46]',
      previewHighlight: 'bg-[#A1A1AA]'
    }
  ];

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

        {/* Color Palette Theme Selection */}
        <div className="space-y-4 pb-5 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#313866] dark:text-[#8A92D0]" /> Color Palette Themes
            </h3>
            <p className="text-xs text-zinc-500">Select your preferred color combination for the entire platform</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {themeOptions.map((th) => {
              const isSelected = currentTheme === th.id;
              return (
                <div
                  key={th.id}
                  onClick={() => setAppTheme(th.id)}
                  className={`p-3.5 border rounded-2xl cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-[#313866] dark:border-[#8A92D0] bg-[#F3F4F9] dark:bg-[#0D1127] ring-2 ring-[#313866]/30'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-[#313866]/50 bg-white dark:bg-[#161B33]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{th.name}</span>
                      {isSelected && (
                        <span className="px-1.5 py-0.5 bg-[#313866] dark:bg-[#8A92D0] text-white dark:text-[#0D1127] text-[9px] font-extrabold rounded-full flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> Active
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{th.description}</p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className={`w-4 h-4 rounded-full ${th.previewBg} border border-zinc-400/40`} />
                      <span className={`w-4 h-4 rounded-full ${th.previewAccent}`} />
                      <span className={`w-4 h-4 rounded-full ${th.previewHighlight}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
