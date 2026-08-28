import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EditProfileModal } from '../profile/EditProfileModal';
import { User, Edit3, ArrowLeft } from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const { currentUser, setActiveScreen } = useApp();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <button
        onClick={() => setActiveScreen('dashboard')}
        className="flex items-center gap-2 text-xs font-bold text-[#313866] dark:text-[#8A92D0] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Student Profile & Academic Record
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Personal details and guardian contacts registered with the university</p>
        </div>

        <button
          onClick={() => setIsEditModalOpen(true)}
          className="px-4 py-2.5 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:hover:bg-[#a3a8e0] text-white dark:text-[#0D1127] text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 shrink-0"
        >
          <Edit3 className="w-4 h-4 text-white dark:text-[#0D1127]" />
          <span className="text-white dark:text-[#0D1127]">Edit Profile Details</span>
        </button>
      </div>

      <div className="bg-white dark:bg-[#161B33] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200'}
            alt={currentUser.name}
            className="w-20 h-20 rounded-2xl object-cover ring-4 ring-[#313866]/30 dark:ring-[#8A92D0]/30"
          />
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{currentUser.name}</h3>
            <p className="text-xs font-mono font-bold text-[#313866] dark:text-[#8A92D0]">
              Registration No: {currentUser.regNo || '2024CS01'}
            </p>
            <p className="text-xs font-mono text-zinc-600 dark:text-zinc-300 font-semibold mt-0.5">
              Mobile No: {currentUser.phone || '+91 98765 43210'} · Roll No: {currentUser.rollNo || '101'}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Semester {currentUser.semester || 4} - Section {currentUser.section || 'A'} · {currentUser.departmentName || 'Computer Science & Engineering'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          <div className="p-3 bg-zinc-50 dark:bg-[#0D1127] rounded-xl space-y-1 border border-zinc-100 dark:border-zinc-800">
            <span className="text-[10px] font-bold uppercase text-zinc-400">Institutional Email</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{currentUser.email}</span>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-[#0D1127] rounded-xl space-y-1 border border-zinc-100 dark:border-zinc-800">
            <span className="text-[10px] font-bold uppercase text-zinc-400">Registered Phone</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 block">+91 98765 43210</span>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-[#0D1127] rounded-xl space-y-1 border border-zinc-100 dark:border-zinc-800">
            <span className="text-[10px] font-bold uppercase text-zinc-400">Guardian Name & Emergency Contact</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 block">Robert Smith (+91 98765 00001)</span>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-[#0D1127] rounded-xl space-y-1 border border-zinc-100 dark:border-zinc-800">
            <span className="text-[10px] font-bold uppercase text-zinc-400">Enrollment Batch</span>
            <span className="font-bold text-[#313866] dark:text-[#8A92D0] block">2024 - 2028 B.Tech CSE</span>
          </div>
        </div>
      </div>

      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
    </div>
  );
};
