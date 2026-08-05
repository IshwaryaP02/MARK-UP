import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SubstitutionRequest } from '../../types';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { Repeat, Plus, CheckCircle2, XCircle, UserCheck, Clock, Send, ShieldCheck } from 'lucide-react';

export const SubstitutionManager: React.FC = () => {
  const { substitutionRequests, facultyList, currentUser, requestSubstitution, respondSubstitution, addToast } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: '2026-08-04',
    periodNumber: 2,
    subjectCode: 'CS401',
    subjectName: 'Data Structures & Algorithms',
    substituteFacultyId: facultyList.find((f) => f.id !== currentUser.id)?.id || '',
    reason: ''
  });

  const myFacId = currentUser.id;

  // Incoming requests specifically targeting this faculty member OR unassigned open requests
  const incomingRequests = substitutionRequests.filter(
    (s) => (s.substituteFacultyId === myFacId || s.substituteFacultyId === 'open') && s.status === 'pending'
  );

  const mySentRequests = substitutionRequests.filter((s) => s.requestingFacultyId === myFacId);

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subColleague = facultyList.find((f) => f.id === formData.substituteFacultyId);
    if (!formData.reason) return;

    const newReq: SubstitutionRequest = {
      id: `sub-${Date.now()}`,
      date: formData.date,
      periodNumber: formData.periodNumber,
      subjectCode: formData.subjectCode,
      subjectName: formData.subjectName,
      requestingFacultyId: myFacId,
      requestingFacultyName: currentUser.name,
      substituteFacultyId: subColleague?.id || 'open',
      substituteFacultyName: subColleague?.name || 'Any Available Faculty',
      roomNo: 'Lab-302',
      section: 'A',
      reason: formData.reason,
      status: 'pending',
      createdAt: 'Just now'
    };

    requestSubstitution(newReq);
    setModalOpen(false);
    addToast('Substitution Requested', `Coverage request sent to ${subColleague?.name || 'Faculty Pool'}`, 'success');
  };

  const handleAcceptRequest = (reqId: string, requesterName: string, period: number) => {
    respondSubstitution(reqId, 'approved');
    addToast('Substitution Accepted', `You have accepted to substitute for ${requesterName} (Period ${period})`, 'success');
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <Repeat className="w-5 h-5 text-[#313866] dark:text-[#8A92D0]" /> Class Substitution Queue
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Request colleagues to substitute your scheduled periods or accept incoming coverage requests
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:hover:bg-[#a3a8e0] text-white dark:text-[#0D1127] text-xs font-bold rounded-xl transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Request Substitution
        </button>
      </div>

      {/* Incoming Requests Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          Incoming Coverage Requests ({incomingRequests.length})
        </h3>

        {incomingRequests.length === 0 ? (
          <div className="p-6 text-center bg-zinc-50 dark:bg-[#161B33] border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs text-zinc-400">
            No pending coverage requests from colleagues at this time.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {incomingRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 bg-white dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{req.requestingFacultyName}</h4>
                    <span className="text-[10px] text-[#313866] dark:text-[#8A92D0] font-mono font-bold">
                      {req.date} · Period {req.periodNumber}
                    </span>
                  </div>
                  <StatusBadge status={req.status} size="sm" />
                </div>

                <div className="p-2.5 bg-zinc-50 dark:bg-[#0D1127] rounded-xl text-xs border border-zinc-100 dark:border-zinc-800">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 block">{req.subjectCode} - {req.subjectName}</span>
                  <p className="text-zinc-500 mt-1 italic">"{req.reason}"</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => respondSubstitution(req.id, 'rejected')}
                    className="px-3 py-1.5 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 hover:bg-rose-100 text-xs font-bold rounded-xl transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleAcceptRequest(req.id, req.requestingFacultyName, req.periodNumber)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Accept & Substitute
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Outgoing Request History */}
      <div className="bg-white dark:bg-[#161B33] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">My Sent Substitution Requests</h3>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-[#0D1127] border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3 pl-4">Target Date & Period</th>
              <th className="p-3">Subject</th>
              <th className="p-3">Requested Substitute</th>
              <th className="p-3">Reason</th>
              <th className="p-3 text-right pr-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-semibold">
            {mySentRequests.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-zinc-400">
                  No substitution requests sent yet.
                </td>
              </tr>
            ) : (
              mySentRequests.map((req) => (
                <tr key={req.id}>
                  <td className="p-3 pl-4 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {req.date} · Period {req.periodNumber}
                  </td>
                  <td className="p-3 font-bold text-[#313866] dark:text-[#8A92D0]">{req.subjectCode}</td>
                  <td className="p-3 font-semibold text-zinc-800 dark:text-zinc-200">{req.substituteFacultyName}</td>
                  <td className="p-3 text-zinc-500 truncate max-w-xs">{req.reason}</td>
                  <td className="p-3 text-right pr-4">
                    <StatusBadge status={req.status} size="sm" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Request Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Substitution Request"
        subtitle="Select colleague who can be requested as substitute"
      >
        <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Target Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Period Number</label>
              <select
                value={formData.periodNumber}
                onChange={(e) => setFormData({ ...formData, periodNumber: parseInt(e.target.value) })}
                className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-[#313866] dark:text-[#8A92D0]"
              >
                <option value={1}>Period 1 (09:00 AM)</option>
                <option value={2}>Period 2 (10:00 AM)</option>
                <option value={3}>Period 3 (11:00 AM)</option>
                <option value={4}>Period 4 (01:30 PM)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Choose Substitute Colleague</label>
            <select
              value={formData.substituteFacultyId}
              onChange={(e) => setFormData({ ...formData, substituteFacultyId: e.target.value })}
              className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold"
            >
              <option value="open">Open to Any Available Faculty</option>
              {facultyList
                .filter((f) => f.id !== myFacId)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.departmentName || 'Computer Science'})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Reason for Absence</label>
            <textarea
              required
              rows={2}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g. Attending Academic Committee session..."
              className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#313866] hover:bg-[#161B33] text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <Send className="w-4 h-4" /> Send Substitution Request
          </button>
        </form>
      </Modal>
    </div>
  );
};
