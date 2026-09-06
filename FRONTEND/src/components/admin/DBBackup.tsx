import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../common/BackButton';
import { Database, Download, CalendarDays, HardDrive, ShieldCheck, CheckCircle2, Plus } from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DBBackup: React.FC = () => {
  const { backups, triggerBackup, addToast } = useApp();
  const [backupMonth, setBackupMonth] = useState(new Date().toISOString().slice(0, 7));

  const handleDownload = (filename: string) => {
    addToast('Backup Downloaded', `Downloaded snapshot ${filename}`, 'success');
  };

  const handleCreateMonthlyBackup = () => {
    triggerBackup('manual');
    addToast('Monthly Backup Created', `Backup snapshot for ${monthLabel(backupMonth)} created`, 'success');
  };

  const monthLabel = (ym: string) => {
    const [y, m] = ym.split('-').map(Number);
    return `${MONTHS[(m ?? 1) - 1]} ${y}`;
  };

  // Derive month label from a createdAt string like "2026-08-01 02:00 AM"
  const backupMonthLabel = (createdAt: string) => {
    const m = createdAt.match(/^(\d{4})-(\d{2})/);
    if (!m) return '—';
    return `${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
  };

  const lastBackup = backups[0];

  return (
    <div className="space-y-6">
      <BackButton />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Monthly Database Backup
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="month"
            value={backupMonth}
            onChange={(e) => setBackupMonth(e.target.value)}
            className="p-2 text-xs font-semibold bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl"
          />
          <button
            onClick={handleCreateMonthlyBackup}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1E40AF] hover:bg-[#FFFFFF] dark:bg-[#2563EB] dark:text-[#FFFFFF] dark:hover:bg-white text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Backup
          </button>
        </div>
      </div>

      {/* Latest Backup Summary */}
      <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl p-5 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        {lastBackup ? (
          <>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#1E40AF]/10 dark:bg-[#2563EB]/50 text-[#1E40AF] dark:text-[#3B82F6] rounded-2xl">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Backup Month</div>
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{backupMonthLabel(lastBackup.createdAt)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#1E40AF]/10 dark:bg-[#2563EB]/50 text-[#1E40AF] dark:text-[#3B82F6] rounded-2xl">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Backup Date</div>
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono">{lastBackup.createdAt}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Status</div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase">{lastBackup.status}</div>
              </div>
            </div>
          </>
        ) : (
          <p className="text-xs text-zinc-400">No backups created yet. Create your first monthly backup.</p>
        )}
      </div>

      {/* Backup History Table */}
      <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-100 dark:border-[#232326] flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" />
            Backup History ({backups.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-[#0A0A0A]/80 border-b border-zinc-200 dark:border-[#232326] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-3.5 pl-4">Backup Month</th>
              <th className="p-3.5">Backup Date</th>
              <th className="p-3.5">Filename</th>
              <th className="p-3.5">Size</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right pr-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {backups.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-zinc-400">No backup history available.</td>
              </tr>
            ) : (
              backups.map((b) => (
                <tr key={b.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="p-3.5 pl-4 font-bold text-[#1E40AF] dark:text-[#3B82F6]">
                    {backupMonthLabel(b.createdAt)}
                  </td>
                  <td className="p-3.5 text-zinc-500 font-mono">{b.createdAt}</td>
                  <td className="p-3.5 font-mono font-semibold text-zinc-700 dark:text-zinc-300">{b.filename}</td>
                  <td className="p-3.5 font-semibold text-zinc-700 dark:text-zinc-300">{b.size}</td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {b.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right pr-4">
                    <button
                      onClick={() => handleDownload(b.filename)}
                      className="p-1.5 text-[#1E40AF] dark:text-[#3B82F6] hover:bg-[#1E40AF]/10 rounded-lg transition-colors font-semibold flex items-center gap-1 ml-auto"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};
