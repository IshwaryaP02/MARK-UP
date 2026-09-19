import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { circularVisibleToStudent, circularRecipientLabel } from '../../services/circularTargeting';
import { FileText, Calendar, Users, Building2, GraduationCap, Paperclip } from 'lucide-react';
import { BackButton } from '../common/BackButton';

export const StudentCirculars: React.FC = () => {
  const { circulars, currentUser, facultyList, setActiveScreen } = useApp();

  const visibleCirculars = useMemo(() => {
    return circulars.filter((c) => circularVisibleToStudent(c, currentUser));
  }, [circulars, currentUser]);

  const getIssuerLabel = (name: string): string => {
    const fac = facultyList.find((f) => f.name === name);
    if (fac?.isHOD) return 'HOD';
    if (fac) return 'Faculty';
    if (/^dr/i.test(name)) return 'HOD';
    return 'Faculty';
  };

  const getTargetLabel = (target: string) => {
    switch (target) {
      case 'tutor_class':
        return 'Tutor Class';
      case 'specific_students':
        return 'Specific Students';
      case 'all_students':
        return 'All Students';
      default:
        return 'Students';
    }
  };

  return (
    <div className="space-y-6">
      <BackButton label="Back to Dashboard" />

      <div className="pb-2 border-b border-[#E2E8F0] dark:border-zinc-800">
        <h2 className="text-lg font-bold text-[#0F172A] dark:text-zinc-100 tracking-tight flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#2563EB] dark:text-[#3B82F6]" /> Circulars
        </h2>
      </div>

      {visibleCirculars.length === 0 ? (
        <div className="p-8 bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-zinc-800 rounded-2xl text-center">
          <FileText className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-[#000000] dark:text-[#64748B] dark:text-zinc-400">No circulars published yet.</p>
          <p className="text-xs text-[#000000] dark:text-[#64748B] dark:text-zinc-500 mt-1">
            Circulars issued by your department will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visibleCirculars.map((c) => (
            <div
              key={c.id}
              className="bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-[#232326] rounded-2xl p-5 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-[#2563EB]/10 dark:bg-[#2563EB]/50 rounded-xl shrink-0">
                    <FileText className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
                  </span>
                  <h3 className="text-sm font-bold text-[#0F172A] dark:text-zinc-100 leading-snug">{c.title}</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 bg-[#FFFFFF] dark:bg-[#2563EB]/40 text-[#2563EB] dark:text-[#3B82F6] border border-[#2563EB]/20 dark:border-[#3B82F6]/40">
                  {getIssuerLabel(c.createdBy)}
                </span>
              </div>

              <p className="text-xs text-[#1E293B] dark:text-zinc-300 leading-relaxed line-clamp-3">{c.description}</p>

              {c.attachmentUrl && (
                <a
                  href={c.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] dark:text-[#3B82F6] hover:underline"
                >
                  <Paperclip className="w-3.5 h-3.5" /> {c.attachmentName || 'View Attachment'}
                </a>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 border-t border-[#E2E8F0] dark:border-zinc-800 text-[10px] text-[#000000] dark:text-[#64748B] dark:text-zinc-400 font-semibold">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 text-[#2563EB] dark:text-[#3B82F6]" />
                  Issued by {c.createdBy}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-[#2563EB] dark:text-[#3B82F6]" />
                  {circularRecipientLabel(c)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#2563EB] dark:text-[#3B82F6]" />
                  {c.validFrom} to {c.validUntil}
                </span>
                {c.departmentName && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-[#2563EB] dark:text-[#3B82F6]" />
                    {c.departmentName}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};