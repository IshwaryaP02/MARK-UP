import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { BackButton } from '../common/BackButton';
import { Repeat, CheckCircle2, XCircle, Check } from 'lucide-react';

export const ApproveSubstitutions: React.FC = () => {
  const { substitutionRequests, facultyList, reviewSubstitutionRequest, addToast } = useApp();

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
    const chosenSub = selectedSubstitutes[reqId];
    reviewSubstitutionRequest(reqId, 'approve', chosenSub);
    addToast('Substitution Approved', 'HOD successfully approved class substitution', 'success');
  };

  const handleReject = (reqId: string) => {
    reviewSubstitutionRequest(reqId, 'reject');
    addToast('Substitution Rejected', 'Class substitution request rejected', 'info');
  };

  const actionable = (status: string) => status === 'pending' || status === 'accepted';

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
          <Repeat className="w-5 h-5 text-[#1E40AF] dark:text-[#3B82F6]" /> Approve Faculty Substitutions
        </h2>

      </div>

      <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-3.5 pl-4">Date & Period</th>
              <th className="p-3.5">Course</th>
              <th className="p-3.5">Requesting Faculty</th>
              <th className="p-3.5">Assigned Substitute (HOD Editable)</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right pr-4">HOD Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {substitutionRequests.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-zinc-400">
                  No substitution requests have been submitted yet.
                </td>
              </tr>
            )}
            {substitutionRequests.map((s) => {
              const chosenSubId = selectedSubstitutes[s.id]?.id || s.substituteFacultyId;

              return (
                <tr key={s.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="p-3.5 pl-4">
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 block">{s.date}</span>
                    <span className="text-[10px] font-semibold text-[#1E40AF] dark:text-[#3B82F6]">
                      Period {s.periodNumber}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                      {s.subjectCode} - {s.subjectName}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-zinc-800 dark:text-zinc-200">{s.requestingFacultyName}</td>
                  <td className="p-3.5">
                    {s.status === 'approved_by_hod' ? (
                      <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                        {s.substituteFacultyName}
                      </span>
                    ) : actionable(s.status) ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={chosenSubId}
                          onChange={(e) => handleSelectSubstitute(s.id, e.target.value)}
                          className="px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-[#1E40AF] dark:text-[#3B82F6] focus:ring-2 focus:ring-[#1E40AF]"
                        >
                          {facultyList
                            .filter((f) => f.id !== s.requestingFacultyId)
                            .map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.name} ({f.departmentName})
                              </option>
                            ))}
                        </select>
                      </div>
                    ) : (
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">{s.substituteFacultyName}</span>
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
                    ) : actionable(s.status) ? (
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
                    ) : (
                      <span className="text-zinc-400 text-[11px] font-semibold">No action</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};