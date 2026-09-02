import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StaffOrder, StaffDayOrder, DayOrderEntry } from '../../types';
import { Modal } from '../common/Modal';
import { BackButton } from '../common/BackButton';
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Eye,
  CalendarDays,
  Search,
  Upload,
  ScanLine,
  ImageIcon,
  Save,
  Loader2,
  ListOrdered,
  RotateCcw
} from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const emptyForm = {
  month: new Date().toISOString().slice(0, 7),
  title: '',
  orderNumber: '',
  description: '',
  issuedDate: new Date().toISOString().slice(0, 10)
};

// ---------- Day Order OCR parsing helpers ----------

// Normalise a date token like 02-09-2026 / 2/9/26 / 2.9.2026 → YYYY-MM-DD (dd-mm-yyyy assumed).
function parseDateToken(tok: string, fallbackYear?: number): string | null {
  const m = tok.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (!m) return null;
  let day = parseInt(m[1], 10);
  let month = parseInt(m[2], 10);
  let year = parseInt(m[3], 10);
  if (year < 100) year += 2000;
  // If month looks invalid (>12) but day is a valid month, they are probably swapped.
  if (month > 12 && day <= 12) {
    const tmp = day;
    day = month;
    month = tmp;
  }
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  if (fallbackYear && year < fallbackYear - 1) year = fallbackYear;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Extract best-effort date → day order pairs from OCR text for a given month (YYYY-MM).
function parseDayOrderText(rawText: string, month: string): DayOrderEntry[] {
  const [fy, fm] = month.split('-').map(Number);
  const lines = rawText.split(/\r?\n/);
  const entries: DayOrderEntry[] = [];
  const seen = new Set<string>();

  const pushEntry = (date: string | null, order?: number) => {
    if (!date || seen.has(date)) return;
    seen.add(date);
    entries.push({ date, dayOrder: typeof order === 'number' && order >= 1 && order <= 7 ? order : 1 });
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Find date(s) anywhere in the line.
    const dateMatches = line.match(/\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b/g) || [];
    if (dateMatches.length === 0) continue;

    const remainder = line.replace(/\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b/g, ' | ');
    const orderMatch = remainder.match(/(?:day\s*order\s*[:#-]?\s*)?\b([1-7])\b/);
    const dayOrder = orderMatch ? parseInt(orderMatch[1], 10) : undefined;

    for (const dm of dateMatches) {
      const date = parseDateToken(dm, fy || new Date().getFullYear());
      if (!date) continue;
      // Only accept dates that fall in the selected month (OCR may add spillover).
      const [yy, mo] = date.split('-').map(Number);
      if (fm && mo !== fm) continue;
      pushEntry(date, dayOrder);
    }
  }

  return entries.sort((a, b) => (a.date < b.date ? -1 : 1));
}

// ---------- Component ----------

export const MonthlyStaffOrder: React.FC = () => {
  const {
    staffOrders,
    addStaffOrder,
    updateStaffOrder,
    deleteStaffOrder,
    staffDayOrders,
    saveStaffDayOrder,
    updateStaffDayOrder,
    deleteStaffDayOrder,
    addToast
  } = useApp();

  const [tab, setTab] = useState<'dayorder' | 'orders'>('dayorder');

  // ---- Day order (OCR) tab state ----
  const [dayTitle, setDayTitle] = useState('');
  const [dayMonth, setDayMonth] = useState(new Date().toISOString().slice(0, 7));
  const [imageUrl, setImageUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [entries, setEntries] = useState<DayOrderEntry[]>([]);
  const [viewingSchedule, setViewingSchedule] = useState<StaffDayOrder | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<StaffDayOrder | null>(null);

  // ---- Generic staff orders tab state ----
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<StaffOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<StaffOrder | null>(null);
  const [form, setForm] = useState(emptyForm);

  const monthLabel = (ym: string) => {
    const [y, m] = ym.split('-').map(Number);
    return `${MONTHS[(m ?? 1) - 1]} ${y}`;
  };

  const filteredOrders = staffOrders.filter((o) => {
    const q = search.toLowerCase();
    return (
      !q ||
      o.title.toLowerCase().includes(q) ||
      o.orderNumber.toLowerCase().includes(q) ||
      monthLabel(o.month).toLowerCase().includes(q)
    );
  });

  const sortedSchedules = useMemo(
    () => [...staffDayOrders].sort((a, b) => (a.month < b.month ? 1 : -1)),
    [staffDayOrders]
  );

  const openAddOrder = () => {
    setEditingOrder(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditOrder = (order: StaffOrder) => {
    setEditingOrder(order);
    setForm({
      month: order.month,
      title: order.title,
      orderNumber: order.orderNumber,
      description: order.description || '',
      issuedDate: order.issuedDate
    });
    setModalOpen(true);
  };

  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.orderNumber.trim()) return;
    if (editingOrder) {
      updateStaffOrder({ ...editingOrder, ...form });
    } else {
      addStaffOrder({ ...form, title: form.title.trim(), orderNumber: form.orderNumber.trim() });
    }
    setModalOpen(false);
    setEditingOrder(null);
  };

  // ---- Day order: image upload + OCR ----
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
      { date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, dayOrder: 1 }
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
      .map((e) => ({ date: e.date, dayOrder: Number(e.dayOrder) || 1 }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
    const title = dayTitle.trim() || `Monthly Staff Day Order`;
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
    setTab('dayorder');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-[#1E40AF]/10 text-[#1E40AF] dark:bg-[#2563EB]/50 dark:text-[#3B82F6] text-[10px] font-bold uppercase rounded-md">
              Academic Calendar
            </span>
            <span className="text-xs text-zinc-400 font-semibold">• Monthly Staff Day Order</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mt-1">
            Monthly Staff Day Order
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Upload the monthly day order schedule image. The system OCR-extracts date → day order, which you can verify and correct before saving.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-[#0A0A0A] p-1 rounded-xl w-fit border border-zinc-200/80 dark:border-[#232326]">
        <button
          onClick={() => setTab('dayorder')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
            tab === 'dayorder'
              ? 'bg-[#1E40AF] text-white dark:bg-[#2563EB] shadow-sm'
              : 'text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800'
          }`}
        >
          <ListOrdered className="w-4 h-4" /> Staff Day Order (OCR)
        </button>
        <button
          onClick={() => setTab('orders')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
            tab === 'orders'
              ? 'bg-[#1E40AF] text-white dark:bg-[#2563EB] shadow-sm'
              : 'text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800'
          }`}
        >
          <FileText className="w-4 h-4" /> Monthly Staff Orders
        </button>
      </div>

      {/* ============ DAY ORDER TAB ============ */}
      {tab === 'dayorder' && (
        <>
          {/* OCR panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload + OCR */}
            <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" />
                  {editingSchedule ? 'Edit Existing Schedule' : 'Upload Schedule Image'}
                </h3>
                {(imageUrl || editingSchedule) && (
                  <button
                    onClick={resetDayOrder}
                    className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-rose-500"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Month</label>
                  <input
                    type="month"
                    value={dayMonth}
                    onChange={(e) => setDayMonth(e.target.value)}
                    className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Title</label>
                  <input
                    type="text"
                    value={dayTitle}
                    onChange={(e) => setDayTitle(e.target.value)}
                    placeholder="e.g. September 2026 Day Order"
                    className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
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
                <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-6 text-center hover:border-[#1E40AF] dark:hover:border-[#3B82F6] transition-colors">
                  {imageUrl ? (
                    <div className="space-y-3">
                      <img
                        src={imageUrl}
                        alt="Day order schedule"
                        className="max-h-52 mx-auto rounded-xl border border-zinc-200 dark:border-zinc-700 object-contain bg-zinc-50 dark:bg-zinc-900"
                      />
                      <p className="text-[10px] font-bold text-[#1E40AF] dark:text-[#3B82F6] uppercase tracking-wider">
                        <ImageIcon className="inline w-3 h-3 mr-1" /> Image ready — click here to replace
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <ImageIcon className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto" />
                      <p className="text-xs font-bold text-zinc-600 dark:text-zinc-300">Drop or click to upload the day order image</p>
                      <p className="text-[10px] text-zinc-400">PNG / JPG · Dates and day order numbers should be readable</p>
                    </div>
                  )}
                </div>
              </label>

              <button
                onClick={runOCR}
                disabled={!imageUrl || ocrBusy}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1E40AF] hover:bg-white text-white hover:text-[#1E40AF] dark:bg-[#2563EB] dark:hover:bg-white dark:text-white dark:hover:text-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold rounded-xl transition-colors shadow-md"
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
                <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1E40AF] dark:bg-[#3B82F6] rounded-full transition-all"
                    style={{ width: `${ocrProgress}%` }}
                  />
                </div>
              )}

              {rawText && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Raw OCR Text (for reference)
                  </label>
                  <pre className="max-h-36 overflow-auto p-2.5 text-[10px] leading-relaxed text-zinc-500 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl whitespace-pre-wrap">
                    {rawText}
                  </pre>
                </div>
              )}
            </div>

            {/* Extracted entries + save */}
            <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" />
                  Date → Day Order ({entries.length} entries)
                </h3>
                <button
                  onClick={addEntryRow}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[10px] font-bold rounded-lg text-zinc-700 dark:text-zinc-200"
                >
                  <Plus className="w-3 h-3" /> Add Row
                </button>
              </div>

              {entries.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-700">
                  <ScanLine className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">No entries yet</p>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Run OCR above, or press “Add Row” to build the schedule manually. Every row can be edited.
                  </p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 uppercase tracking-wider text-[10px] text-zinc-500 dark:text-zinc-400">
                      <tr>
                        <th className="p-2.5 pl-3 font-bold">Date</th>
                        <th className="p-2.5 font-bold w-28">Day Order</th>
                        <th className="p-2.5 pr-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {entries.map((e, i) => (
                        <tr key={i} className={e.date === todayKey ? 'bg-[#1E40AF]/5 dark:bg-[#2563EB]/20' : ''}>
                          <td className="p-2 pl-3">
                            <input
                              type="date"
                              value={e.date}
                              onChange={(ev) => editEntry(i, { date: ev.target.value })}
                              className="w-full px-2 py-1.5 text-xs bg-transparent outline-none border border-transparent focus:border-[#1E40AF] rounded-lg"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min={1}
                              max={7}
                              value={e.dayOrder}
                              onChange={(ev) => editEntry(i, { dayOrder: parseInt(ev.target.value, 10) || 1 })}
                              className="w-20 px-2 py-1.5 text-xs font-bold bg-transparent outline-none border border-transparent focus:border-[#1E40AF] rounded-lg"
                            />
                          </td>
                          <td className="p-2 pr-3 text-right">
                            <button
                              onClick={() => removeEntry(i)}
                              className="p-1 text-zinc-400 hover:text-rose-500"
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
                <div className="p-3 rounded-xl bg-[#1E40AF]/10 dark:bg-[#2563EB]/40 text-[11px] font-bold text-[#1E40AF] dark:text-[#3B82F6]">
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

          {/* Saved schedules */}
          <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-zinc-100 dark:border-[#232326] flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" />
                Saved Day Order Schedules ({sortedSchedules.length})
              </h3>
            </div>

            {sortedSchedules.length === 0 ? (
              <div className="p-10 text-center">
                <CalendarDays className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">No day order schedules saved.</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Upload an image and run OCR to create the first one.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-[#0A0A0A]/80 border-b border-zinc-200 dark:border-[#232326] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5 pl-4">Month</th>
                    <th className="p-3.5">Title</th>
                    <th className="p-3.5">Entries</th>
                    <th className="p-3.5">Last Updated</th>
                    <th className="p-3.5 text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {sortedSchedules.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="p-3.5 pl-4 font-bold text-[#1E40AF] dark:text-[#3B82F6]">{monthLabel(s.month)}</td>
                      <td className="p-3.5 font-semibold text-zinc-700 dark:text-zinc-300 max-w-xs truncate">{s.title}</td>
                      <td className="p-3.5 text-zinc-500 font-mono">{s.entries.length} days</td>
                      <td className="p-3.5 text-zinc-500 font-mono">{s.updatedAt}</td>
                      <td className="p-3.5 pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingSchedule(s)}
                            className="p-1.5 text-[#1E40AF] dark:text-[#3B82F6] hover:bg-[#1E40AF]/10 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => loadForEdit(s)}
                            className="p-1.5 text-zinc-500 hover:text-[#1E40AF] dark:hover:text-[#3B82F6] hover:bg-[#1E40AF]/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteStaffDayOrder(s.id)}
                            className="p-1.5 text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============ GENERIC ORDERS TAB ============ */}
      {tab === 'orders' && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Manage standalone monthly staff order notices (separate from the OCR day order schedules above).
            </p>
            <button
              onClick={openAddOrder}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#1E40AF] hover:bg-white dark:bg-[#2563EB] dark:hover:bg-white dark:text-white dark:hover:text-[#2563EB] text-white hover:text-[#1E40AF] text-xs font-semibold rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Staff Order
            </button>
          </div>

          <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl p-4 shadow-sm flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setSearch((e.target as HTMLInputElement).value);
              }}
              placeholder="Search by order title, number or month..."
              className="w-full text-xs font-semibold bg-transparent outline-none placeholder:text-zinc-400"
            />
            <button
              onClick={() => setSearch(search)}
              className="px-3 py-1 text-xs font-bold text-white bg-[#1E40AF] dark:bg-[#2563EB] hover:bg-[#161B33] dark:hover:bg-[#2563EB] rounded-xl transition-colors shrink-0"
            >
              Enter
            </button>
          </div>

          <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-zinc-100 dark:border-[#232326] flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" />
                Staff Order History ({filteredOrders.length})
              </h3>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="p-10 text-center">
                <FileText className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">No staff orders yet.</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Create your first monthly staff order.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-[#0A0A0A]/80 border-b border-zinc-200 dark:border-[#232326] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5 pl-4">Month</th>
                    <th className="p-3.5">Order No.</th>
                    <th className="p-3.5">Title / Description</th>
                    <th className="p-3.5">Issued Date</th>
                    <th className="p-3.5">Last Updated</th>
                    <th className="p-3.5 text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="p-3.5 pl-4 font-bold text-[#1E40AF] dark:text-[#3B82F6]">{monthLabel(o.month)}</td>
                      <td className="p-3.5 font-mono font-semibold text-zinc-700 dark:text-zinc-300">{o.orderNumber}</td>
                      <td className="p-3.5 font-semibold text-zinc-700 dark:text-zinc-300 max-w-xs truncate">{o.title}</td>
                      <td className="p-3.5 text-zinc-500 font-mono">{o.issuedDate}</td>
                      <td className="p-3.5 text-zinc-500 font-mono">{o.updatedAt}</td>
                      <td className="p-3.5 pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingOrder(o)}
                            className="p-1.5 text-[#1E40AF] dark:text-[#3B82F6] hover:bg-[#1E40AF]/10 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditOrder(o)}
                            className="p-1.5 text-zinc-500 hover:text-[#1E40AF] dark:hover:text-[#3B82F6] hover:bg-[#1E40AF]/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteStaffOrder(o.id)}
                            className="p-1.5 text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Create / Edit generic order modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingOrder(null); }}
        title={editingOrder ? 'Edit Monthly Staff Order' : 'Create Monthly Staff Order'}
        subtitle={editingOrder ? 'Update the staff order details' : 'Add a new monthly staff order'}
      >
        <form onSubmit={handleSaveOrder} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Month</label>
            <input
              type="month"
              required
              value={form.month}
              onChange={(e) => setForm({ ...form, month: e.target.value })}
              className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Order Number</label>
              <input
                type="text"
                required
                placeholder="e.g. SO/2026/08"
                value={form.orderNumber}
                onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
                className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Issued Date</label>
              <input
                type="date"
                required
                value={form.issuedDate}
                onChange={(e) => setForm({ ...form, issuedDate: e.target.value })}
                className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Order Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Monthly Teaching Staff Order"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Description (Optional)</label>
            <textarea
              rows={3}
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short note / details about this staff order"
              className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => { setModalOpen(false); setEditingOrder(null); }}
              className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 rounded-xl text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#1E40AF] hover:bg-white text-white hover:text-[#1E40AF] dark:bg-[#2563EB] dark:text-white dark:hover:bg-white dark:hover:text-[#2563EB] text-xs font-bold rounded-xl transition-colors shadow-md"
            >
              {editingOrder ? 'Save Changes' : 'Create Staff Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View generic order modal */}
      <Modal
        isOpen={!!viewingOrder}
        onClose={() => setViewingOrder(null)}
        title="Staff Order Details"
        subtitle={viewingOrder ? `#${viewingOrder.orderNumber}` : ''}
      >
        {viewingOrder && (
          <div className="space-y-4">
            <div className="p-4 bg-[#1E40AF]/10 dark:bg-[#2563EB]/40 rounded-xl">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#1E40AF] dark:text-[#3B82F6] flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" /> Order Month
              </div>
              <div className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">{monthLabel(viewingOrder.month)}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Order Number</p>
                <p className="font-mono font-semibold text-zinc-800 dark:text-zinc-100 mt-0.5">{viewingOrder.orderNumber}</p>
              </div>
              <div>
                <p className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Issued Date</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-100 mt-0.5">{viewingOrder.issuedDate}</p>
              </div>
              <div>
                <p className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Created</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-100 mt-0.5">{viewingOrder.createdAt}</p>
              </div>
              <div>
                <p className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Last Updated</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-100 mt-0.5">{viewingOrder.updatedAt}</p>
              </div>
            </div>

            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
              <p className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Title</p>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">{viewingOrder.title}</p>
            </div>

            {viewingOrder.description && (
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
                <p className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Description</p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">{viewingOrder.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

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
                <p className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Title</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-100 mt-0.5">{viewingSchedule.title}</p>
              </div>
              <div>
                <p className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Entries</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-100 mt-0.5">{viewingSchedule.entries.length} days mapped</p>
              </div>
            </div>

            {viewingSchedule.imageUrl && (
              <img
                src={viewingSchedule.imageUrl}
                alt="Schedule"
                className="max-h-40 mx-auto rounded-xl border border-zinc-200 dark:border-zinc-700 object-contain"
              />
            )}

            <div className="max-h-64 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 uppercase tracking-wider text-[10px] text-zinc-500 dark:text-zinc-400">
                  <tr>
                    <th className="p-2 pl-3 font-bold">Date</th>
                    <th className="p-2 font-bold">Day Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {viewingSchedule.entries.map((e) => (
                    <tr key={e.date}>
                      <td className="p-2 pl-3 font-mono text-zinc-700 dark:text-zinc-300">{e.date}</td>
                      <td className="p-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-[#1E40AF]/10 dark:bg-[#2563EB]/40 text-[#1E40AF] dark:text-[#3B82F6] font-extrabold">
                          {e.dayOrder}
                        </span>
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