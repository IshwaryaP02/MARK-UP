import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useCustomization } from '../../context/CustomizationContext';
import { Settings, Moon, Sun, Bell, Image as ImageIcon, Upload, Palette, Check } from 'lucide-react';
import { BackButton } from './BackButton';
import { apiClient } from '../../lib/apiClient';

const THEMES = ['Classic', 'Frosted', 'Aqua', 'Blue', 'Grey', 'Olive', 'Sunset', 'Midnight'] as const;

const PRESET_WALLPAPERS = [
  { name: 'Ocean', url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=2000&auto=format&fit=crop' },
  { name: 'Mountains', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2000&auto=format&fit=crop' },
  { name: 'Forest', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2000&auto=format&fit=crop' },
  { name: 'Aurora', url: 'https://images.unsplash.com/photo-1531366936337-77cf3526e466?q=80&w=2000&auto=format&fit=crop' },
  { name: 'Abstract', url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=2000&auto=format&fit=crop' },
  { name: 'Minimal', url: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?q=80&w=2000&auto=format&fit=crop' },
];

export const SettingsPage: React.FC = () => {
  const { isDarkMode, toggleDarkMode, addToast } = useApp();
  const { theme, wallpaperUrl, savePreferences } = useCustomization();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [localTheme, setLocalTheme] = useState(theme);
  const [localWallpaper, setLocalWallpaper] = useState(wallpaperUrl);
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = async () => {
    try {
      await savePreferences(localTheme, localWallpaper);
      addToast('Preferences Saved', 'Your theme and wallpaper preferences have been updated.', 'success');
    } catch (e) {
      addToast('Save Failed', 'Failed to save preferences.', 'danger');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
    setIsUploading(true);
    try {
      const token = localStorage.getItem('smart_att_token');
      const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/+$/, '');
      const backendBase = apiBase.replace('/api', '');
      const res = await fetch(`${apiBase}/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const fullUrl = `${backendBase}${data.url}`;
      setLocalWallpaper(fullUrl);
      addToast('Upload Complete', 'Wallpaper uploaded successfully.', 'success');
    } catch (err) {
      addToast('Upload Failed', 'Failed to upload wallpaper.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <BackButton />
      <div className="pb-2 border-b border-[#E2E8F0] dark:border-zinc-800">
        <h2 className="text-lg font-bold text-[#0F172A] dark:text-zinc-100 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Settings & Customization
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
        
        {/* Left Column - Customization */}
        <div className="bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-zinc-100 flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-zinc-800">
            <Palette className="w-4 h-4 text-blue-600" /> Theme Selection
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {THEMES.map((t) => (
              <button
                key={t}
                onClick={() => setLocalTheme(t as any)}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all ${
                  localTheme === t 
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-300' 
                    : 'border-gray-200 text-gray-700 hover:border-gray-300 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700'
                }`}
              >
                {t}
                {localTheme === t && <Check className="w-3 h-3" />}
              </button>
            ))}
          </div>

          <h3 className="text-sm font-bold text-[#0F172A] dark:text-zinc-100 flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-zinc-800 pt-4">
            <ImageIcon className="w-4 h-4 text-blue-600" /> Wallpaper
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button
              onClick={() => setLocalWallpaper(null)}
              className={`h-24 rounded-xl border-2 flex items-center justify-center font-semibold text-xs transition-all ${
                localWallpaper === null 
                  ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-dashed border-gray-300 text-gray-500 hover:border-gray-400 dark:border-zinc-700'
              }`}
            >
              Default (No Wallpaper)
            </button>
            {PRESET_WALLPAPERS.map((w) => (
              <div 
                key={w.name}
                onClick={() => setLocalWallpaper(w.url)}
                className={`relative h-24 rounded-xl border-2 cursor-pointer overflow-hidden group ${
                  localWallpaper === w.url ? 'border-blue-500' : 'border-transparent hover:ring-2 ring-gray-300'
                }`}
              >
                <img src={w.url} alt={w.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-bold">{w.name}</span>
                </div>
                {localWallpaper === w.url && (
                  <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-1 shadow-md">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Upload Custom Wallpaper */}
          <div className="pt-2">
            <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
              <div className="flex flex-col items-center space-y-1 text-gray-500 dark:text-gray-400">
                <Upload className="w-5 h-5" />
                <span className="text-xs font-bold">{isUploading ? 'Uploading...' : 'Upload Custom Wallpaper'}</span>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
            </label>
          </div>
        </div>

        {/* Right Column - System Prefs */}
        <div className="bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-5 border-b border-[#E2E8F0] dark:border-zinc-800">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-zinc-100 flex items-center gap-2">
                {isDarkMode ? <Moon className="w-4 h-4 text-blue-600" /> : <Sun className="w-4 h-4 text-blue-600" />}
                Interface Appearance
              </h3>
              <p className="text-xs text-gray-500 mt-1">Toggle between Dark Mode and Light Mode</p>
            </div>
            <button
              onClick={toggleDarkMode}
              className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-white rounded-lg font-bold text-xs transition-all shadow-sm flex items-center gap-2"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>

          <div className="space-y-4 pb-5 border-b border-[#E2E8F0] dark:border-zinc-800">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-zinc-100 flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" /> Notifications
            </h3>
            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span className="text-[#1E293B] dark:text-zinc-300 font-semibold">Email Alerts for Low Attendance</span>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </label>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" /> Save All Preferences
          </button>
        </div>

      </div>
    </div>
  );
};
