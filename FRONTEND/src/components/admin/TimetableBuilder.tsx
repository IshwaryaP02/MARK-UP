import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { apiClient } from '../../lib/apiClient';
import { BackButton } from '../common/BackButton';
import {
  Image, FileSpreadsheet, Layers, Upload, CheckCircle2, AlertTriangle,
  Download, Eye, Trash2, Building2, Calendar, Users, RefreshCw,
  BookOpen, UserCheck, ChevronRight, Loader2, GraduationCap, Clock,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface OcrRow { day: string; period: string; subject: string; teacher: string; section: string; }
interface AllocSlot { day: string; period: number | string; section: string; shift: string; teacher: string; employeeId: string; subject: string; subjectName: string; }
interface Dept { id: string; code: string; name: string; }
interface TimetableSlot { id: string; day: string; period: number; startTime: string; endTime: string; subjectCode: string; subjectName: string; facultyName: string; section: string; shift: string; }
interface FacultyItem { id: string; name: string; employeeId: string; }

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5];
const SHIFTS = ['First Shift', 'Second Shift'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const DAY_SHORT: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
  Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat',
};

// ── Sub-components ─────────────────────────────────────────────────────────────
const TimetableGrid: React.FC<{ slots: TimetableSlot[]; label: string }> = ({ slots, label }) => {
  const slotFor = (day: string, period: number, section?: string) =>
    slots.filter(s => s.day === day && s.period === period && (!section || s.section === section));

  const sections = [...new Set(slots.map(s => s.section))].sort();

  if (slots.length === 0) return (
    <div className="p-10 text-center text-xs text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl">
      No timetable data. {label}
    </div>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-[#232326]">
      <table className="w-full text-xs border-collapse min-w-[600px]">
        <thead>
          <tr className="bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-200 dark:border-[#232326]">
            <th className="p-3 text-left w-20">Day</th>
            {PERIODS.map(p => (
              <th key={p} className="p-3 border-l border-zinc-200 dark:border-[#232326] text-center">P{p}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-[#232326]">
          {DAYS.map(day => (
            <tr key={day} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-800/10">
              <td className="p-2 pl-3 font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-50/60 dark:bg-[#0A0A0A]/60 border-r border-zinc-200 dark:border-[#232326]">
                {DAY_SHORT[day]}
              </td>
              {PERIODS.map(p => {
                const daySlots = slotFor(day, p);
                return (
                  <td key={p} className="p-1.5 border-l border-zinc-200 dark:border-[#232326] align-top min-h-[3rem]">
                    {daySlots.length > 0 ? (
                      <div className="space-y-1">
                        {daySlots.map((sl, i) => (
                          <div key={i} className="p-1.5 bg-[#1E40AF]/10 dark:bg-[#2563EB]/30 border border-[#1E40AF]/25 dark:border-[#3B82F6]/30 rounded-lg text-left">
                            <div className="font-bold text-[#1E40AF] dark:text-[#3B82F6] text-[10px] truncate">{sl.subjectCode}</div>
                            {sl.facultyName && <div className="text-[9px] text-zinc-500 dark:text-zinc-400 truncate">{sl.facultyName}</div>}
                            {sections.length > 1 && <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">{sl.section}</div>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-10 flex items-center justify-center text-zinc-300 dark:text-zinc-700 text-[10px]">—</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
export const TimetableBuilder: React.FC = () => {
  const { currentUser, addToast, departments: ctxDepts, facultyList } = useApp();

  const [activeTab, setActiveTab] = useState<'ocr' | 'allocator' | 'view'>('view');

  // Shared
  const [depts, setDepts] = useState<Dept[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedShift, setSelectedShift] = useState('First Shift');
  const [selectedSemester, setSelectedSemester] = useState(1);
  const isHod = currentUser.role === 'hod';

  // OCR tab state
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<{ rawText: string; rows: OcrRow[] } | null>(null);
  const [ocrRows, setOcrRows] = useState<OcrRow[]>([]);
  const [ocrCommitting, setOcrCommitting] = useState(false);
  const [ocrDone, setOcrDone] = useState(false);

  // Allocator tab state
  const [allocFile, setAllocFile] = useState<File | null>(null);
  const [allocSections, setAllocSections] = useState('A, B, C');
  const [allocLoading, setAllocLoading] = useState(false);
  const [allocResult, setAllocResult] = useState<AllocSlot[] | null>(null);
  const [allocCommitting, setAllocCommitting] = useState(false);
  const [allocDone, setAllocDone] = useState(false);

  // View tab state
  const [viewSlots, setViewSlots] = useState<TimetableSlot[]>([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewFacultyId, setViewFacultyId] = useState('');
  const [viewMode, setViewMode] = useState<'class' | 'faculty'>('class');

  // Load departments
  useEffect(() => {
    apiClient.timetableDepartments()
      .then(data => {
        setDepts(data);
        if (data.length > 0 && !selectedDept) setSelectedDept(data[0].id);
      })
      .catch(() => {
        // Fallback to context departments
        const fallback = ctxDepts.map(d => ({ id: d.id, code: d.code, name: d.name }));
        setDepts(fallback);
        if (fallback.length > 0) setSelectedDept(fallback[0].id);
      });
  }, []);

  // Reload view whenever filters change
  const loadView = useCallback(async () => {
    if (!selectedDept) return;
    setViewLoading(true);
    try {
      if (viewMode === 'faculty' && viewFacultyId) {
        const data = await apiClient.getFacultyTimetableById(viewFacultyId);
        setViewSlots(data.map((s: any) => ({
          id: s.id, day: s.day, period: s.period, startTime: s.startTime, endTime: s.endTime,
          subjectCode: s.subjectCode || s.subject || '', subjectName: s.subjectName || '',
          facultyName: s.facultyName || '', section: s.section, shift: s.shift,
        })));
      } else {
        const res = await apiClient.getDeptTimetable(selectedDept, { shift: selectedShift, semester: selectedSemester });
        setViewSlots((res.slots || []).map((s: any) => ({
          id: s.id, day: s.day, period: s.period, startTime: s.startTime, endTime: s.endTime,
          subjectCode: s.subjectCode || '', subjectName: s.subjectName || '',
          facultyName: s.facultyName || '', section: s.section, shift: s.shift,
        })));
      }
    } catch (e: any) {
      addToast('Load Error', e.message || 'Failed to load timetable', 'error');
    }
    setViewLoading(false);
  }, [selectedDept, selectedShift, selectedSemester, viewMode, viewFacultyId]);

  useEffect(() => { if (activeTab === 'view') loadView(); }, [activeTab, loadView]);

  // ── OCR handlers ────────────────────────────────────────────────────────────
  const handleOcrExtract = async () => {
    if (!ocrFile) return addToast('No file', 'Please select an image first.', 'warning');
    if (!selectedDept) return addToast('No department', 'Select a department first.', 'warning');
    setOcrLoading(true); setOcrResult(null); setOcrDone(false);
    try {
      const res = await apiClient.timetableOcr(ocrFile, selectedDept, selectedShift, selectedSemester);
      setOcrResult(res);
      setOcrRows(res.rows as unknown as OcrRow[]);
      addToast('OCR Complete', `Extracted ${res.rowCount} rows from image.`, 'success');
    } catch (e: any) {
      addToast('OCR Failed', e.message, 'error');
    }
    setOcrLoading(false);
  };

  const handleOcrCommit = async () => {
    if (!ocrRows.length) return;
    setOcrCommitting(true);
    try {
      const res = await apiClient.timetableOcrCommit(ocrRows as unknown as Record<string, string>[], selectedDept, selectedShift, selectedSemester);
      addToast('Timetable Saved', `${res.created} slots committed to department.`, 'success');
      if (res.warnings?.length) res.warnings.forEach(w => addToast('Warning', w, 'warning'));
      setOcrDone(true);
    } catch (e: any) {
      addToast('Commit Failed', e.message, 'error');
    }
    setOcrCommitting(false);
  };

  const updateOcrRow = (idx: number, field: keyof OcrRow, val: string) => {
    setOcrRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  };

  // ── Allocator handlers ───────────────────────────────────────────────────────
  const handleAllocGenerate = async () => {
    if (!allocFile) return addToast('No file', 'Please upload the Excel requirements sheet.', 'warning');
    if (!selectedDept) return addToast('No department', 'Select a department first.', 'warning');
    const sections = allocSections.split(',').map(s => s.trim()).filter(Boolean);
    if (!sections.length) return addToast('No sections', 'Enter section names (e.g. A, B, C)', 'warning');
    setAllocLoading(true); setAllocResult(null); setAllocDone(false);
    try {
      const res = await apiClient.timetableAllocate(allocFile, sections, selectedShift, selectedSemester, selectedDept);
      setAllocResult(res.allocation as unknown as AllocSlot[]);
      addToast('Timetable Generated', `${res.totalSlots} slots generated. Review below then publish.`, 'success');
    } catch (e: any) {
      addToast('Generation Failed', e.message, 'error');
    }
    setAllocLoading(false);
  };

  const handleAllocCommit = async () => {
    if (!allocResult) return;
    setAllocCommitting(true);
    try {
      const res = await apiClient.timetableAllocateCommit(allocResult as unknown as Record<string, string | number>[], selectedDept, selectedShift, selectedSemester);
      addToast('Timetable Published', `${res.created} slots saved to department.`, 'success');
      if (res.warnings?.length) res.warnings.forEach(w => addToast('Warning', w, 'warning'));
      setAllocDone(true);
    } catch (e: any) {
      addToast('Publish Failed', e.message, 'error');
    }
    setAllocCommitting(false);
  };

  const deptFaculty = facultyList.filter(f => f.departmentId === selectedDept);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <BackButton />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-[#1E40AF]/10 text-[#1E40AF] dark:bg-[#2563EB]/50 dark:text-[#3B82F6] text-[10px] font-bold uppercase rounded-md">
              Timetable Management
            </span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mt-1">
            Class Timetable Builder
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Build via OCR image scan · Auto-allocate via Excel · View & manage slots
          </p>
        </div>
      </div>

      {/* Global Controls */}
      <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1.5 flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Department
            </label>
            <select
              value={selectedDept}
              disabled={isHod}
              onChange={e => setSelectedDept(e.target.value)}
              className={`w-full p-2.5 text-xs font-semibold border rounded-xl ${isHod ? 'bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed' : 'bg-zinc-50 dark:bg-[#0A0A0A]'} border-zinc-200 dark:border-zinc-700`}
            >
              {depts.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1.5 flex items-center gap-1">
              <Layers className="w-3 h-3" /> Shift
            </label>
            <select
              value={selectedShift}
              onChange={e => setSelectedShift(e.target.value)}
              className="w-full p-2.5 text-xs font-semibold bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl"
            >
              {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1.5 flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> Semester
            </label>
            <select
              value={selectedSemester}
              onChange={e => setSelectedSemester(Number(e.target.value))}
              className="w-full p-2.5 text-xs font-semibold bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl"
            >
              {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadView}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-[#1E40AF]/10 hover:bg-[#1E40AF]/20 text-[#1E40AF] dark:text-[#3B82F6] border border-[#1E40AF]/20 dark:border-[#3B82F6]/30 rounded-xl text-xs font-bold transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh View
            </button>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2">
        {([
          { id: 'view', label: 'View Timetable', icon: Eye },
          { id: 'ocr', label: 'OCR Builder', icon: Image },
          { id: 'allocator', label: 'Auto Allocator', icon: FileSpreadsheet },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
              activeTab === id
                ? 'bg-[#1E40AF] text-white dark:bg-[#2563EB] border-[#1E40AF]'
                : 'bg-white dark:bg-[#0A0A0A] text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-[#232326] hover:border-[#3B82F6]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* ── View Tab ──────────────────────────────────────────────────────────── */}
      {activeTab === 'view' && (
        <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" /> Timetable View
            </h3>
            <div className="flex gap-2">
              {(['class', 'faculty'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                    viewMode === mode
                      ? 'bg-[#1E40AF] text-white dark:bg-[#2563EB] border-[#1E40AF]'
                      : 'bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-600 border-zinc-200 dark:border-[#232326]'
                  }`}
                >
                  {mode === 'class' ? <><GraduationCap className="w-3 h-3 inline mr-1" />Class View</> : <><UserCheck className="w-3 h-3 inline mr-1" />Faculty View</>}
                </button>
              ))}
            </div>
          </div>

          {viewMode === 'faculty' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Select Faculty</label>
              <select
                value={viewFacultyId}
                onChange={e => { setViewFacultyId(e.target.value); loadView(); }}
                className="w-full p-2.5 text-xs font-semibold bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl"
              >
                <option value="">— Select a faculty member —</option>
                {deptFaculty.map(f => <option key={f.id} value={f.id}>{f.name} {f.employeeId ? `(${f.employeeId})` : ''}</option>)}
              </select>
            </div>
          )}

          {viewLoading ? (
            <div className="flex items-center justify-center py-12 text-zinc-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading timetable…
            </div>
          ) : (
            <TimetableGrid slots={viewSlots} label={viewMode === 'class' ? 'Build timetable via OCR or Allocator tab.' : 'Select a faculty member above.'} />
          )}
          <p className="text-[10px] text-zinc-400">{viewSlots.length} slots loaded</p>
        </div>
      )}

      {/* ── OCR Tab ───────────────────────────────────────────────────────────── */}
      {activeTab === 'ocr' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl p-4 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Image className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" />
              Step 1 — Upload Timetable Image
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Upload a photo/scan of a handwritten or printed timetable.
              The system will extract text and parse it into structured rows.
              <strong className="text-zinc-700 dark:text-zinc-200"> Requires Tesseract OCR installed on the server.</strong>
            </p>

            {/* File drop zone */}
            <label className="block cursor-pointer">
              <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${ocrFile ? 'border-[#1E40AF]/50 bg-[#1E40AF]/5 dark:bg-[#2563EB]/10' : 'border-zinc-300 dark:border-zinc-700 hover:border-[#3B82F6]'}`}>
                {ocrFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-[#1E40AF] dark:text-[#3B82F6]" />
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{ocrFile.name}</span>
                    <span className="text-xs text-zinc-500">{(ocrFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-zinc-400">
                    <Upload className="w-8 h-8" />
                    <span className="font-semibold text-sm">Click or drag image here</span>
                    <span className="text-xs">Supports JPG, PNG, TIFF, BMP</span>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={e => { setOcrFile(e.target.files?.[0] || null); setOcrResult(null); setOcrDone(false); }} />
            </label>

            <button
              onClick={handleOcrExtract}
              disabled={!ocrFile || ocrLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1E40AF] hover:bg-[#1E3A8A] dark:bg-[#2563EB] dark:hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {ocrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              {ocrLoading ? 'Extracting…' : 'Extract Timetable'}
            </button>
          </div>

          {/* OCR Preview & Edit */}
          {ocrResult && (
            <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-500" />
                  Step 2 — Review & Edit Extracted Rows ({ocrRows.length})
                </h3>
                {ocrDone && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> Committed!
                  </span>
                )}
              </div>

              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-[#232326]">
                <table className="w-full text-xs border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-500 font-semibold uppercase tracking-wider border-b border-zinc-200 dark:border-[#232326]">
                      {['Day', 'Period', 'Subject Code', 'Teacher Name', 'Section'].map(h => (
                        <th key={h} className="p-2.5 text-left border-r border-zinc-200 dark:border-[#232326] last:border-r-0">{h}</th>
                      ))}
                      <th className="p-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-[#232326]">
                    {ocrRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/20">
                        {(['day', 'period', 'subject', 'teacher', 'section'] as const).map(field => (
                          <td key={field} className="p-1.5 border-r border-zinc-100 dark:border-[#232326] last:border-r-0">
                            <input
                              value={row[field]}
                              onChange={e => updateOcrRow(idx, field, e.target.value)}
                              className="w-full p-1.5 text-xs bg-transparent border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-[#3B82F6] rounded-lg outline-none transition-colors"
                            />
                          </td>
                        ))}
                        <td className="p-1.5 text-center">
                          <button onClick={() => setOcrRows(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setOcrRows(prev => [...prev, { day: 'Monday', period: '1', subject: '', teacher: '', section: 'A' }])}
                  className="px-3 py-1.5 text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                >
                  + Add Row
                </button>
                <button
                  onClick={handleOcrCommit}
                  disabled={ocrCommitting || ocrRows.length === 0 || ocrDone}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {ocrCommitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {ocrDone ? 'Committed!' : ocrCommitting ? 'Saving…' : `Commit ${ocrRows.length} Slots to DB`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Allocator Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'allocator' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl p-4 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" />
              Step 1 — Upload Requirements Excel
            </h3>

            {/* Template download hint */}
            <div className="p-3 rounded-xl bg-[#1E40AF]/5 dark:bg-[#2563EB]/10 border border-[#1E40AF]/15 dark:border-[#3B82F6]/20 text-xs text-zinc-600 dark:text-zinc-400">
              <p className="font-bold text-zinc-800 dark:text-zinc-200 mb-1">Required Excel Columns:</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1">
                {['Teacher_Name', 'Faculty_ID', 'Subject', 'Required_Hours', 'Shift_Assigned'].map(col => (
                  <span key={col} className="px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono text-[10px]">{col}</span>
                ))}
              </div>
              <p className="mt-2 text-zinc-500">
                <strong>Faculty_ID</strong> = employee_id in your DB (e.g. FAC001).&nbsp;
                <strong>Shift_Assigned</strong> = "First Shift" or "Second Shift" (or 1 / 2).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                <Users className="w-3.5 h-3.5 inline mr-1" /> Sections for this shift (comma-separated)
              </label>
              <input
                value={allocSections}
                onChange={e => setAllocSections(e.target.value)}
                placeholder="e.g. A, B, C, D, E"
                className="w-full p-2.5 text-xs font-semibold bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
              <p className="text-[10px] text-zinc-400 mt-1">Shift 1 → A–E, Shift 2 → F–J (or define your own)</p>
            </div>

            <label className="block cursor-pointer">
              <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${allocFile ? 'border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-900/10' : 'border-zinc-300 dark:border-zinc-700 hover:border-[#3B82F6]'}`}>
                {allocFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{allocFile.name}</span>
                    <span className="text-xs text-zinc-500">{(allocFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-zinc-400">
                    <FileSpreadsheet className="w-8 h-8" />
                    <span className="font-semibold text-sm">Click or drag Excel file here</span>
                    <span className="text-xs">.xlsx or .xls</span>
                  </div>
                )}
              </div>
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={e => { setAllocFile(e.target.files?.[0] || null); setAllocResult(null); setAllocDone(false); }} />
            </label>

            <button
              onClick={handleAllocGenerate}
              disabled={!allocFile || allocLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1E40AF] hover:bg-[#1E3A8A] dark:bg-[#2563EB] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {allocLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              {allocLoading ? 'Generating…' : 'Generate Timetable'}
            </button>
          </div>

          {/* Allocator Preview */}
          {allocResult && (
            <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-500" />
                  Step 2 — Preview Generated Timetable ({allocResult.length} slots)
                </h3>
                {allocDone && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> Published!
                  </span>
                )}
              </div>

              <TimetableGrid
                slots={allocResult.map(s => ({
                  id: `${s.day}-${s.period}-${s.section}`,
                  day: s.day, period: Number(s.period),
                  startTime: '', endTime: '',
                  subjectCode: String(s.subject), subjectName: String(s.subjectName || s.subject),
                  facultyName: String(s.teacher), section: String(s.section), shift: String(s.shift),
                }))}
                label="Generated by auto-allocator."
              />

              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-[#232326]">
                <table className="w-full text-xs border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-500 font-semibold uppercase tracking-wider border-b border-zinc-200 dark:border-[#232326]">
                      {['Day', 'Period', 'Section', 'Subject', 'Teacher', 'Emp ID', 'Shift'].map(h => (
                        <th key={h} className="p-2.5 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-[#232326]">
                    {allocResult.slice(0, 50).map((sl, i) => (
                      <tr key={i} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/20">
                        <td className="p-2 font-semibold">{sl.day}</td>
                        <td className="p-2 text-center">{sl.period}</td>
                        <td className="p-2 font-bold text-[#1E40AF] dark:text-[#3B82F6]">{sl.section}</td>
                        <td className="p-2 font-mono text-emerald-700 dark:text-emerald-400">{sl.subject}</td>
                        <td className="p-2">{sl.teacher}</td>
                        <td className="p-2 text-zinc-500 font-mono text-[10px]">{sl.employeeId}</td>
                        <td className="p-2 text-zinc-500">{sl.shift}</td>
                      </tr>
                    ))}
                    {allocResult.length > 50 && (
                      <tr><td colSpan={7} className="p-2 text-center text-zinc-400 text-[10px]">… {allocResult.length - 50} more slots not shown</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleAllocCommit}
                  disabled={allocCommitting || allocDone}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {allocCommitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {allocDone ? 'Published!' : allocCommitting ? 'Publishing…' : 'Publish Timetable to DB'}
                </button>
                <p className="text-xs text-zinc-500">This will replace existing timetable for {selectedShift}, Semester {selectedSemester}.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
