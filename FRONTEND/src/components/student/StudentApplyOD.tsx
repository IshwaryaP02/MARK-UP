import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, FileText, Send, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export const StudentApplyOD: React.FC = () => {
  const { currentUser, odRequests, submitOdRequest } = useApp();
  
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !startDate || !endDate) return;

    setIsSubmitting(true);
    try {
      await submitOdRequest({
        reason,
        description,
        startDate,
        endDate
      });
      setReason('');
      setDescription('');
      setStartDate('');
      setEndDate('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="px-2 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#0F172A] dark:text-zinc-100 flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-[#2563EB] dark:text-[#3B82F6]" /> Apply for On-Duty (OD)
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-xs font-bold text-[#1E293B] dark:text-zinc-300 mb-1">OD Reason / Event Name</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Inter-college Symposium"
              className="w-full p-2.5 bg-[#F7F9FC] dark:bg-[#0A0A0A] border border-[#E2E8F0] dark:border-zinc-700 rounded-xl text-sm text-[#0F172A] dark:text-zinc-100 focus:outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6]"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1E293B] dark:text-zinc-300 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2.5 bg-[#F7F9FC] dark:bg-[#0A0A0A] border border-[#E2E8F0] dark:border-zinc-700 rounded-xl text-sm text-[#0F172A] dark:text-zinc-100 focus:outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1E293B] dark:text-zinc-300 mb-1">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2.5 bg-[#F7F9FC] dark:bg-[#0A0A0A] border border-[#E2E8F0] dark:border-zinc-700 rounded-xl text-sm text-[#0F172A] dark:text-zinc-100 focus:outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6]"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-[#1E293B] dark:text-zinc-300 mb-1">Detailed Description</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about the event, location, and faculty coordinator..."
              rows={3}
              className="w-full p-2.5 bg-[#F7F9FC] dark:bg-[#0A0A0A] border border-[#E2E8F0] dark:border-zinc-700 rounded-xl text-sm text-[#0F172A] dark:text-zinc-100 focus:outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-[#2563EB] hover:bg-[#FFFFFF] dark:bg-[#2563EB] dark:hover:bg-[#3B82F6] text-white dark:text-[#FFFFFF] text-sm font-bold rounded-xl transition-all shadow-md disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> {isSubmitting ? 'Submitting...' : 'Submit OD Request'}
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-[#0F172A] dark:text-zinc-100 mb-4">My OD Requests</h2>
        {odRequests.length === 0 ? (
          <p className="text-xs text-[#000000] dark:text-[#64748B] dark:text-zinc-400 text-center py-6">No OD requests found.</p>
        ) : (
          <div className="space-y-3">
            {odRequests.map((req) => (
              <div key={req.id} className="p-4 border border-[#E2E8F0] dark:border-zinc-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] dark:text-zinc-100">{req.reason}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[#000000] dark:text-[#64748B] dark:text-zinc-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {req.startDate} to {req.endDate}
                  </div>
                  <p className="text-xs text-[#000000] dark:text-[#64748B] dark:text-zinc-500 mt-2">{req.description}</p>
                </div>
                <div className="shrink-0 flex items-center">
                  {getStatusBadge(req.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
