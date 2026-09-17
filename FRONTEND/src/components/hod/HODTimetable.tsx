import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { apiClient } from '../../lib/apiClient';
import { BackButton } from '../common/BackButton';
import {
  Calendar, UserCheck, Loader2, Building2, Users,
  GraduationCap, Layers, Clock, BookOpen, Eye
} from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const PERIODS = [1, 2, 3, 4, 5];
const DAY_SHORT: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
  Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat',
};
const SHIFT1_TIMES: Record<number, string> = {
  1: '8:00 AM', 2: '9:00 AM', 3: '10:10 AM', 4: '11:10 AM', 5: '12:10 PM',
};
const SHIFT2_TIMES: Record<number, string> = {
  1: '1:30 PM', 2: '2:30 PM', 3: '3:30 PM', 4: '4:30 PM', 5: '5:30 PM',
};

interface TSlot {
  id: string; day: string; period: number;
  subjectCode: string; subjectName: string; facultyName: string;
  section: string; shift: string; semester: number;
}
interface FacultyItem { id: string; name: string; employeeId?: string; }

export const HODTimetable: React.FC = () => {
  const { currentUser, facultyList, addToast } = useApp();

  const [deptSlots, setDeptSlots] = useState<TSlot[]>([]);
  const [facSlots, setFacSlots] = useState<TSlot[]>([]);
  const [deptLoading, setDeptLoading] = useState(true);
  const [facLoading, setFacLoading] = useState(false);

  const [selectedShift, setSelectedShift] = useState('First Shift');
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [viewMode, setViewMode] = useState<'dept' | 'faculty'>('dept');

  const deptId = currentUser.departmentId;

  // Dept timetable
  const loadDeptTimetable = useCallback(async () => {
    if (!deptId) return;
    setDeptLoading(true);
    try {
      const res = await apiClient.getDeptTimetable(deptId, {
        shift: selectedShift,
        semester: selectedSemester,
        section: selectedSection || undefined,
      });
      setDeptSlots((res.slots || []).map((s: any) => ({
        id: s.id, day: s.day, period: s.period,
        subjectCode: s.subjectCode || '', subjectName: s.subjectName || '',
        facultyName: s.facultyName || '', section: s.section,
        shift: s.shift || 'First Shift', semester: s.semester || 1,
      })));
    } catch (e: any) {
      addToast('Load Error', e.message, 'error');
    }
    setDeptLoading(false);
  }, [deptId, selectedShift, selectedSemester, selectedSection]);

  useEffect(() => { if (viewMode === 'dept') loadDeptTimetable(); }, [viewMode, loadDeptTimetable]);

  // Faculty timetable
  const loadFacultyTimetable = useCallback(async (facId: string) => {
    if (!facId) return;
    setFacLoading(true);
    try {
      const data = await apiClient.getFacultyTimetableById(facId);
      setFacSlots(data.map((s: any) => ({
        id: s.id, day: s.day, period: s.period,
        subjectCode: s.subjectCode || '', subjectName: s.subjectName || '',
        facultyName: s.facultyName || '', section: s.section,
        shift: s.shift || 'First Shift', semester: s.semester || 1,
      })));
    } catch (e: any) {
      addToast('Load Error', e.message, 'error');
    }
    setFacLoading(false);
  }, []);

  useEffect(() => {
    if (viewMode === 'faculty' && selectedFacultyId) loadFacultyTimetable(selectedFacultyId);
  }, [viewMode, selectedFacultyId, loadFacultyTimetable]);

  // Filter faculty list to HOD's department
  const myFaculty = facultyList.filter(f => f.departmentId === deptId);

  const activeSlots = viewMode === 'dept' ? deptSlots : facSlots;
  const isLoading = viewMode === 'dept' ? deptLoading : facLoading;

  const shift = activeSlots[0]?.shift || selectedShift;
  const periodLabels = shift.includes('2') || shift.toLowerCase().includes('second')
    ? SHIFT2_TIMES : SHIFT1_TIMES;

  const slotFor = (day: string, period: number) =>
    activeSlots.filter(s => s.day === day && s.period === period);

  // Available sections from loaded slots
  const sections = [...new Set(deptSlots.map(s => s.section))].sort();

  return (
    <div className="space-y-6">
      <BackButton />

      {/* Header */}
      <div className="pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#1E40AF] dark:text-[#3B82F6]" />
          Department Timetable View
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          View your department's class timetable or any individual faculty's schedule.
        </p>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2">
        {([
          { id: 'dept', label: 'Class View', icon: GraduationCap },
          { id: 'faculty', label: 'Faculty View', icon: UserCheck },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setViewMode(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
              viewMode === id
                ? 'bg-[#1E40AF] text-white dark:bg-[#2563EB] border-[#1E40AF]'
                : 'bg-white dark:bg-[#0A0A0A] text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-[#232326] hover:border-[#3B82F6]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl p-4 shadow-sm">
        {viewMode === 'dept' ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5 flex items-center gap-1">
                <Layers className="w-3 h-3" /> Shift
              </label>
              <select
                value={selectedShift}
                onChange={e => setSelectedShift(e.target.value)}
                className="w-full p-2.5 text-xs font-semibold bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              >
                <option>First Shift</option>
                <option>Second Shift</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5 flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> Semester
              </label>
              <select
                value={selectedSemester}
                onChange={e => setSelectedSemester(Number(e.target.value))}
                className="w-full p-2.5 text-xs font-semibold bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              >
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5 flex items-center gap-1">
                <Users className="w-3 h-3" /> Section
              </label>
              <select
                value={selectedSection}
                onChange={e => setSelectedSection(e.target.value)}
                className="w-full p-2.5 text-xs font-semibold bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              >
                <option value="">All Sections</option>
                {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={loadDeptTimetable}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-[#1E40AF]/10 hover:bg-[#1E40AF]/20 text-[#1E40AF] dark:text-[#3B82F6] border border-[#1E40AF]/20 dark:border-[#3B82F6]/30 rounded-xl text-xs font-bold transition-all"
              >
                <Eye className="w-3.5 h-3.5" /> Load
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" /> Select Faculty Member
            </label>
            <select
              value={selectedFacultyId}
              onChange={e => setSelectedFacultyId(e.target.value)}
              className="w-full p-2.5 text-xs font-semibold bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl max-w-sm"
            >
              <option value="">— Select a faculty member —</option>
              {myFaculty.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} {f.employeeId ? `(${f.employeeId})` : ''}
                </option>
              ))}
            </select>
            {myFaculty.length === 0 && (
              <p className="text-xs text-zinc-400 mt-1">No faculty found in your department.</p>
            )}
          </div>
        )}
      </div>

      {/* Timetable Grid */}
      <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-zinc-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
          </div>
        ) : activeSlots.length === 0 ? (
          <div className="py-16 text-center text-sm text-zinc-400">
            {viewMode === 'dept'
              ? 'No timetable found for these filters. Try building one from the Timetable Builder.'
              : selectedFacultyId
                ? 'No timetable slots assigned to this faculty.'
                : 'Select a faculty member to view their timetable.'
            }
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse min-w-[580px]">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-[#232326] text-zinc-500 font-semibold uppercase tracking-wider">
                  <th className="p-3 w-24 text-left pl-4">Day</th>
                  {PERIODS.map(p => (
                    <th key={p} className="p-3 border-l border-zinc-200 dark:border-[#232326]">
                      <div className="font-bold text-zinc-700 dark:text-zinc-200">P{p}</div>
                      <div className="text-[9px] normal-case font-normal text-zinc-400 mt-0.5">
                        {periodLabels[p]}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-[#232326]">
                {DAYS.map(day => (
                  <tr key={day} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-800/10">
                    <td className="p-3 font-bold text-left pl-4 bg-zinc-50/60 dark:bg-[#0A0A0A]/60 text-zinc-900 dark:text-zinc-100 border-r border-zinc-200 dark:border-[#232326]">
                      {DAY_SHORT[day]}
                    </td>
                    {PERIODS.map(p => {
                      const slots = slotFor(day, p);
                      return (
                        <td key={p} className="p-1.5 border-l border-zinc-200 dark:border-[#232326] align-top min-h-[64px]">
                          {slots.length > 0 ? (
                            <div className="space-y-1">
                              {slots.map((sl, i) => (
                                <div key={i} className="p-1.5 bg-[#1E40AF]/10 dark:bg-[#2563EB]/30 border border-[#1E40AF]/20 dark:border-[#3B82F6]/25 rounded-lg text-left">
                                  <div className="font-bold text-[#1E40AF] dark:text-[#3B82F6] text-[10px] truncate">{sl.subjectCode}</div>
                                  {viewMode === 'dept' && (
                                    <div className="text-[9px] text-zinc-500 dark:text-zinc-400 truncate">{sl.facultyName}</div>
                                  )}
                                  {viewMode === 'faculty' && (
                                    <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">§{sl.section}</div>
                                  )}
                                  {viewMode === 'dept' && (
                                    <div className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400">§{sl.section}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="h-12 flex items-center justify-center text-zinc-300 dark:text-zinc-700 text-[10px]">—</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats footer */}
      {activeSlots.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> {activeSlots.length} total slots
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {[...new Set(activeSlots.map(s => s.facultyName).filter(Boolean))].length} faculty
          </span>
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            {[...new Set(activeSlots.map(s => s.subjectCode).filter(Boolean))].length} subjects
          </span>
          <span className="flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5" />
            {[...new Set(activeSlots.map(s => s.section))].join(', ')} sections
          </span>
        </div>
      )}
    </div>
  );
};
