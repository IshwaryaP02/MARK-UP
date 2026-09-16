import React, { useState } from 'react';
import { FileSpreadsheet, Image as ImageIcon, Loader2, WandSparkles } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useApp } from '../../context/AppContext';

type AutomationPanelProps = { departments: Array<{ id: string; name: string; code: string }> };

type AllocationRow = { day: string | number; period: string | number; section: string | number; shift: string | number; teacher: string | number; subject: string | number };

export const TimetableAutomationPanel: React.FC<AutomationPanelProps> = ({ departments }) => {
  const { currentUser, addToast } = useApp();
  const [departmentId, setDepartmentId] = useState(currentUser.departmentId || departments[0]?.id || '');
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [sections, setSections] = useState('A, B, C');
  const [ocrText, setOcrText] = useState('');
  const [allocation, setAllocation] = useState<AllocationRow[]>([]);
  const [busy, setBusy] = useState<'ocr' | 'allocate' | null>(null);
  const isHod = currentUser.role === 'hod';

  const runOcr = async () => {
    if (!ocrFile) return;
    setBusy('ocr');
    try {
      const result = await apiClient.timetableOcr(ocrFile, isHod ? undefined : departmentId);
      setOcrText(result.rawText || 'No text was detected. Try a clearer image.');
      addToast('OCR complete', `${result.rows.length} timetable rows detected`, 'success');
    } catch (error) {
      addToast('OCR failed', error instanceof Error ? error.message : 'Could not process image', 'danger');
    } finally {
      setBusy(null);
    }
  };

  const runAllocator = async () => {
    if (!excelFile) return;
    const sectionList = sections.split(',').map((value) => value.trim()).filter(Boolean);
    setBusy('allocate');
    try {
      const result = await apiClient.timetableAllocate(excelFile, sectionList, sectionList.length, isHod ? undefined : departmentId);
      setAllocation(result.allocation as AllocationRow[]);
      addToast('Timetable generated', `${result.totalSlots} slots allocated`, 'success');
    } catch (error) {
      addToast('Allocation failed', error instanceof Error ? error.message : 'No feasible timetable found', 'danger');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl p-4 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <WandSparkles className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" />
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Timetable Automation</h3>
          <p className="text-[11px] text-zinc-500">OCR handwritten schedules or generate a collision-free timetable from Excel requirements.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-3">
          <h4 className="text-xs font-bold flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> OCR Builder</h4>
          <select value={departmentId} disabled={isHod} onChange={(event) => setDepartmentId(event.target.value)} className="w-full p-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent">
            {departments.map((department) => <option key={department.id} value={department.id}>{department.name} ({department.code})</option>)}
          </select>
          <input type="file" accept="image/*" onChange={(event) => setOcrFile(event.target.files?.[0] || null)} className="w-full text-xs" />
          <button type="button" disabled={!ocrFile || busy !== null} onClick={runOcr} className="w-full flex justify-center items-center gap-2 px-3 py-2 rounded-lg bg-[#1E40AF] text-white text-xs font-bold disabled:opacity-50">
            {busy === 'ocr' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />} Extract timetable text
          </button>
          {ocrText && <pre className="max-h-32 overflow-auto whitespace-pre-wrap text-[11px] bg-zinc-50 dark:bg-zinc-900 rounded-lg p-2">{ocrText}</pre>}
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-3">
          <h4 className="text-xs font-bold flex items-center gap-1.5"><FileSpreadsheet className="w-3.5 h-3.5" /> Timetable Allocator</h4>
          {!isHod && <select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className="w-full p-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent">
            {departments.map((department) => <option key={department.id} value={department.id}>{department.name} ({department.code})</option>)}
          </select>}
          <input type="file" accept=".xlsx,.xls" onChange={(event) => setExcelFile(event.target.files?.[0] || null)} className="w-full text-xs" />
          <input value={sections} onChange={(event) => setSections(event.target.value)} placeholder="Sections: A, B, C" className="w-full p-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent" />
          <button type="button" disabled={!excelFile || busy !== null} onClick={runAllocator} className="w-full flex justify-center items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold disabled:opacity-50">
            {busy === 'allocate' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <WandSparkles className="w-3.5 h-3.5" />} Generate constrained timetable
          </button>
          {allocation.length > 0 && <div className="max-h-32 overflow-auto text-[10px] rounded-lg border border-zinc-200 dark:border-zinc-800"><table className="w-full"><thead><tr className="text-left bg-zinc-50 dark:bg-zinc-900"><th className="p-1.5">Day</th><th>Period</th><th>Class</th><th>Shift</th><th>Subject</th><th>Teacher</th></tr></thead><tbody>{allocation.map((row, index) => <tr key={`${row.day}-${row.period}-${row.section}-${index}`} className="border-t border-zinc-100 dark:border-zinc-800"><td className="p-1.5">{row.day}</td><td>{row.period}</td><td>{row.section}</td><td>{row.shift}</td><td>{row.subject}</td><td>{row.teacher}</td></tr>)}</tbody></table></div>}
        </div>
      </div>
    </section>
  );
};
