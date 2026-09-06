import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CalendarEvent } from '../../types';
import { Modal } from '../common/Modal';
import { BackButton } from '../common/BackButton';
import { Plus, Trash2, ChevronLeft, ChevronRight, Pencil, FileText } from 'lucide-react';

export const AcademicCalendar: React.FC = () => {
  const { calendarEvents, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent, setActiveScreen } = useApp();

  // Month navigation state
  const [viewMonth, setViewMonth] = useState<number>(7); // 0-indexed month (7 = August)
  const [viewYear, setViewYear] = useState<number>(2026);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<CalendarEvent, 'id'>>({
    date: '2026-08-15',
    type: 'holiday',
    title: '',
    description: ''
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Build date string YYYY-MM-DD for a given day of the viewed month
  const dateStrFor = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const daysInMonth = Array.from({ length: new Date(viewYear, viewMonth + 1, 0).getDate() }, (_, i) => {
    const day = i + 1;
    const dateStr = dateStrFor(day);
    const events = calendarEvents.filter((e) => e.date === dateStr);
    return { day, dateStr, events };
  });

  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
    setFormData((f) => ({ ...f, date: dateStrFor(1) }));
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
    setFormData((f) => ({ ...f, date: dateStrFor(1) }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    if (editingEventId) {
      updateCalendarEvent({ id: editingEventId, ...formData });
    } else {
      addCalendarEvent(formData);
    }
    setModalOpen(false);
    setEditingEventId(null);
  };

  const openAddModal = () => {
    setEditingEventId(null);
    setFormData({
      date: dateStrFor(1),
      type: 'holiday',
      title: '',
      description: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setEditingEventId(event.id);
    setFormData({
      date: event.date,
      type: event.type,
      title: event.title,
      description: event.description || ''
    });
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <BackButton />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Academic Calendar & Holiday Planner
          </h2>

        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveScreen('monthly_staff_order')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-xl transition-colors"
          >
            <FileText className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" />
            Monthly Staff Orders
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1E40AF] hover:bg-[#FFFFFF] dark:bg-[#2563EB] dark:text-[#FFFFFF] dark:hover:bg-white text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 p-3 bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-[#232326] rounded-xl text-xs font-semibold">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-500" /> Holiday / Non-working
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500" /> Examination Period
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500" /> Working Day
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#1E40AF] dark:bg-[#2563EB]" /> Institutional Event
        </span>
      </div>

      {/* Month Grid */}
      <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl p-4 shadow-sm">
        {/* Month navigation header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goPrevMonth}
            className="p-2 text-zinc-500 hover:text-[#1E40AF] dark:hover:text-[#3B82F6] hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {monthNames[viewMonth]} {viewYear}
          </h3>
          <button
            onClick={goNextMonth}
            className="p-2 text-zinc-500 hover:text-[#1E40AF] dark:hover:text-[#3B82F6] hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <div className="grid grid-cols-7 gap-2 min-w-[560px]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-center text-[10px] font-bold uppercase text-zinc-400 p-2">
                {d}
              </div>
            ))}

            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`blank-${idx}`} className="min-h-20 p-2" />
            ))}

            {daysInMonth.map(({ day, dateStr, events }) => (
              <div
                key={day}
                className="min-h-20 p-2 bg-zinc-50 dark:bg-[#0A0A0A]/60 border border-zinc-200/60 dark:border-zinc-800 rounded-xl flex flex-col justify-between"
              >
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{day}</span>
              <div className="space-y-1">
                {events.map((e) => {
                  let badgeColor = 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300';
                  if (e.type === 'exam') badgeColor = 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300';
                  if (e.type === 'working') badgeColor = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300';
                  if (e.type === 'event') badgeColor = 'bg-[#1E40AF]/20 text-[#1E40AF] dark:bg-[#2563EB]/50 dark:text-[#3B82F6]';

                  return (
                    <div
                      key={e.id}
                      className={`p-1 rounded text-[9px] font-bold flex items-center justify-between ${badgeColor}`}
                      title={`${e.title}${e.description ? ` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â ${e.description}` : ''}`}
                    >
                      <span className="truncate">{e.title}</span>
                      <div className="flex items-center shrink-0">
                        <button
                          onClick={() => openEditModal(e)}
                          className="opacity-60 hover:opacity-100 ml-1"
                          title="Edit event"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                        </button>
                        <button
                          onClick={() => deleteCalendarEvent(e.id)}
                          className="opacity-60 hover:opacity-100 ml-1"
                          title="Delete event"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingEventId(null); }}
        title={editingEventId ? 'Edit Academic Calendar Event' : 'Tag Academic Calendar Date'}
        subtitle={editingEventId ? 'Update the existing calendar event details' : 'Mark holidays, exams, or custom working days'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Date</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full p-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Tag Classification</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full p-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            >
              <option value="holiday">National / Festival Holiday</option>
              <option value="exam">Examination Period</option>
              <option value="working">Special Working Day</option>
              <option value="event">Campus Event / Symposium</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Title</label>
            <input
              type="text"
              required
              placeholder="Independence Day / Midterm Exams"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Short note about this date"
              className="w-full p-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#1E40AF] hover:bg-[#FFFFFF] dark:bg-[#2563EB] dark:text-[#FFFFFF] dark:hover:bg-white text-white text-xs font-bold rounded-xl transition-colors"
          >
            {editingEventId ? 'Save Changes' : 'Save Calendar Event'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
