import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AppNotification } from '../../types';
import { notificationVisibleToUser } from '../../services/circularTargeting';
import { BackButton } from './BackButton';
import { Bell, CheckCircle2, Clock, FileText } from 'lucide-react';

export const NotificationCenter: React.FC = () => {
  const { notifications, markNotificationRead, currentUser, setActiveScreen } = useApp();

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => notificationVisibleToUser(n, currentUser));
  }, [notifications, currentUser]);

  const handleOpen = (n: AppNotification) => {
    markNotificationRead(n.id);
    if (n.link) setActiveScreen(n.link);
  };

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="pb-2 border-b border-[#E2E8F0] dark:border-zinc-800">
        <h2 className="text-lg font-bold text-[#0F172A] dark:text-zinc-100 tracking-tight">
          Notification Center & System Alerts
        </h2>
      </div>

      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-zinc-800 rounded-2xl text-center">
            <Bell className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-[#000000] dark:text-[#64748B] dark:text-zinc-400">No notifications yet.</p>
            <p className="text-xs text-[#000000] dark:text-[#64748B] dark:text-zinc-500 mt-1">You will receive alerts here when relevant.</p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleOpen(n)}
              className={`p-4 rounded-2xl border transition-colors cursor-pointer ${
                !n.read
                  ? 'bg-[#2563EB]/20 dark:bg-[#2563EB]/50 border-[#2563EB]/40 dark:border-[#3B82F6]/50'
                  : 'bg-white dark:bg-[#0A0A0A] border-[#E2E8F0] dark:border-[#232326]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {n.title.startsWith('Circular:') && (
                      <FileText className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6] shrink-0" />
                    )}
                    <h4 className="text-xs font-bold text-[#0F172A] dark:text-zinc-100">{n.title}</h4>
                  </div>
                  <p className="text-xs text-[#1E293B] dark:text-zinc-300 mt-1">{n.message}</p>
                </div>
                <span className="text-[10px] text-[#000000] dark:text-[#64748B] font-mono shrink-0">{n.timestamp}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
