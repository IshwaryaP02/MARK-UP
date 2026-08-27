import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import {
  Search,
  Plus,
  FileUp,
  Download,
  Edit2,
  Trash2,
  Eye,
  GraduationCap,
  Mail,
  Phone,
  Building2,
  AlertTriangle
} from 'lucide-react';

export const StudentManagement: React.FC = () => {
  const { students, departments, addStudent, updateStudent, deleteStudent, bulkImportStudents, addToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Student>>({
    name: '',
    regNo: '',
    rollNo: '',
    email: '',
    departmentId: departments[0]?.id || 'dept-cs',
    departmentName: departments[0]?.name || 'Computer Science & Engineering',
    semester: 4,
    section: 'A',
    batch: '2022-2026',
    guardianName: '',
    guardianPhone: '',
    active: true
  });

  const [csvText, setCsvText] = useState('');

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.regNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'all' || s.departmentId === deptFilter;
    return matchesSearch && matchesDept;
  });

  const handleOpenAdd = (student?: Student) => {
    if (student) {
      setSelectedStudent(student);
      setFormData(student);
    } else {
      setSelectedStudent(null);
      setFormData({
        name: '',
        regNo: `2024CS${1048 + students.length}`,
        rollNo: `24CS${String(students.length + 1).padStart(2, '0')}`,
        email: '',
        departmentId: departments[0]?.id || 'dept-cs',
        departmentName: departments[0]?.name || 'Computer Science & Engineering',
        semester: 4,
        section: 'A',
        batch: '2022-2026',
        guardianName: '',
        guardianPhone: '',
        active: true
      });
    }
    setAddModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.regNo) return;

    if (selectedStudent) {
      updateStudent(formData as Student);
    } else {
      addStudent(formData as Omit<Student, 'id' | 'overallAttendancePct'>);
    }
    setAddModalOpen(false);
  };

  const handleImportCSV = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return;

    const lines = csvText.trim().split('\n');
    const parsed: Array<Omit<Student, 'id' | 'overallAttendancePct'>> = [];

    lines.forEach((line) => {
      const parts = line.split(',');
      if (parts.length >= 3) {
        parsed.push({
          regNo: parts[0]?.trim() || `2024CS${Math.floor(Math.random() * 9000 + 1000)}`,
          rollNo: parts[1]?.trim() || '24CS99',
          name: parts[2]?.trim() || 'Imported Student',
          email: parts[3]?.trim() || 'student@university.edu',
          departmentId: 'dept-cs',
          departmentName: 'Computer Science & Engineering',
          semester: 4,
          section: 'A',
          batch: '2022-2026',
          guardianName: 'Guardian',
          guardianPhone: '+1 555-000-0000',
          active: true
        });
      }
    });

    if (parsed.length > 0) {
      bulkImportStudents(parsed);
      setImportModalOpen(false);
      setCsvText('');
    } else {
      addToast('Invalid CSV format', 'Provide regNo, rollNo, name, email separated by commas', 'danger');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Students Roster Management
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            View, add, edit, or bulk import registered university students
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-xl transition-colors"
          >
            <FileUp className="w-4 h-4 text-[#313866] dark:text-[#8A92D0]" />
            CSV Bulk Import
          </button>
          <button
            onClick={() => handleOpenAdd()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:text-[#0D1127] dark:hover:bg-white text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Register Student
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, Reg No, or Roll No..."
            className="w-full pl-10 pr-3 py-2 text-xs bg-white dark:bg-[#21284C] border border-zinc-200 dark:border-[#2D376A] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#313866]"
          />
        </div>

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="w-full sm:w-56 px-3 py-2 text-xs bg-white dark:bg-[#21284C] border border-zinc-200 dark:border-[#2D376A] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#313866]"
        >
          <option value="all">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#21284C] border border-zinc-200/80 dark:border-[#2D376A] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5 pl-4">Student</th>
                <th className="p-3.5">Reg No & Roll</th>
                <th className="p-3.5">Department & Sec</th>
                <th className="p-3.5">Attendance %</th>
                <th className="p-3.5">Guardian</th>
                <th className="p-3.5 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-400">
                    No students match the search criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const isLow = s.overallAttendancePct < 75;
                  return (
                    <tr key={s.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="p-3.5 pl-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={s.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100'}
                            alt={s.name}
                            className="w-9 h-9 rounded-xl object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
                          />
                          <div>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{s.name}</span>
                            <span className="text-[11px] text-zinc-400">{s.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-medium">
                        <span className="block font-mono text-[#313866] dark:text-[#8A92D0] font-bold">{s.regNo}</span>
                        <span className="block text-[10px] text-zinc-600 dark:text-zinc-300 font-mono font-semibold">📱 {s.phone || '+91 98765 43210'}</span>
                        <span className="text-[10px] text-zinc-400">Roll: {s.rollNo}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="block font-semibold text-zinc-800 dark:text-zinc-200">{s.departmentName}</span>
                        <span className="text-[10px] text-zinc-400">Sem {s.semester} - Sec {s.section}</span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${isLow ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {s.overallAttendancePct}%
                          </span>
                          {isLow && (
                            <span className="p-1 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400" title="Low Attendance Flag">
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="block text-zinc-800 dark:text-zinc-200">{s.guardianName}</span>
                        <span className="text-[10px] text-zinc-400">{s.guardianPhone}</span>
                      </td>
                      <td className="p-3.5 text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedStudent(s);
                              setDetailModalOpen(true);
                            }}
                            className="p-1.5 text-zinc-400 hover:text-[#313866] hover:bg-[#313866]/10 rounded-lg transition-colors"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenAdd(s)}
                            className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                            title="Edit Record"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteStudent(s.id)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={selectedStudent ? 'Edit Student Details' : 'Register New Student'}
        subtitle="Ensure exact Reg No and department assignment"
      >
        <form onSubmit={handleSaveStudent} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Registration No</label>
              <input
                type="text"
                required
                value={formData.regNo || ''}
                onChange={(e) => setFormData({ ...formData, regNo: e.target.value })}
                className="w-full p-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Roll Number</label>
              <input
                type="text"
                required
                value={formData.rollNo || ''}
                onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                className="w-full p-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Student Email</label>
              <input
                type="email"
                required
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Department</label>
              <select
                value={formData.departmentId || ''}
                onChange={(e) => {
                  const d = departments.find((dept) => dept.id === e.target.value);
                  setFormData({ ...formData, departmentId: e.target.value, departmentName: d?.name || '' });
                }}
                className="w-full p-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Semester</label>
              <input
                type="number"
                min={1}
                max={6}
                value={formData.semester || 4}
                onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                className="w-full p-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Section</label>
              <input
                type="text"
                value={formData.section || 'A'}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full p-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Guardian Name</label>
              <input
                type="text"
                value={formData.guardianName || ''}
                onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                className="w-full p-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Guardian Contact Phone</label>
              <input
                type="text"
                value={formData.guardianPhone || ''}
                onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                className="w-full p-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:text-[#0D1127] dark:hover:bg-white text-white text-xs font-bold rounded-xl transition-colors mt-2"
          >
            {selectedStudent ? 'Save Changes' : 'Register Student'}
          </button>
        </form>
      </Modal>

      {/* Bulk CSV Import Modal */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="CSV Bulk Import Students"
        subtitle="Paste CSV rows in format: RegNo, RollNo, Name, Email"
      >
        <form onSubmit={handleImportCSV} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              CSV Data Rows
            </label>
            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={`2024CS1050, 24CS10, Michael Scott, michael.s@student.edu\n2024CS1051, 24CS11, Pam Beesly, pam.b@student.edu`}
              className="w-full p-3 font-mono text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#313866]"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:text-[#0D1127] dark:hover:bg-white text-white text-xs font-bold rounded-xl transition-colors"
          >
            Parse & Add Students
          </button>
        </form>
      </Modal>

      {/* Student Profile Detail Modal */}
      {selectedStudent && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`Student Card: ${selectedStudent.name}`}
          subtitle={`Reg No: ${selectedStudent.regNo}`}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-[#161B33]/80 rounded-2xl">
              <img
                src={selectedStudent.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100'}
                alt={selectedStudent.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#313866]"
              />
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{selectedStudent.name}</h4>
                <p className="text-zinc-400">{selectedStudent.email}</p>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-[#313866]/10 text-[#313866] dark:bg-[#313866]/50 dark:text-[#8A92D0] font-semibold rounded-md">
                    {selectedStudent.departmentName}
                  </span>
                  <span className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 font-semibold rounded-md">
                    Sem {selectedStudent.semester} - Sec {selectedStudent.section}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-zinc-50 dark:bg-[#161B33]/60 rounded-xl">
                <span className="text-zinc-400 block text-[10px] uppercase font-bold">Overall Attendance</span>
                <span className="text-xl font-bold text-[#313866] dark:text-[#8A92D0]">
                  {selectedStudent.overallAttendancePct}%
                </span>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
                <span className="text-zinc-400 block text-[10px] uppercase font-bold">Eligibility Status</span>
                <span className={`text-sm font-bold ${selectedStudent.overallAttendancePct >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedStudent.overallAttendancePct >= 75 ? 'Eligible for Exams' : 'Flagged (Below 75%)'}
                </span>
              </div>
            </div>

            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
              <h5 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2">Guardian Contact Information</h5>
              <p className="text-zinc-600 dark:text-zinc-300">Name: {selectedStudent.guardianName}</p>
              <p className="text-zinc-600 dark:text-zinc-300">Phone: {selectedStudent.guardianPhone}</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
