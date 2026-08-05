import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SubstitutionRequest } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Repeat, CheckCircle2, UserCheck, Edit2, XCircle, Check } from 'lucide-react';

export const ApproveSubstitutions: React.FC = () => {
  const { substitutionRequests, facultyList, addToast } = useApp();

  const [requests, setRequests] = useState(substitutionRequests);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedSubstitutes, setSelectedSubstitutes] = useState<Record<string, { id: string; name: string }>>({});

  const handleSelectSubstitute = (reqId: string, facultyId: string) => {
    const fac = facultyList.find((f) => f.id === facultyId);
    if (!fac) return;
    setSelectedSubstitutes((prev) => ({
      ...prev,
      [reqId]: { id: fac.id, name: fac.name }
    }));
  };

  const handleApprove = (reqId: string) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === reqId) {
          const chosenSub = selectedSubstitutes[reqId];
          return {
            ...r,
            substituteFacultyId: chosenSub ? chosenSub.id : r.substituteFacultyId,
            substituteFacultyName: chosenSub ? chosenSub.name : r.substituteFacultyName,
            status: 'approved_by_hod' as const
          };
        }
        return r;
      })
    );
    setEditingId(null);
    addToast('Substitution Approved', 'HOD successfully approved class substitution', 'success');
  };

  const handleReject = (reqId: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: 'rejected_by_sub' as const } : r))
    );
    addToast('Substitution Rejected', 'Class substitution request rejected', 'info');
  };

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
          <Repeat className="w-5 h-5 text-[#313866] dark:text-[#8A92D0]" /> Approve Faculty Substitutions
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          As HOD, review peer substitution requests, modify assigned substitute faculty if needed, and click Approve.
        </p>
      </div>

      <div className="bg-white dark:bg-[#161B33] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-3.5 pl-4">Date & Period</th>
              <th className="p-3.5">Course & Room</th>
              <th className="p-3.5">Requesting Faculty</th>
              <th className="p-3.5">Assigned Substitute (HOD Editable)</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right pr-4">HOD Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {requests.map((s) => {
              const chosenSubId = selectedSubstitutes[s.id]?.id || s.substituteFacultyId;

              return (
                <tr key={s.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="p-3.5 pl-4">
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 block">{s.date}</span>
                    <span className="text-[10px] font-semibold text-[#313866] dark:text-[#8A92D0]">
                      Period {s.periodNumber}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                      {s.subjectCode} - {s.subjectName}
                    </span>
                    <span className="text-[10px] text-zinc-400">Room: {s.roomNo || 'LH-101'}</span>
                  </td>
                  <td className="p-3.5 font-bold text-zinc-800 dark:text-zinc-200">{s.requestingFacultyName}</td>
                  <td className="p-3.5">
                    {s.status === 'approved_by_hod' ? (
                      <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                        {s.substituteFacultyName}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <select
                          value={chosenSubId}
                          onChange={(e) => handleSelectSubstitute(s.id, e.target.value)}
                          className="px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-[#313866] dark:text-[#8A92D0] focus:ring-2 focus:ring-[#313866]"
                        >
                          {facultyList.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} ({f.departmentName})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </td>
                  <td className="p-3.5">
                    <StatusBadge status={s.status} size="sm" />
                  </td>
                  <td className="p-3.5 text-right pr-4">
                    {s.status === 'approved_by_hod' ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Approved
                      </span>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(s.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(s.id)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
