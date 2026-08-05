import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AuditLog } from '../../types';
import { Modal } from '../common/Modal';
import { ShieldAlert, Search, Code, User, Clock, Terminal } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const { auditLogs } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filtered = auditLogs.filter(
    (log) =>
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Security Audit Trail & Payload Inspector
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Immutable log trail of all user actions, attendance submissions, and administrative changes
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter audit logs by action, user name, module, or details..."
          className="w-full pl-10 pr-3 py-2 text-xs bg-white dark:bg-[#21284C] border border-zinc-200 dark:border-[#2D376A] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#313866]"
        />
      </div>

      <div className="bg-white dark:bg-[#21284C] border border-zinc-200/80 dark:border-[#2D376A] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-[#161B33]/80 border-b border-zinc-200 dark:border-[#2D376A] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-3.5 pl-4">Timestamp</th>
              <th className="p-3.5">User</th>
              <th className="p-3.5">Action Event</th>
              <th className="p-3.5">Module</th>
              <th className="p-3.5">Details</th>
              <th className="p-3.5 text-right pr-4">Payload Inspector</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono">
            {filtered.map((log) => (
              <tr key={log.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                <td className="p-3.5 pl-4 text-zinc-500 text-[11px]">{log.timestamp}</td>
                <td className="p-3.5 font-sans font-semibold text-zinc-900 dark:text-zinc-100">
                  {log.userName}
                  <span className="block text-[10px] text-zinc-400 uppercase font-mono">{log.role}</span>
                </td>
                <td className="p-3.5 font-bold text-[#313866] dark:text-[#8A92D0]">{log.action}</td>
                <td className="p-3.5 text-zinc-600 dark:text-zinc-300 font-sans">{log.module}</td>
                <td className="p-3.5 text-zinc-500 font-sans truncate max-w-xs">{log.details}</td>
                <td className="p-3.5 text-right pr-4">
                  {log.payloadDiff ? (
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1.5 text-xs font-semibold text-[#313866] dark:text-[#8A92D0] hover:bg-[#313866]/10 rounded-lg transition-colors inline-flex items-center gap-1 font-sans"
                    >
                      <Code className="w-3.5 h-3.5" /> Inspect JSON
                    </button>
                  ) : (
                    <span className="text-[10px] text-zinc-400 font-sans font-normal">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payload Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={`Audit Payload: ${selectedLog.action}`}
          subtitle={`By ${selectedLog.userName} on ${selectedLog.timestamp}`}
        >
          <div className="space-y-3">
            <div className="p-3 bg-[#161B33] text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto border border-[#2D376A]">
              <pre>{JSON.stringify(JSON.parse(selectedLog.payloadDiff || '{}'), null, 2)}</pre>
            </div>
            <p className="text-xs text-zinc-500">Origin IP: {selectedLog.ipAddress}</p>
          </div>
        </Modal>
      )}
    </div>
  );
};
