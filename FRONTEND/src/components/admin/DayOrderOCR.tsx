import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StaffDayOrder, DayOrderEntry } from '../../types';
import { Modal } from '../common/Modal';
import { BackButton } from '../common/BackButton';
import {
  Plus,
  Trash2,
  Upload,
  ScanLine,
  ImageIcon,
  Save,
  Loader2,
  CalendarDays,
  RotateCcw,
  FileText,
  Eye
} from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// ---------- Day Order OCR parsing helpers ----------

function parseDateToken(tok: string, fallbackYear?: number): string | null {
  const m = tok.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (!m) return null;
  let day = parseInt(m[1], 10);
  let month = parseInt(m[2], 10);
  let year = parseInt(m[3], 10);
  if (year < 100) year += 2000;
  if (month > 12 && day <= 12) {
    const tmp = day;
    day = month;
    month = tmp;
  }
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  if (fallbackYear && year < fallbackYear - 1) year = fallbackYear;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function romanToNumber(token: string): number | null {
  const t = token.trim().toUpperCase();
  const roman: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };
  if (roman[t] != null) return roman[t];
  return null;
}

const HOLIDAY_RE = /விடுமுறை|விடுமுறையும்|holiday|leave|weekly\s*off|compensatory|vacation|closed|public\s*holiday|government/i;

function parseDayOrderText(rawText: string, month: string): DayOrderEntry[] {
  const [fy, fm] = month.split('-').map(Number);
  const lines = rawText.split(/\r?\n/);
  const entries: DayOrderEntry[] = [];
  const seen = new Set<string>();

  const pushEntry = (date: string, order?: number | null, holiday?: boolean, holidayTitle?: string) => {
    if (seen.has(date)) return;
    seen.add(date);
    entries.push({
      date,
      dayOrder: typeof order === 'number' && order >= 1 ? order : undefined,
      isHoliday: !!holiday,
      holidayTitle: holiday ? holidayTitle || 'Holiday' : undefined,
    });
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const tokens = line.split(/\s+/).filter(Boolean);

    let date: string | null = null;
    let dateFound = false;
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      const full = parseDateToken(tok, fy || new Date().getFullYear());
      if (full) {
        const [yy, mo] = full.split('-').map(Number);
        if (!fm || mo === fm) {
          date = full;
          dateFound = true;
          break;
        }
      }
      if (/^\d{1,2}$/.test(tok)) {
        const day = parseInt(tok, 10);
        if (day >= 1 && day <= 31) {
          date = `${fy || new Date().getFullYear()}-${String(fm).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          dateFound = true;
          break;
        }
      }
    }
    if (!dateFound || !date) continue;

    let dayOrder: number | null = null;
    let holiday = false;
    let holidayTitle: string | undefined;

    for (const tok of tokens) {
      if (HOLIDAY_RE.test(tok)) {
        holiday = true;
        if (!holidayTitle) holidayTitle = tok;
        continue;
      }
      const roman = romanToNumber(tok);
      if (roman != null && roman >= 1) {
        dayOrder = roman;
        continue;
      }
      if (/^\d{1,2}$/.test(tok)) {
        const n = parseInt(tok, 10);
        if (n >= 1 && n <= 31 && n <= 7) {
          dayOrder = n;
        }
      }
      if (tok === '-') {
        dayOrder = null;
      }
    }

    pushEntry(date, dayOrder, holiday, holidayTitle);
  }

  return entries.sort((a, b) => (a.date < b.date ? -1 : 1));
}

// ---------- Component ----------

export const DayOrderOCR: React.FC = () => {
  const {
    staffDayOrders,
    saveStaffDayOrder,
    updateStaffDayOrder,
    addToast
  } = useApp();

  const [editingSchedule, setEditingSchedule] = useState<StaffDayOrder | null>(null);
  const [dayTitle, setDayTitle] = useState('');
  const [dayMonth, setDayMonth] = useState(new Date().toISOString().slice(0, 7));
  const [imageUrl, setImageUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [entries, setEntries] = useState<DayOrderEntry[]>([]);
  const [viewingSchedule, setViewingSchedule] = useState<StaffDayOrder | null>(null);

  const monthLabel = (ym: string) => {
    const [y, m] = ym.split('-').map(Number);
    return `${MONTHS[(m ?? 1) - 1]} ${y}`;
  };

  const sortedSchedules = useMemo(
    () => [...staffDayOrders].sort((a, b) => (a.month < b.month ? 1 : -1)),
    [staffDayOrders]
  );

  const handleFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      addToast('Invalid File', 'Please upload an image (PNG/JPG) of the day order schedule.', 'danger');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(String(reader.result));
      setRawText('');
      setEntries([]);
    };
    reader.readAsDataURL(file);
  };

  const runOCR = async () => {
    if (!imageUrl) {
      addToast('No Image', 'Upload a schedule image first.', 'danger');
      return;
    }
    setOcrBusy(true);
    setOcrProgress(0);
    setRawText('');
    try {
      const Tesseract = await import('tesseract.js');
      const worker = await Tesseract.createWorker('eng', 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        }
      });
      const { data } = await worker.recognize(imageUrl);
      await worker.terminate();
      const text = data.text || '';
      setRawText(text);
      setEntries(parseDayOrderText(text, dayMonth));
      if (entries.length === 0) {
        addToast('OCR Complete', 'Could not auto-detect dates/orders — verify the date order table below.', 'info');
      }
    } catch (err) {
      console.error(err);
      addToast('OCR Failed', 'Could not read the image text. Please try again.', 'danger');
    } finally {
      setOcrBusy(false);
    }
  };

  const resetDayOrder = () => {
    setImageUrl('');
    setRawText('');
    setEntries([]);
    setDayTitle('');
    setDayMonth(new Date().toISOString().slice(0, 7));
    setEditingSchedule(null);
  };

  const editEntry = (i: number, patch: Partial<DayOrderEntry>) => {
    setEntries((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  };

  const removeEntry = (i: number) => setEntries((prev) => prev.filter((_, idx) => idx !== i));

  const addEntryRow = () => {
    const date = editingSchedule
      ? editingSchedule.entries[editingSchedule.entries.length - 1]?.date || dayMonth + '-01'
      : entries[entries.length - 1]?.date || dayMonth + '-01';
    const lastDate = date.split('-').map(Number);
    const d = new Date(lastDate[0], lastDate[1] - 1, lastDate[2]);
    d.setDate(d.getDate() + 1);
    setEntries((prev) => [
      ...prev,
      { date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, dayOrder: 1, isHoliday: false }
    ]);
  };

  const saveDayOrder = () => {
    if (entries.length === 0) {
      addToast('No Entries', 'Add at least one date → day order row before saving.', 'danger');
      return;
    }
    const dupe = entries.filter((e, i) => entries.findIndex((x) => x.date === e.date) !== i);
    if (dupe.length > 0) {
      addToast('Duplicate Dates', 'Each date can appear only once in the schedule.', 'danger');
      return;
    }
    const trimmed: DayOrderEntry[] = entries
      .map((e) => ({
        date: e.date,
        dayOrder: Number(e.dayOrder) >= 1 ? Number(e.dayOrder) : undefined,
        isHoliday: !!e.isHoliday,
        holidayTitle: e.isHoliday ? e.holidayTitle : undefined,
      }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
    const title = dayTitle.trim() || `Monthly Day Order`;
    if (editingSchedule) {
      updateStaffDayOrder({ ...editingSchedule, month: dayMonth, title, imageUrl, entries: trimmed });
      setEditingSchedule(null);
    } else {
      saveStaffDayOrder({ month: dayMonth, title, imageUrl, entries: trimmed });
    }
    setImageUrl('');
    setRawText('');
    setEntries([]);
    setDayTitle('');
  };

  const loadForEdit = (s: StaffDayOrder) => {
    setEditingSchedule(s);
    setDayMonth(s.month);
    setDayTitle(s.title);
    setImageUrl(s.imageUrl || '');
    setRawText('');
    setEntries(s.entries.map((e) => ({ ...e })));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const todayOrder = entries.find((e) => e.date === todayKey)?.dayOrder;

  return (
    <div className="space-y-6">
      <BackButton />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0] dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/50 dark:text-[#3B82F6] text-[10px] font-bold uppercase rounded-md">
              Academic Engine
            </span>
            <span className="text-xs text-[#000000] dark:text-[#64748B] font-semibold">• Day Order OCR</span>
          </div>
          <h2 className="text-xl font-bold text-[#0F172A] dark:text-zinc-100 tracking-tight mt-1">
            Day Order OCR
          </h2>
          <p className="text-xs text-[#000000] dark:text-[#64748B] dark:text-zinc-400 mt-0.5">
            Upload the monthly day order schedule image. The system OCR-extracts date → day order, which you can verify and correct before saving.
          </p>
        </div>
      </div>

      {/* Existing schedules quick edit */}
      {sortedSchedules.length > 0 && (
        <div className="bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-[#232326] rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-2 text-xs font-semibold text-[#000000] dark:text-[#64748B]">
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" /> Edit an existing schedule
          </span>
          <select
            value={editingSchedule?.id || ''}
            onChange={(e) => {
              const s = sortedSchedules.find((x) => x.id === e.target.value);
              if (s) loadForEdit(s);
            }}
            className="p-2 text-xs font-semibold bg-[#F7F9FC] dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          >
            <option value="">— Select —</option>
            {sortedSchedules.map((s) => (
              <option key={s.id} value={s.id}>{monthLabel(s.month)} · {s.title}</option>
            ))}
          </select>
          {editingSchedule && (
            <button
              onClick={resetDayOrder}
              className="px-2.5 py-1.5 flex items-center gap-1 text-[10px] font-bold text-[#000000] dark:text-[#64748B] hover:text-rose-500"
            >
              <RotateCcw className="w-3 h-3" /> Cancel Edit
            </button>
          )}
        </div>
      )}

      {/* OCR panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload + OCR */}
        <div className="bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-[#232326] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-zinc-100 flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
              {editingSchedule ? 'Edit Existing Schedule' : 'Upload Schedule Image'}
            </h3>
            {(imageUrl || editingSchedule) && (
              <button
                onClick={resetDayOrder}
                className="flex items-center gap-1 text-[10px] font-bold text-[#000000] dark:text-[#64748B] hover:text-rose-500"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] dark:text-zinc-300 mb-1">Month</label>
              <input
                type="month"
                value={dayMonth}
                onChange={(e) => setDayMonth(e.target.value)}
                className="w-full p-2.5 text-xs bg-[#F7F9FC] dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] dark:text-zinc-300 mb-1">Title</label>
              <input
                type="text"
                value={dayTitle}
                onChange={(e) => setDayTitle(e.target.value)}
                placeholder="e.g. September 2026 Day Order"
                className="w-full p-2.5 text-xs bg-[#F7F9FC] dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl"
              />
            </div>
          </div>

          <label className="block cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-6 text-center hover:border-[#2563EB] dark:hover:border-[#3B82F6] transition-colors">
              {imageUrl ? (
                <div className="space-y-3">
                  <img
                    src={imageUrl}
                    alt="Day order schedule"
                    className="max-h-52 mx-auto rounded-xl border border-[#E2E8F0] dark:border-zinc-700 object-contain bg-[#F7F9FC] dark:bg-zinc-900"
                  />
                  <p className="text-[10px] font-bold text-[#2563EB] dark:text-[#3B82F6] uppercase tracking-wider">
                    <ImageIcon className="inline w-3 h-3 mr-1" /> Image ready — click here to replace
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <ImageIcon className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto" />
                  <p className="text-xs font-bold text-[#1E293B] dark:text-zinc-300">Drop or click to upload the day order image</p>
                  <p className="text-[10px] text-[#000000] dark:text-[#64748B]">PNG / JPG · Dates and day order numbers should be readable</p>
                </div>
              )}
            </div>
          </label>

          <button
            onClick={runOCR}
            disabled={!imageUrl || ocrBusy}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#2563EB] hover:bg-white text-white hover:text-[#2563EB] dark:bg-[#2563EB] dark:hover:bg-white dark:text-white dark:hover:text-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold rounded-xl transition-colors shadow-md"
          >
            {ocrBusy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Extracting day order… {ocrProgress}%
              </>
            ) : (
              <>
                <ScanLine className="w-4 h-4" />
                Extract Date → Day Order with OCR
              </>
            )}
          </button>

          {ocrBusy && (
            <div className="h-1.5 bg-[#F7F9FC] dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2563EB] dark:bg-[#3B82F6] rounded-full transition-all"
                style={{ width: `${ocrProgress}%` }}
              />
            </div>
          )}

          {rawText && (
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] dark:text-zinc-300 mb-1">
                Raw OCR Text (for reference)
              </label>
              <pre className="max-h-36 overflow-auto p-2.5 text-[10px] leading-relaxed text-[#000000] dark:text-[#64748B] bg-[#F7F9FC] dark:bg-zinc-900 border border-[#E2E8F0] dark:border-zinc-800 rounded-xl whitespace-pre-wrap">
                {rawText}
              </pre>
            </div>
          )}
        </div>

        {/* Extracted entries + save */}
        <div className="bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-[#232326] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-zinc-100 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
              Date → Day Order ({entries.length} entries)
            </h3>
            <button
              onClick={addEntryRow}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#F7F9FC] dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[10px] font-bold rounded-lg text-[#1E293B] dark:text-zinc-200"
            >
              <Plus className="w-3 h-3" /> Add Row
            </button>
          </div>

          {entries.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-[#F7F9FC] dark:bg-zinc-900 border border-dashed border-[#E2E8F0] dark:border-zinc-700">
              <ScanLine className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-[#000000] dark:text-[#64748B] dark:text-zinc-400">No entries yet</p>
              <p className="text-[10px] text-[#000000] dark:text-[#64748B] mt-1">
                Run OCR above, or press “Add Row” to build the schedule manually. Every row can be edited.
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto rounded-xl border border-[#E2E8F0] dark:border-zinc-700">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#F7F9FC] dark:bg-zinc-900 border-b border-[#E2E8F0] dark:border-zinc-700 uppercase tracking-wider text-[10px] text-[#000000] dark:text-[#64748B] dark:text-zinc-400">
                  <tr>
                    <th className="p-2.5 pl-3 font-bold">Date</th>
                    <th className="p-2.5 font-bold w-28">Day Order</th>
                    <th className="p-2.5 font-bold w-32">Type</th>
                    <th className="p-2.5 pr-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {entries.map((e, i) => (
                    <tr key={i} className={e.date === todayKey ? 'bg-[#2563EB]/5 dark:bg-[#2563EB]/20' : ''}>
                      <td className="p-2 pl-3">
                        <input
                          type="date"
                          value={e.date}
                          onChange={(ev) => editEntry(i, { date: ev.target.value })}
                          className="w-full px-2 py-1.5 text-xs bg-transparent outline-none border border-transparent focus:border-[#2563EB] rounded-lg"
                        />
                      </td>
                      <td className="p-2">
                        {e.isHoliday ? (
                          <input
                            type="text"
                            value={e.holidayTitle || 'Holiday'}
                            onChange={(ev) => editEntry(i, { holidayTitle: ev.target.value })}
                            className="w-full px-2 py-1.5 text-xs font-bold bg-transparent outline-none border border-transparent focus:border-rose-400 rounded-lg text-rose-600"
                            placeholder="Holiday title"
                          />
                        ) : (
                          <input
                            type="number"
                            min={1}
                            max={7}
                            value={e.dayOrder}
                            onChange={(ev) => editEntry(i, { dayOrder: parseInt(ev.target.value, 10) || 1 })}
                            className="w-20 px-2 py-1.5 text-xs font-bold bg-transparent outline-none border border-transparent focus:border-[#2563EB] rounded-lg"
                          />
                        )}
                      </td>
                      <td className="p-2">
                        <select
                          value={e.isHoliday ? 'holiday' : 'working'}
                          onChange={(ev) => {
                            if (ev.target.value === 'holiday') {
                              editEntry(i, { isHoliday: true, holidayTitle: e.holidayTitle || 'Holiday', dayOrder: undefined });
                            } else {
                              editEntry(i, { isHoliday: false, holidayTitle: undefined, dayOrder: e.dayOrder || 1 });
                            }
                          }}
                          className="w-full px-2 py-1.5 text-xs font-semibold bg-transparent border border-transparent focus:border-zinc-300 rounded-lg"
                        >
                          <option value="working">Day Order</option>
                          <option value="holiday">Holiday / Leave</option>
                        </select>
                      </td>
                      <td className="p-2 pr-3 text-right">
                        <button
                          onClick={() => removeEntry(i)}
                          className="p-1 text-[#000000] dark:text-[#64748B] hover:text-rose-500"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {todayOrder !== undefined && (
            <div className="p-3 rounded-xl bg-[#2563EB]/10 dark:bg-[#2563EB]/40 text-[11px] font-bold text-[#2563EB] dark:text-[#3B82F6]">
              Today ({todayKey}) has day order <span className="font-extrabold">{todayOrder}</span>
              {entries.length && imageUrl ? ' — will be applied automatically for students & faculty.' : ''}
            </div>
          )}

          <button
            onClick={saveDayOrder}
            disabled={entries.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold rounded-xl transition-colors shadow-md"
          >
            <Save className="w-4 h-4" />
            {editingSchedule ? 'Save Changes' : 'Save Day Order Schedule'}
          </button>
        </div>
      </div>

      {/* View day order schedule modal */}
      <Modal
        isOpen={!!viewingSchedule}
        onClose={() => setViewingSchedule(null)}
        title="Day Order Schedule Details"
        subtitle={viewingSchedule ? monthLabel(viewingSchedule.month) : ''}
      >
        {viewingSchedule && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[#000000] dark:text-[#64748B] font-bold uppercase tracking-wider text-[10px]">Title</p>
                <p className="font-semibold text-[#0F172A] dark:text-zinc-100 mt-0.5">{viewingSchedule.title}</p>
              </div>
              <div>
                <p className="text-[#000000] dark:text-[#64748B] font-bold uppercase tracking-wider text-[10px]">Entries</p>
                <p className="font-semibold text-[#0F172A] dark:text-zinc-100 mt-0.5">{viewingSchedule.entries.length} days mapped</p>
              </div>
            </div>

            {viewingSchedule.imageUrl && (
              <img
                src={viewingSchedule.imageUrl}
                alt="Schedule"
                className="max-h-40 mx-auto rounded-xl border border-[#E2E8F0] dark:border-zinc-700 object-contain"
              />
            )}

            <div className="max-h-64 overflow-y-auto rounded-xl border border-[#E2E8F0] dark:border-zinc-700">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#F7F9FC] dark:bg-zinc-900 border-b border-[#E2E8F0] dark:border-zinc-700 uppercase tracking-wider text-[10px] text-[#000000] dark:text-[#64748B] dark:text-zinc-400">
                  <tr>
                    <th className="p-2 pl-3 font-bold">Date</th>
                    <th className="p-2 font-bold">Day Order</th>
                    <th className="p-2 font-bold">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {viewingSchedule.entries.map((e) => (
                    <tr key={e.date}>
                      <td className="p-2 pl-3 font-mono text-[#1E293B] dark:text-zinc-300">{e.date}</td>
                      <td className="p-2">
                        {e.isHoliday ? (
                          <span className="px-2.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-extrabold">
                            —
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-md bg-[#2563EB]/10 dark:bg-[#2563EB]/40 text-[#2563EB] dark:text-[#3B82F6] font-extrabold">
                            {e.dayOrder}
                          </span>
                        )}
                      </td>
                      <td className="p-2">
                        {e.isHoliday ? (
                          <span className="px-2.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold">
                            {e.holidayTitle || 'Holiday'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold">
                            Working
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
