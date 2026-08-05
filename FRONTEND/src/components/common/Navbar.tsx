import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EditProfileModal } from '../profile/EditProfileModal';
import {
  Bell,
  Search,
  Sun,
  Moon,
  Shield,
  User,
  GraduationCap,
  Users,
  LogOut,
  ChevronDown,
  UserCheck,
  Settings,
  ArrowRight,
  Palette
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    logout,
    isDarkMode,
    toggleDarkMode,
    setCommandPaletteOpen,
    notifications,
    markNotificationRead,
    clearAllNotifications,
    setActiveScreen
  } = useApp();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <header className="sticky top-0 z-30 h-16 shrink-0 bg-white/95 dark:bg-[#161B33]/95 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 px-4 sm:px-6 flex items-center justify-between transition-colors">
        {/* Left branding */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => setActiveScreen('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#313866] dark:bg-[#8A92D0] text-white dark:text-[#0D1127] flex items-center justify-center font-extrabold shadow-md group-hover:scale-105 transition-transform">
              SA
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight">SmartAttendance</h1>
              <p className="text-[10px] text-[#313866] dark:text-[#8A92D0] font-semibold tracking-wide uppercase">
                Enterprise Academic Suite
              </p>
            </div>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Role Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-[#F3F4F9] dark:bg-[#0D1127] text-[#313866] dark:text-[#8A92D0] rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#313866] dark:bg-[#8A92D0] animate-pulse" />
            <span>{currentUser.role} Portal</span>
          </div>

          {/* Themes quick switch */}
          <button
            onClick={() => setActiveScreen('settings')}
            className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            title="Themes & Color Palettes"
          >
            <Palette className="w-4 h-4 text-[#313866] dark:text-[#8A92D0]" />
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            title="Toggle Dark/Light mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#313866]" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-zinc-900 animate-pulse" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="p-3.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#F3F4F9] dark:bg-[#0D1127] text-[#313866] dark:text-[#8A92D0] rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <button
                    onClick={clearAllNotifications}
                    className="text-[10px] font-semibold text-[#313866] dark:text-[#8A92D0] hover:underline"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-xs text-center text-zinc-400">No notifications</p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => markNotificationRead(notif.id)}
                        className={`p-3 text-xs cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                          !notif.read ? 'bg-[#F3F4F9]/60 dark:bg-[#0D1127]/60' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{notif.title}</span>
                          <span className="text-[10px] text-zinc-400 shrink-0">{notif.timestamp}</span>
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-[11px] leading-relaxed">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 text-center">
                  <button
                    onClick={() => {
                      setNotificationsOpen(false);
                      setActiveScreen('notifications');
                    }}
                    className="text-xs font-semibold text-[#313866] dark:text-[#8A92D0] hover:underline flex items-center justify-center gap-1 mx-auto"
                  >
                    <span>View Notification Hub</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile avatar dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={currentUser.name}
                className="w-8 h-8 rounded-lg object-cover ring-2 ring-[#313866]/30"
              />
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 hidden sm:block" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 p-2">
                <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{currentUser.name}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{currentUser.email}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#F3F4F9] text-[#313866] dark:bg-[#0D1127] dark:text-[#8A92D0] rounded-md">
                    Role: {currentUser.role}
                  </span>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setEditProfileOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-white bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:text-[#0D1127] rounded-xl transition-colors my-1 shadow-sm"
                  >
                    <User className="w-4 h-4 text-white dark:text-[#0D1127]" />
                    <span className="text-white dark:text-[#0D1127]">Edit Profile Details</span>
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setActiveScreen('settings');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                  >
                    <Settings className="w-4 h-4 text-zinc-500" />
                    System Settings & Themes
                  </button>
                </div>

                <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Edit Profile Modal mounted outside header flow */}
      <EditProfileModal isOpen={editProfileOpen} onClose={() => setEditProfileOpen(false)} />
    </>
  );
};
