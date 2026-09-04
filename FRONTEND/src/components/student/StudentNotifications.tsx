import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';

export const StudentNotifications: React.FC = () => {
  const { notifications, markNotificationRead } = useApp();

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          System Alerts & Notification Center
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Real-time alerts regarding attendance, leave approvals, and schedule updates</p>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
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
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{n.title}</h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">{n.message}</p>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">{n.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
