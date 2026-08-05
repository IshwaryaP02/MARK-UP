import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CalendarEvent } from '../../types';
import { Modal } from '../common/Modal';
import { Calendar as CalendarIcon, Plus, Trash2, CheckCircle2, AlertCircle, Bookmark } from 'lucide-react';

export const AcademicCalendar: React.FC = () => {
  const { calendarEvents, addCalendarEvent, deleteCalendarEvent } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<CalendarEvent, 'id'>>({
    date: '2026-08-15',
    type: 'holiday',
    title: '',
    description: ''
  });

  const daysInMonth = Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    const dateStr = `2026-08-${String(day).padStart(2, '0')}`;
    const events = calendarEvents.filter((e) => e.date === dateStr);
    return { day, dateStr, events };
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    addCalendarEvent(formData);
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Academic Calendar & Holiday Planner
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Bulk mark working days, exam periods, national holidays, and institutional events
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:text-[#0D1127] dark:hover:bg-white text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Mark Calendar Day
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 p-3 bg-white dark:bg-[#21284C] border border-zinc-200 dark:border-[#2D376A] rounded-xl text-xs font-semibold">
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
          <span className="w-3 h-3 rounded-full bg-[#313866] dark:bg-[#8A92D0]" /> Institutional Event
        </span>
      </div>

      {/* Month Grid */}
      <div className="bg-white dark:bg-[#21284C] border border-zinc-200/80 dark:border-[#2D376A] rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">August 2026</h3>
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-center text-[10px] font-bold uppercase text-zinc-400 p-2">
              {d}
            </div>
          ))}

          {daysInMonth.map(({ day, dateStr, events }) => (
            <div
              key={day}
              className="min-h-20 p-2 bg-zinc-50 dark:bg-[#161B33]/60 border border-zinc-200/60 dark:border-zinc-800 rounded-xl flex flex-col justify-between"
            >
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{day}</span>
              <div className="space-y-1">
                {events.map((e) => {
                  let badgeColor = 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300';
                  if (e.type === 'exam') badgeColor = 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300';
                  if (e.type === 'working') badgeColor = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300';
                  if (e.type === 'event') badgeColor = 'bg-[#313866]/20 text-[#313866] dark:bg-[#313866]/50 dark:text-[#8A92D0]';

                  return (
                    <div
                      key={e.id}
                      className={`p-1 rounded text-[9px] font-bold flex items-center justify-between ${badgeColor}`}
                    >
                      <span className="truncate">{e.title}</span>
                      <button
                        onClick={() => deleteCalendarEvent(e.id)}
                        className="opacity-60 hover:opacity-100 ml-1"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Tag Academic Calendar Date"
        subtitle="Mark holidays, exams, or custom working days"
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

          <button
            type="submit"
            className="w-full py-2.5 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:text-[#0D1127] dark:hover:bg-white text-white text-xs font-bold rounded-xl transition-colors"
          >
            Save Calendar Tag
          </button>
        </form>
      </Modal>
    </div>
  );
};
