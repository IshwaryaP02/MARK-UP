import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Student } from '../../types';
import { StudentDetailModal } from '../common/StudentDetailModal';
import {
  Layers,
  Users,
  Download,
  Calendar,
  CheckCircle2,
  XCircle,
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
  ArrowRight,
  UserPlus,
  Search,
  BookOpen,
  Clock
} from 'lucide-react';

export const AllClassesView: React.FC = () => {
  const { students, subjects, departments, addStudent, addToast, currentUser, timetable } = useApp();

  const [selectedDeptId, setSelectedDeptId] = useState<string>(
    currentUser.departmentId || departments[0]?.id || 'dept-cs'
  );
  const [selectedSemester, setSelectedSemester] = useState<number>(4);
  const [selectedClassSection, setSelectedClassSection] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'overall'>('weekly');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);

  // Add Student Form State
  const [isAddStudentOpen, setIsAddStudentOpen] = useState<boolean>(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    regNo: '',
    rollNo: '',
    departmentId: selectedDeptId,
    semester: selectedSemester,
    section: 'A',
    email: '',
    phone: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    fatherName: '',
    motherName: '',
    parentPhone: ''
  });

  const availableSections = ['Section A', 'Section B', 'Section C', 'Section D'];

  // Filter students for the selected class section
  const getClassStudents = (sec: string) => {
    const secLetter = sec.replace('Section ', '').trim();
    return students.filter(
      (s) =>
        s.departmentId === selectedDeptId &&
        s.semester === selectedSemester &&
        (s.section === secLetter || (!s.section && secLetter === 'A'))
    );
  };

  // Generate mock attendance stats for student breakdown
  const getEnrichedStudentStats = (studentList: typeof students) => {
    return studentList.map((st, idx) => {
      const basePct = st.overallAttendancePct || 88;
      const presentDays = Math.round((basePct / 100) * 20);
      const absentDays = 20 - presentDays;
      const weeklyPct = Math.min(100, Math.max(50, basePct + (idx % 2 === 0 ? 5 : -5)));
      const monthlyPct = Math.min(100, Math.max(45, basePct + (idx % 3 === 0 ? 3 : -8)));

      return {
        ...st,
        presentDays,
        absentDays,
        weeklyPct,
        monthlyPct
      };
    });
  };

  const currentStudentsRaw = selectedClassSection ? getClassStudents(selectedClassSection) : [];
  const classStudentsEnriched = getEnrichedStudentStats(currentStudentsRaw);

  const filteredClassStudents = classStudentsEnriched.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.regNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sorting for Who has more Absents vs Presents
  const sortedByAbsents = [...classStudentsEnriched].sort((a, b) => b.absentDays - a.absentDays);
  const sortedByPresents = [...classStudentsEnriched].sort((a, b) => b.presentDays - a.presentDays);

  const handleCreateStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.regNo) {
      addToast('Validation Error', 'Student name and register number are required', 'danger');
      return;
    }

    addStudent({
      name: newStudent.name,
      regNo: newStudent.regNo,
      rollNo: newStudent.rollNo || `R-${Math.floor(100 + Math.random() * 900)}`,
      departmentId: newStudent.departmentId,
      semester: newStudent.semester,
      section: newStudent.section,
      email: newStudent.email || `${newStudent.regNo.toLowerCase()}@university.edu`,
      phone: newStudent.phone || '9876543210',
      gender: newStudent.gender,
      fatherName: newStudent.fatherName,
      motherName: newStudent.motherName,
      parentPhone: newStudent.parentPhone,
      address: 'University Campus Hostel'
    });

    setIsAddStudentOpen(false);
    setNewStudent({
      name: '',
      regNo: '',
      rollNo: '',
      departmentId: selectedDeptId,
      semester: selectedSemester,
      section: 'A',
      email: '',
      phone: '',
      gender: 'Male',
      fatherName: '',
      motherName: '',
      parentPhone: ''
    });
  };

  const handleExportCSV = () => {
    if (!selectedClassSection) return;

    const headers = ['Reg No', 'Roll No', 'Student Name', 'Present Days', 'Absent Days', 'Weekly %', 'Monthly %', 'Overall %'];
    const rows = filteredClassStudents.map((s) => [
      s.regNo,
      s.rollNo,
      `"${s.name}"`,
      s.presentDays,
      s.absentDays,
      `${s.weeklyPct}%`,
      `${s.monthlyPct}%`,
      `${s.overallAttendancePct}%`
    ]);

    const csvString = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedClassSection}_Semester${selectedSemester}_Attendance_${timeframe.toUpperCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('Report Exported', `Downloaded CSV attendance report for ${selectedClassSection}`, 'success');
  };

  // Get school-style daily period schedule for a class section
  const getClassSchedule = (secLetter: string) => {
    return [
      { period: 1, time: '09:00 AM - 10:00 AM', subject: 'Data Structures & Algorithms', faculty: 'Dr. Alan Turing', room: 'LH-101' },
      { period: 2, time: '10:00 AM - 11:00 AM', subject: 'Operating Systems', faculty: 'Prof. Sarah Jenkins', room: 'LH-101' },
      { period: 3, time: '11:15 AM - 12:15 PM', subject: 'Database Management Systems', faculty: 'Dr. Robert Vance', room: 'LH-101' },
      { period: 4, time: '01:15 PM - 02:15 PM', subject: 'Computer Networks', faculty: 'Prof. Michael Scott', room: 'LH-101' },
      { period: 5, time: '02:15 PM - 03:15 PM', subject: 'Software Engineering', faculty: 'Dr. Emily Watson', room: 'LH-101' }
    ];
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#313866] dark:text-[#8A92D0]" /> All Classes Inspector & Roster
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            School-style class view where students stay fixed in Class A/B/C/D and faculty rotate. Add new students and export class reports.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300">Semester:</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(Number(e.target.value))}
              className="px-3 py-1.5 bg-white dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-[#313866] dark:text-[#8A92D0]"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsAddStudentOpen(true)}
            className="px-4 py-2 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:hover:bg-[#a3a8e0] text-white dark:text-[#0D1127] text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0"
          >
            <UserPlus className="w-4 h-4" /> Add New Student
          </button>
        </div>
      </div>

      {/* Class Sections Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {availableSections.map((sec) => {
          const secStudents = getClassStudents(sec);
          const avgPct = secStudents.length
            ? Math.round(secStudents.reduce((acc, s) => acc + s.overallAttendancePct, 0) / secStudents.length)
            : 88;

          return (
            <div
              key={sec}
              onClick={() => setSelectedClassSection(sec)}
              className="bg-white dark:bg-[#161B33] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-[#313866] dark:hover:border-[#8A92D0] transition-all cursor-pointer group space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-[#F3F4F9] dark:bg-[#313866]/50 text-[#313866] dark:text-[#8A92D0] text-xs font-extrabold rounded-xl">
                  {sec}
                </span>
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Sem {selectedSemester}</span>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 group-hover:text-[#313866] dark:group-hover:text-[#8A92D0] transition-colors">
                  Class {sec}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">Constant Students: {secStudents.length} Enrolled</p>
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold block">Avg Attendance</span>
                  <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{avgPct}%</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-[#313866] dark:text-[#8A92D0] group-hover:translate-x-1 transition-transform">
                  <span>Open Class Roster</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Class Details & Attendance Inspector Modal */}
      {selectedClassSection && (
        <Modal
          isOpen={!!selectedClassSection}
          onClose={() => {
            setSelectedClassSection(null);
            setSearchQuery('');
          }}
          title={`Class Roster & Schedule: ${selectedClassSection}`}
          subtitle={`Semester ${selectedSemester} · Department of ${currentUser.departmentName || 'Computer Science'}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            {/* School Period Schedule Preview */}
            <div className="p-3.5 bg-zinc-50 dark:bg-[#0D1127] border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2">
              <h4 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#313866] dark:text-[#8A92D0]" /> Daily Period Schedule (Rotating Faculty)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {getClassSchedule(selectedClassSection.replace('Section ', '')).map((p) => (
                  <div key={p.period} className="p-2 bg-white dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400">
                      <span>Period {p.period} ({p.time})</span>
                      <span>Room {p.room}</span>
                    </div>
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 text-xs mt-0.5">{p.subject}</div>
                    <div className="text-[11px] text-[#313866] dark:text-[#8A92D0] font-semibold mt-0.5">Faculty: {p.faculty}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-zinc-50 dark:bg-[#0D1127] border border-zinc-200 dark:border-zinc-800 rounded-2xl">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search student by name or register number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#313866]"
                />
              </div>

              {/* Timeframe selector & Export */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white dark:bg-[#161B33] p-1 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setTimeframe('weekly')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      timeframe === 'weekly' ? 'bg-[#313866] text-white' : 'text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setTimeframe('monthly')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      timeframe === 'monthly' ? 'bg-[#313866] text-white' : 'text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    Monthly
                  </button>
                </div>

                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>
            </div>

            {/* Complete Class Roster Breakdown Table */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
              <div className="p-3 bg-zinc-50 dark:bg-[#0D1127] border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
                <span>Class Students ({filteredClassStudents.length} Enrolled)</span>
                <span className="text-[#313866] dark:text-[#8A92D0]">Semester {selectedSemester}</span>
              </div>

              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-100 dark:bg-[#161B33] text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-2.5 pl-3">Reg No & Name</th>
                      <th className="p-2.5">Roll No</th>
                      <th className="p-2.5">Present Days</th>
                      <th className="p-2.5">Absent Days</th>
                      <th className="p-2.5">Weekly %</th>
                      <th className="p-2.5 text-right pr-3">Overall %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-semibold">
                    {filteredClassStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-zinc-400 text-xs">
                          No students found in this class section.
                        </td>
                      </tr>
                    ) : (
                      filteredClassStudents.map((st) => (
                        <tr key={st.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          <td className="p-2.5 pl-3">
                            <button
                              type="button"
                              onClick={() => setSelectedStudentForModal(st)}
                              className="font-bold text-zinc-900 dark:text-zinc-100 block hover:text-[#313866] dark:hover:text-[#8A92D0] hover:underline text-left"
                            >
                              {st.name}
                            </button>
                            <span className="text-[10px] font-mono font-bold text-[#313866] dark:text-[#8A92D0] block">{st.regNo}</span>
                            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 block">📱 {st.phone || '+91 98765 43210'}</span>
                          </td>
                          <td className="p-2.5 font-mono text-zinc-500">{st.rollNo}</td>
                          <td className="p-2.5 text-emerald-600 font-bold">{st.presentDays} Days</td>
                          <td className="p-2.5 text-rose-600 font-bold">{st.absentDays} Days</td>
                          <td className="p-2.5 font-mono">{st.weeklyPct}%</td>
                          <td className="p-2.5 text-right pr-3 font-mono font-extrabold text-[#313866] dark:text-[#8A92D0]">
                            {st.overallAttendancePct}%
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add New Student Modal */}
      <Modal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        title="Register New Student to Class Roster"
        subtitle="Add a new student into a specific class section (School-style fixed class assignment)"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateStudentSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Register Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 2026CSE088"
                value={newStudent.regNo}
                onChange={(e) => setNewStudent({ ...newStudent, regNo: e.target.value })}
                className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Roll Number
              </label>
              <input
                type="text"
                placeholder="e.g. R-45"
                value={newStudent.rollNo}
                onChange={(e) => setNewStudent({ ...newStudent, rollNo: e.target.value })}
                className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Assigned Class Section
              </label>
              <select
                value={newStudent.section}
                onChange={(e) => setNewStudent({ ...newStudent, section: e.target.value })}
                className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-[#313866] dark:text-[#8A92D0]"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Father Name
              </label>
              <input
                type="text"
                placeholder="Father's full name"
                value={newStudent.fatherName}
                onChange={(e) => setNewStudent({ ...newStudent, fatherName: e.target.value })}
                className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Parent Phone Number
              </label>
              <input
                type="text"
                placeholder="Parent mobile number"
                value={newStudent.parentPhone}
                onChange={(e) => setNewStudent({ ...newStudent, parentPhone: e.target.value })}
                className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#313866] hover:bg-[#161B33] text-white font-bold rounded-xl transition-all shadow-md"
          >
            Save & Add Student to Roster
          </button>
        </form>
      </Modal>

      <StudentDetailModal
        isOpen={!!selectedStudentForModal}
        onClose={() => setSelectedStudentForModal(null)}
        student={selectedStudentForModal}
      />
    </div>
  );
};
