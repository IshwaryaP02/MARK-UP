import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TimetableSlot } from '../../types';
import { Modal } from '../common/Modal';
import {
  Calendar,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Users,
  Building2,
  BookOpen,
  UserCheck,
  Eye,
  Layers,
  Image,
  Download
} from 'lucide-react';

export const TimetableBuilder: React.FC = () => {
  const {
    timetable,
    subjects,
    facultyList,
    students,
    departments,
    saveTimetableSlot,
    deleteTimetableSlot,
    currentUser,
    addToast
  } = useApp();

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
  // Display day labels as Roman numerals only (I=Monday ... VI=Saturday)
  const romanDayLabels: Record<string, string> = {
    Monday: 'I',
    Tuesday: 'II',
    Wednesday: 'III',
    Thursday: 'IV',
    Friday: 'V',
    Saturday: 'VI'
  };
  const periods = [
    { num: 1, start: '09:00 AM', end: '09:50 AM' },
    { num: 2, start: '10:00 AM', end: '10:50 AM' },
    { num: 3, start: '11:00 AM', end: '11:50 AM' },
    { num: 4, start: '01:30 PM', end: '02:20 PM' },
    { num: 5, start: '02:30 PM', end: '03:20 PM' }
  ];

  // Selection states
  const userDeptId = currentUser.departmentId || departments[0]?.id || 'dept-cs';
  const isDepartmentLocked = currentUser.role === 'hod' || currentUser.role === 'faculty';

  const [selectedDeptId, setSelectedDeptId] = useState<string>(userDeptId);
  const [selectedSemester, setSelectedSemester] = useState<number>(4);
  const [selectedSection, setSelectedSection] = useState<string>('A');

  // Available sections for current dept + semester
  const [availableSections, setAvailableSections] = useState<string[]>(['A', 'B', 'C', 'D']);
  const [newSectionName, setNewSectionName] = useState('');
  const [showAddSection, setShowAddSection] = useState(false);

  // Student roster modal state
  const [showRosterModal, setShowRosterModal] = useState(false);

  // Slot edit modal state
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Partial<TimetableSlot>>({
    day: 'Monday',
    periodNumber: 1,
    startTime: '09:00 AM',
    endTime: '09:50 AM',
    subjectId: subjects[0]?.id || '',
    subjectCode: subjects[0]?.code || '',
    subjectName: subjects[0]?.name || '',
    facultyId: facultyList[0]?.id || '',
    facultyName: facultyList[0]?.name || '',
    roomNo: 'LH-101',
    departmentId: selectedDeptId,
    semester: selectedSemester,
    section: selectedSection
  });

  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Filter students belonging to this specific department, semester & section
  const sectionStudents = students.filter(
    (st) =>
      st.departmentId === selectedDeptId &&
      st.semester === selectedSemester &&
      (st.section === selectedSection || (!st.section && selectedSection === 'A'))
  );

  // Filter timetable slots for the selected Class Section
  const sectionSlots = timetable.filter(
    (slot) =>
      slot.departmentId === selectedDeptId &&
      slot.semester === selectedSemester &&
      slot.section === selectedSection
  );

  // Current department details
  const currentDept = departments.find((d) => d.id === selectedDeptId) || departments[0];

  // Export Timetable Grid as Image (PNG Canvas)
  const handleExportTimetableImage = () => {
    const canvas = document.createElement('canvas');
    const width = 1200;
    const height = 800;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Top Header Banner
    ctx.fillStyle = '#313866';
    ctx.fillRect(0, 0, width, 100);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillText(`${currentDept?.name || 'Academic Department'} — Class Timetable`, 40, 42);

    ctx.fillStyle = '#8A92D0';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText(`Semester ${selectedSemester} | Class Section ${selectedSection} | HOD: ${currentDept?.hodName || 'Assigned HOD'}`, 40, 72);

    // Grid Coordinates
    const startX = 40;
    const startY = 130;
    const colWidth = 160;
    const dayColWidth = 140;
    const rowHeight = 90;

    // Table Headers
    ctx.fillStyle = '#F3F4F9';
    ctx.fillRect(startX, startY, dayColWidth, 50);
    ctx.fillStyle = '#313866';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('DAY / PERIOD', startX + 15, startY + 30);

    periods.forEach((p, idx) => {
      const x = startX + dayColWidth + idx * colWidth;
      ctx.fillStyle = '#F3F4F9';
      ctx.fillRect(x, startY, colWidth, 50);

      ctx.fillStyle = '#161B33';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(`P${p.num} (${p.start})`, x + 15, startY + 30);

      ctx.strokeStyle = '#E5E7EB';
      ctx.strokeRect(x, startY, colWidth, 50);
    });

    // Rows for Days
    days.forEach((day, rIdx) => {
      const y = startY + 50 + rIdx * rowHeight;

      // Day Label
      ctx.fillStyle = '#FAFAFA';
      ctx.fillRect(startX, y, dayColWidth, rowHeight);
      ctx.fillStyle = '#313866';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.fillText(romanDayLabels[day] || day, startX + 15, y + 50);
      ctx.strokeStyle = '#E5E7EB';
      ctx.strokeRect(startX, y, dayColWidth, rowHeight);

      // Period Cells
      periods.forEach((p, cIdx) => {
        const x = startX + dayColWidth + cIdx * colWidth;
        const slot = sectionSlots.find((s) => s.day === day && s.periodNumber === p.num);

        if (slot) {
          ctx.fillStyle = '#F3E8FF';
          ctx.fillRect(x + 4, y + 4, colWidth - 8, rowHeight - 8);

          ctx.strokeStyle = '#D8B4FE';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 4, y + 4, colWidth - 8, rowHeight - 8);

          ctx.fillStyle = '#6B21A8';
          ctx.font = 'bold 13px Inter, sans-serif';
          ctx.fillText(`${slot.subjectCode}`, x + 12, y + 28);

          ctx.fillStyle = '#374151';
          ctx.font = '11px Inter, sans-serif';
          ctx.fillText(`Inst: ${slot.facultyName.slice(0, 16)}`, x + 12, y + 50);

          ctx.fillStyle = '#7E22CE';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(`Room: ${slot.roomNo}`, x + 12, y + 70);
        } else {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(x, y, colWidth, rowHeight);
          ctx.strokeStyle = '#E5E7EB';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, colWidth, rowHeight);

          ctx.fillStyle = '#9CA3AF';
          ctx.font = '11px Inter, sans-serif';
          ctx.fillText('— Free Slot —', x + 35, y + 50);
        }
      });
    });

    // Footer
    ctx.fillStyle = '#6B7280';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(`Generated by Campus LMS Academic Timetable System · Date: ${new Date().toLocaleDateString()}`, 40, height - 20);

    // Download PNG Link
    const imageURI = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Timetable_${currentDept?.code}_Sem${selectedSemester}_Section_${selectedSection}.png`;
    link.href = imageURI;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('Timetable Exported as Image', `Downloaded PNG image for ${currentDept?.code} Sem ${selectedSemester} Sec ${selectedSection}`, 'success');
  };

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSectionName.trim().toUpperCase();
    if (!clean) return;
    if (availableSections.includes(clean)) {
      addToast('Section Exists', `Class Section ${clean} is already present`, 'info');
      return;
    }
    setAvailableSections([...availableSections, clean]);
    setSelectedSection(clean);
    setNewSectionName('');
    setShowAddSection(false);
    addToast('Class Section Created', `Created Class Section ${clean} for Semester ${selectedSemester}`, 'success');
  };

  const handleCellClick = (day: typeof days[number], periodNum: number) => {
    const existing = sectionSlots.find((s) => s.day === day && s.periodNumber === periodNum);
    const pInfo = periods.find((p) => p.num === periodNum);

    // Filter available subjects for selected department and semester
    const filteredSubjects = subjects.filter(
      (sub) => sub.departmentId === selectedDeptId && sub.semester === selectedSemester
    );
    const defaultSubject = filteredSubjects[0] || subjects[0];

    // Filter faculty members of this department
    const deptFaculty = facultyList.filter((f) => f.departmentId === selectedDeptId);
    const defaultFaculty = deptFaculty[0] || facultyList[0];

    if (existing) {
      setEditingSlot(existing);
    } else {
      setEditingSlot({
        id: `tt-${selectedDeptId}-s${selectedSemester}-sec${selectedSection}-${day.toLowerCase()}-p${periodNum}-${Date.now()}`,
        day,
        periodNumber: periodNum,
        startTime: pInfo?.start || '09:00 AM',
        endTime: pInfo?.end || '09:50 AM',
        subjectId: defaultSubject?.id || '',
        subjectCode: defaultSubject?.code || '',
        subjectName: defaultSubject?.name || '',
        facultyId: defaultFaculty?.id || '',
        facultyName: defaultFaculty?.name || '',
        roomNo: `LH-${selectedSemester}0${selectedSection === 'A' ? '1' : selectedSection === 'B' ? '2' : '3'}`,
        departmentId: selectedDeptId,
        semester: selectedSemester,
        section: selectedSection
      });
    }
    setConflictWarning(null);
    setSlotModalOpen(true);
  };

  // Conflict detection across all sections
  const checkConflicts = (testSlot: Partial<TimetableSlot>) => {
    const conflicts = timetable.filter(
      (s) =>
        s.id !== testSlot.id &&
        s.day === testSlot.day &&
        s.periodNumber === testSlot.periodNumber &&
        (s.facultyId === testSlot.facultyId || s.roomNo === testSlot.roomNo)
    );

    if (conflicts.length > 0) {
      const c = conflicts[0];
      if (c.facultyId === testSlot.facultyId) {
        return `Faculty Conflict: ${c.facultyName} is already assigned to Class ${c.section} (${c.subjectCode}) in ${c.roomNo} on ${c.day} Period ${c.periodNumber}.`;
      }
      if (c.roomNo === testSlot.roomNo) {
        return `Room Conflict: Classroom ${c.roomNo} is occupied by Class ${c.section} (${c.subjectCode}) on ${c.day} Period ${c.periodNumber}.`;
      }
    }
    return null;
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const conflict = checkConflicts(editingSlot);
    if (conflict) {
      setConflictWarning(conflict);
      return;
    }

    if (!editingSlot.subjectId || !editingSlot.facultyId) return;

    saveTimetableSlot({
      ...editingSlot,
      departmentId: selectedDeptId,
      semester: selectedSemester,
      section: selectedSection,
      id: editingSlot.id || `tt-${Date.now()}`
    } as TimetableSlot);

    setSlotModalOpen(false);
    addToast('Timetable Updated', `Assigned ${editingSlot.subjectCode} to Class Section ${selectedSection}`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-[#313866]/10 text-[#313866] dark:bg-[#313866]/50 dark:text-[#8A92D0] text-[10px] font-bold uppercase rounded-md">
              HOD Academic Engine
            </span>
            <span className="text-xs text-zinc-400 font-semibold">• Department & Class Timetable Allocation</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mt-1">
            Class Timetable Builder & Faculty Assignment
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Select department, semester, and specific class section (A, B, C...) to build timetables and assign faculty members.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportTimetableImage}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Image className="w-4 h-4 text-white" />
            Export Timetable as Image (PNG)
          </button>
          <button
            onClick={() => setShowRosterModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#313866]/10 hover:bg-[#313866]/20 dark:bg-[#313866]/40 text-[#313866] dark:text-[#8A92D0] border border-[#313866]/20 dark:border-[#8A92D0]/30 rounded-xl text-xs font-bold transition-all"
          >
            <Users className="w-4 h-4 text-[#313866] dark:text-[#8A92D0]" />
            Class {selectedSection} Students ({sectionStudents.length})
          </button>
        </div>
      </div>

      {/* Control Bar: Department, Semester & Class Section Selector */}
      <div className="bg-white dark:bg-[#21284C] border border-zinc-200/80 dark:border-[#2D376A] rounded-2xl p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Department Select */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#313866] dark:text-[#8A92D0]" /> Department {isDepartmentLocked && '(Assigned Department)'}
            </label>
            <select
              value={selectedDeptId}
              disabled={isDepartmentLocked}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className={`w-full p-2.5 text-xs font-semibold border rounded-xl ${
                isDepartmentLocked
                  ? 'bg-zinc-100 dark:bg-[#161B33]/80 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 cursor-not-allowed'
                  : 'bg-zinc-50 dark:bg-[#161B33] border-zinc-200 dark:border-zinc-700'
              }`}
            >
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>

          {/* Semester Select */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#313866] dark:text-[#8A92D0]" /> Academic Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(Number(e.target.value))}
              className="w-full p-2.5 text-xs font-semibold bg-zinc-50 dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-700 rounded-xl"
            >
              {[1, 2, 3, 4, 5, 6].map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem} (Year {Math.ceil(sem / 2)})
                </option>
              ))}
            </select>
          </div>

          {/* Enrolled Overview Stat */}
          <div className="flex items-center justify-between p-3 bg-[#313866]/10 dark:bg-[#313866]/40 border border-[#313866]/20 dark:border-[#8A92D0]/30 rounded-xl">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#313866] dark:text-[#8A92D0]">
                Selected Class Section
              </div>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                {currentDept?.code} Sem {selectedSemester} — Section {selectedSection}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-extrabold text-[#313866] dark:text-[#8A92D0]">
                {sectionStudents.length}
              </span>
              <span className="text-[10px] text-zinc-500 block font-semibold">Students</span>
            </div>
          </div>
        </div>

        {/* Class Sections Tabs (A, B, C, D...) */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#313866] dark:text-[#8A92D0]" /> Choose Class Section under Semester {selectedSemester}:
            </span>
            <button
              onClick={() => setShowAddSection(!showAddSection)}
              className="text-xs font-bold text-[#313866] dark:text-[#8A92D0] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Class
            </button>
          </div>

          {showAddSection && (
            <form onSubmit={handleAddSection} className="flex items-center gap-2 mb-3 bg-[#313866]/10 dark:bg-[#313866]/40 p-2.5 rounded-xl border border-[#313866]/20 dark:border-[#8A92D0]/30">
              <input
                type="text"
                placeholder="Class Section name (e.g. E, F)"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                maxLength={3}
                className="px-3 py-1.5 bg-white dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-900 dark:text-zinc-100 w-48 uppercase"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:text-[#0D1127] dark:hover:bg-white text-white rounded-lg text-xs font-bold"
              >
                Create Section
              </button>
            </form>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {availableSections.map((sec) => {
              const isSelected = selectedSection === sec;
              const count = students.filter(
                (s) => s.departmentId === selectedDeptId && s.semester === selectedSemester && (s.section === sec || (!s.section && sec === 'A'))
              ).length;

              return (
                <button
                  key={sec}
                  onClick={() => setSelectedSection(sec)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-[#313866] text-white border-[#313866] dark:bg-[#8A92D0] dark:text-[#0D1127] shadow-md scale-105'
                      : 'bg-zinc-50 dark:bg-[#161B33]/60 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-[#313866]/10'
                  }`}
                >
                  <span>Class Section {sec}</span>
                  <span
                    className={`px-1.5 py-0.5 text-[10px] rounded-full font-extrabold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Timetable Grid for Selected Class Section */}
      <div className="bg-white dark:bg-[#21284C] border border-zinc-200/80 dark:border-[#2D376A] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-100 dark:border-[#2D376A] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#313866] dark:text-[#8A92D0]" />
              Weekly Timetable Grid for Class Section {selectedSection}
            </h3>
            <p className="text-xs text-zinc-500">
              Click any period box below to assign course subjects, faculty instructor, and room.
            </p>
          </div>

          <div className="text-xs font-semibold text-[#313866] dark:text-[#8A92D0] bg-[#313866]/10 dark:bg-[#313866]/50 px-3 py-1 rounded-full border border-[#313866]/20 dark:border-[#8A92D0]/40">
            {sectionSlots.length} Scheduled Classes
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-[#161B33]/80 border-b border-zinc-200 dark:border-[#2D376A] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                <th className="p-3 w-28 text-left pl-4">Day / Period</th>
                {periods.map((p) => (
                  <th key={p.num} className="p-3 border-l border-zinc-200 dark:border-[#2D376A]">
                    <div>P{p.num}</div>
                    <div className="text-[9px] text-zinc-400 normal-case font-normal mt-0.5">{p.start}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-[#2D376A]">
              {days.map((day) => (
                <tr key={day} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-800/20">
                  <td className="p-3 font-bold text-left pl-4 bg-zinc-50/50 dark:bg-[#161B33]/60 text-zinc-900 dark:text-zinc-100 border-r border-zinc-200 dark:border-[#2D376A]">
                    {romanDayLabels[day] || day}
                  </td>
                  {periods.map((p) => {
                    const slot = sectionSlots.find((s) => s.day === day && s.periodNumber === p.num);
                    return (
                      <td
                        key={p.num}
                        onClick={() => handleCellClick(day, p.num)}
                        className="p-2 border-l border-zinc-200 dark:border-[#2D376A] cursor-pointer hover:bg-[#313866]/10 dark:hover:bg-[#313866]/30 transition-colors h-22 align-top"
                      >
                        {slot ? (
                          <div className="p-2 bg-[#313866]/10 dark:bg-[#313866]/50 border border-[#313866]/30 dark:border-[#8A92D0]/40 rounded-xl text-left h-full flex flex-col justify-between group shadow-2xs">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[#313866] dark:text-[#8A92D0] text-xs truncate">
                                  {slot.subjectCode}
                                </span>
                                <span className="text-[9px] font-bold text-[#313866] bg-[#313866]/20 dark:text-[#8A92D0] dark:bg-[#161B33] px-1 rounded">
                                  Sec {slot.section}
                                </span>
                              </div>
                              <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-300 truncate block mt-0.5">
                                Inst: {slot.facultyName}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[9px] font-mono text-[#313866] dark:text-[#8A92D0] mt-1 pt-1 border-t border-[#313866]/20 dark:border-[#8A92D0]/30">
                              <span>Room {slot.roomNo}</span>
                              <span className="text-[9px] opacity-60 group-hover:opacity-100 underline">Edit</span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-zinc-300 dark:text-zinc-700 hover:text-[#313866] dark:hover:text-[#8A92D0] text-[10px] font-semibold border border-dashed border-zinc-200 dark:border-[#2D376A] rounded-xl transition-colors">
                            + Add Class
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Roster Modal: Students Enrolled in Selected Class Section */}
      <Modal
        isOpen={showRosterModal}
        onClose={() => setShowRosterModal(false)}
        title={`Enrolled Students in Class Section ${selectedSection}`}
        subtitle={`${currentDept?.name} — Semester ${selectedSemester}`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-[#313866]/10 dark:bg-[#313866]/40 rounded-xl text-xs font-semibold text-[#313866] dark:text-[#8A92D0]">
            <span>Total Enrolled: {sectionStudents.length} Students</span>
            <span>Class Teacher / HOD: {currentDept?.hodName}</span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            {sectionStudents.length === 0 ? (
              <p className="p-6 text-xs text-center text-zinc-400">
                No students currently registered for Section {selectedSection} Semester {selectedSemester}.
              </p>
            ) : (
              sectionStudents.map((st) => (
                <div key={st.id} className="p-3 flex items-center justify-between text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <div className="flex items-center gap-3">
                    <img
                      src={st.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={st.name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{st.name}</p>
                      <p className="text-[10px] text-zinc-400 font-mono block">Reg: {st.regNo}</p>
                      <p className="text-[10px] text-zinc-400 font-mono block font-semibold text-zinc-500 dark:text-zinc-300">📱 Mobile: {st.phone || '+91 98765 43210'}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {st.overallAttendancePct}%
                    </span>
                    <span className="text-[10px] text-zinc-400 block">Attendance</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Edit Slot Modal */}
      <Modal
        isOpen={slotModalOpen}
        onClose={() => setSlotModalOpen(false)}
        title={`Assign Slot for Class Section ${selectedSection}`}
        subtitle={`${editingSlot.day} — Period ${editingSlot.periodNumber} (${editingSlot.startTime} - ${editingSlot.endTime})`}
      >
        <form onSubmit={handleSaveSlot} className="space-y-4">
          {conflictWarning && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <strong>Conflict Alert!</strong>
                <p className="mt-0.5">{conflictWarning}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Select Subject Course (Sem {selectedSemester})
            </label>
            <select
              value={editingSlot.subjectId || ''}
              onChange={(e) => {
                const sub = subjects.find((s) => s.id === e.target.value);
                setEditingSlot({
                  ...editingSlot,
                  subjectId: e.target.value,
                  subjectCode: sub?.code || '',
                  subjectName: sub?.name || ''
                });
                setConflictWarning(null);
              }}
              className="w-full p-2.5 text-xs font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            >
              {subjects
                .filter((sub) => sub.departmentId === selectedDeptId && sub.semester === selectedSemester)
                .map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code} — {sub.name} ({sub.credits} Credits)
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Assign Faculty Instructor
              </label>
              <select
                value={editingSlot.facultyId || ''}
                onChange={(e) => {
                  const fac = facultyList.find((f) => f.id === e.target.value);
                  setEditingSlot({
                    ...editingSlot,
                    facultyId: e.target.value,
                    facultyName: fac?.name || ''
                  });
                  setConflictWarning(null);
                }}
                className="w-full p-2.5 text-xs font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              >
                {facultyList
                  .filter((f) => f.departmentId === selectedDeptId)
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.designation})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Classroom / Lab Hall
              </label>
              <input
                type="text"
                required
                value={editingSlot.roomNo || ''}
                onChange={(e) => {
                  setEditingSlot({ ...editingSlot, roomNo: e.target.value });
                  setConflictWarning(null);
                }}
                placeholder="e.g. Lab-302 / Room A-101"
                className="w-full p-2.5 text-xs font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-3">
            {editingSlot.id && timetable.some((s) => s.id === editingSlot.id) && (
              <button
                type="button"
                onClick={() => {
                  if (editingSlot.id) deleteTimetableSlot(editingSlot.id);
                  setSlotModalOpen(false);
                  addToast('Slot Cleared', 'Removed class slot from section timetable', 'info');
                }}
                className="px-3.5 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove Class
              </button>
            )}

            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:text-[#0D1127] dark:hover:bg-white text-white text-xs font-bold rounded-xl transition-colors ml-auto shadow-md"
            >
              Assign to Class Section {selectedSection}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
