import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, User, CheckCircle2, XCircle, Search, Award } from 'lucide-react';

export const TutorODRequests: React.FC = () => {
  const { odRequests, reviewOdClassAdviser } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [remarks, setRemarks] = useState<{ [id: string]: string }>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filter for class adviser view (shows pending_class_adviser and their history)
  const filteredRequests = odRequests.filter((req) => {
    const q = searchQuery.toLowerCase();
    return (
      req.studentName.toLowerCase().includes(q) ||
      req.studentRegNo.toLowerCase().includes(q) ||
      req.reason.toLowerCase().includes(q)
    );
  });

  const handleReview = async (id: string, status: 'recommended' | 'rejected') => {
    setProcessingId(id);
    try {
      await reviewOdClassAdviser(id, status, remarks[id] || '');
      setRemarks(prev => { const n = {...prev}; delete n[id]; return n; });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#2563EB] dark:bg-[#0A0A0A] border border-[#E2E8F0]/20 dark:border-zinc-800 rounded-3xl p-6 text-white shadow-xl">
        <h2 className="text-xl font-bold tracking-tight mb-2">OD Approvals (Class Adviser)</h2>
        <p className="text-xs text-zinc-200 dark:text-zinc-400">Review and recommend student OD requests to the HOD.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#000000] dark:text-[#64748B] dark:text-zinc-500" />
        <input
          type="text"
          placeholder="Search by student name, reg no, or reason..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0] dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6]"
        />
      </div>

      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0] dark:border-zinc-800 rounded-2xl p-8 text-center">
            <Award className="w-12 h-12 text-[#2563EB]/20 dark:text-[#3B82F6]/20 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-zinc-100">No OD requests found</h3>
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div key={req.id} className="bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0] dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
                    <span className="font-bold text-[#0F172A] dark:text-zinc-100">{req.studentName}</span>
                    <span className="text-xs text-[#000000] dark:text-[#64748B] font-mono">({req.studentRegNo})</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#1E293B] dark:text-zinc-300">{req.reason}</h4>
                  <p className="text-xs text-[#000000] dark:text-[#64748B] dark:text-zinc-400 max-w-2xl">{req.description}</p>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#000000] dark:text-[#64748B] dark:text-zinc-500">
                    <Calendar className="w-3.5 h-3.5" />
                    {req.startDate} to {req.endDate}
                  </div>
                </div>

                {req.status === 'pending_class_adviser' ? (
                  <div className="shrink-0 space-y-2 w-full md:w-64">
                    <input
                      type="text"
                      placeholder="Remarks (Optional)"
                      value={remarks[req.id] || ''}
                      onChange={(e) => setRemarks({ ...remarks, [req.id]: e.target.value })}
                      className="w-full p-2 bg-[#F7F9FC] dark:bg-zinc-900 border border-[#E2E8F0] dark:border-zinc-700 rounded-lg text-xs"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReview(req.id, 'recommended')}
                        disabled={processingId === req.id}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Recommend
                      </button>
                      <button
                        onClick={() => handleReview(req.id, 'rejected')}
                        disabled={processingId === req.id}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-900/50 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="shrink-0">
                    <span className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 ${
                      req.status === 'rejected' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' :
                      req.status === 'recommended' || req.status === 'pending_hod' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                    }`}>
                      {req.status === 'rejected' ? 'Rejected' : req.status === 'approved' ? 'Approved by HOD' : 'Recommended to HOD'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
