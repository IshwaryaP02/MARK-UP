import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Database, Download, RefreshCw, HardDrive, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';

export const DBBackup: React.FC = () => {
  const { backups, triggerBackup, addToast } = useApp();
  const [autoSchedule, setAutoSchedule] = useState('daily');

  const handleDownload = (filename: string) => {
    addToast('Backup Downloaded', `Downloaded snapshot ${filename}`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Database Backup & Disaster Recovery
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Create automated SQL database snapshots, download backups, and configure recovery points
          </p>
        </div>

        <button
          onClick={() => triggerBackup('manual')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:text-[#0D1127] dark:hover:bg-white text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Database className="w-4 h-4" />
          Create Immediate Backup
        </button>
      </div>

      {/* Auto Backup Configuration */}
      <div className="bg-white dark:bg-[#21284C] border border-zinc-200/80 dark:border-[#2D376A] rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#313866]/10 dark:bg-[#313866]/50 text-[#313866] dark:text-[#8A92D0] rounded-2xl">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Automated Backup Scheduler</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Encrypted off-site storage schedule</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={autoSchedule}
            onChange={(e) => {
              setAutoSchedule(e.target.value);
              addToast('Schedule Updated', `Auto backup frequency set to ${e.target.value}`, 'info');
            }}
            className="p-2 text-xs font-semibold bg-zinc-50 dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-700 rounded-xl"
          >
            <option value="daily">Daily at 02:00 AM</option>
            <option value="weekly">Every Sunday at 01:00 AM</option>
            <option value="monthly">Monthly 1st at 00:00 AM</option>
          </select>
        </div>
      </div>

      {/* Backup History Table */}
      <div className="bg-white dark:bg-[#21284C] border border-zinc-200/80 dark:border-[#2D376A] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-100 dark:border-[#2D376A]">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Backup Snapshots History</h3>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-[#161B33]/80 border-b border-zinc-200 dark:border-[#2D376A] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-3.5 pl-4">Filename</th>
              <th className="p-3.5">Size</th>
              <th className="p-3.5">Trigger Type</th>
              <th className="p-3.5">Timestamp</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right pr-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {backups.map((b) => (
              <tr key={b.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                <td className="p-3.5 pl-4 font-mono font-bold text-[#313866] dark:text-[#8A92D0]">
                  {b.filename}
                </td>
                <td className="p-3.5 font-semibold text-zinc-700 dark:text-zinc-300">{b.size}</td>
                <td className="p-3.5 uppercase text-[10px] font-bold text-zinc-500">{b.type}</td>
                <td className="p-3.5 text-zinc-500 font-mono">{b.createdAt}</td>
                <td className="p-3.5">
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                </td>
                <td className="p-3.5 text-right pr-4">
                  <button
                    onClick={() => handleDownload(b.filename)}
                    className="p-1.5 text-[#313866] dark:text-[#8A92D0] hover:bg-[#313866]/10 rounded-lg transition-colors font-semibold flex items-center gap-1 ml-auto"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
