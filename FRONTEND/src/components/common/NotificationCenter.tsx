import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, CheckCircle2, Clock, FileText } from 'lucide-react';

export const NotificationCenter: React.FC = () => {
  const { notifications, markNotificationRead, currentUser } = useApp();

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (!n.targetRole) return true;
      return n.targetRole === currentUser.role;
    });
  }, [notifications, currentUser.role]);

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Notification Center & System Alerts
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">All transactional alerts, leave approvals, circulars, and audit notices</p>
      </div>

      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 bg-white dark:bg-[#161B33] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl text-center">
            <Bell className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">No notifications yet.</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">You will receive alerts here when relevant.</p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markNotificationRead(n.id)}
              className={`p-4 rounded-2xl border transition-colors cursor-pointer ${
                !n.read
                  ? 'bg-[#313866]/20 dark:bg-[#313866]/50 border-[#313866]/40 dark:border-[#8A92D0]/50'
                  : 'bg-white dark:bg-[#21284C] border-zinc-200 dark:border-[#2D376A]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {n.title.startsWith('Circular:') && (
                      <FileText className="w-3.5 h-3.5 text-[#313866] dark:text-[#8A92D0] shrink-0" />
                    )}
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{n.title}</h4>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">{n.message}</p>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono shrink-0">{n.timestamp}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
