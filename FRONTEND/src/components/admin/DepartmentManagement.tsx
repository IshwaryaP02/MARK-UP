import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Department } from '../../types';
import { Modal } from '../common/Modal';
import {
  Building2,
  Plus,
  Edit2,
  Users,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  FileSpreadsheet,
  Download,
  Search,
  AlertTriangle,
  BarChart2,
  ArrowRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const DepartmentManagement: React.FC = () => {
  const { departments, facultyList, students, subjects, addDepartment, updateDepartment, addToast } = useApp();

  // Admin department scope is restricted to Computer Science only.
  const csOnly = (d: Department) =>
    d.id === 'dept-cs' || d.name?.toLowerCase().includes('computer science');
  const adminDepartments = departments.filter(csOnly);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDeptForEdit, setSelectedDeptForEdit] = useState<Department | null>(null);

  // Inspected Department for Deep Analysis
  const [inspectedDept, setInspectedDept] = useState<Department | null>(null);
  const [analysisSearch, setAnalysisSearch] = useState('');

  const [formData, setFormData] = useState<Partial<Department>>({
    code: '',
    name: '',
    hodId: '',
    hodName: '',
    studentCount: 200,
    facultyCount: 15,
    subjectsCount: 12
  });

  const handleOpenEditModal = (dept?: Department, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (dept) {
      setSelectedDeptForEdit(dept);
      setFormData(dept);
    } else {
      setSelectedDeptForEdit(null);
      setFormData({
        code: '',
        name: '',
        hodId: facultyList[0]?.id || '',
        hodName: facultyList[0]?.name || '',
        studentCount: 180,
        facultyCount: 12,
        subjectsCount: 10
      });
    }
    setModalOpen(true);
  };

  const handleSaveDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    if (selectedDeptForEdit) {
      updateDepartment(formData as Department);
      addToast('Department Updated', `Saved changes for ${formData.name}`, 'success');
    } else {
      addDepartment(formData as Omit<Department, 'id' | 'avgAttendancePct'>);
      addToast('Department Created', `Created ${formData.name}`, 'success');
    }
    setModalOpen(false);
  };

  // Helper getters for Inspected Department Analysis
  const getDeptStudents = (dept: Department) => {
    return students.filter(
      (s) => s.departmentId === dept.id || s.departmentName?.toLowerCase().includes(dept.code.toLowerCase())
    );
  };

  const getDeptFaculty = (dept: Department) => {
    return facultyList.filter(
      (f) => f.departmentId === dept.id || f.departmentName?.toLowerCase().includes(dept.code.toLowerCase())
    );
  };

  const getDeptFlaggedStudents = (dept: Department) => {
    return getDeptStudents(dept).filter((s) => s.overallAttendancePct < 75);
  };

  // Export Department Analysis CSV
  const handleExportDeptAnalysis = (dept: Department) => {
    const deptStudents = getDeptStudents(dept);
    const flagged = getDeptFlaggedStudents(dept);
    const deptFac = getDeptFaculty(dept);

    let csvContent = `DEPARTMENT COMPLIANCE & ATTENDANCE ANALYSIS REPORT\n`;
    csvContent += `Department: ${dept.name} (${dept.code})\n`;
    csvContent += `Head of Department: ${dept.hodName} (HOD Phone: +91 98765 11223)\n`;
    csvContent += `Overall Avg Attendance: ${dept.avgAttendancePct}%\n`;
    csvContent += `Total Enrolled Students: ${deptStudents.length}\n`;
    csvContent += `Total Faculty Staff: ${deptFac.length}\n`;
    csvContent += `Flagged Students (<75%): ${flagged.length}\n\n`;

    csvContent += `FLAGGED STUDENTS LIST (<75% ATTENDANCE LIMIT)\n`;
    csvContent += `Reg No,Student Phone,Roll No,Student Name,Semester,Attendance %,Eligibility Status,Guardian Contact\n`;
    flagged.forEach((s) => {
      csvContent += `${s.regNo},${s.phone || '+91 98765 43210'},${s.rollNo},"${s.name}",Sem ${s.semester},${s.overallAttendancePct}%,Ineligible (Below 75%),${s.guardianName} (${s.guardianPhone})\n`;
    });

    csvContent += `\nALL DEPARTMENT ENROLLED STUDENTS ROSTER\n`;
    csvContent += `Reg No,Student Phone,Roll No,Student Name,Semester,Attendance %,Exam Eligibility Status\n`;
    deptStudents.forEach((s) => {
      csvContent += `${s.regNo},${s.phone || '+91 98765 43210'},${s.rollNo},"${s.name}",Sem ${s.semester},${s.overallAttendancePct}%,${s.overallAttendancePct >= 75 ? 'Eligible' : 'Ineligible'}\n`;
    });

    csvContent += `\nFACULTY STAFF ASSIGNMENTS\n`;
    csvContent += `Employee ID,Faculty Name,Designation,Email\n`;
    deptFac.forEach((f) => {
      csvContent += `${f.employeeId},"${f.name}",${f.designation},${f.email}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${dept.code}_Department_Analysis_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('Report Exported', `Exported full department student roster & analysis CSV for ${dept.name}`, 'success');
  };

  // Mock Semester Attendance Data for Chart
  const semChartData = [
    { sem: 'Sem 1', pct: 88 },
    { sem: 'Sem 2', pct: 90 },
    { sem: 'Sem 3', pct: 86 },
    { sem: 'Sem 4', pct: 89 },
    { sem: 'Sem 5', pct: 85 },
    { sem: 'Sem 6', pct: 92 },
    { sem: 'Sem 7', pct: 87 },
    { sem: 'Sem 8', pct: 84 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Academic Departments Directory & Analysis
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Click any department card to inspect deep attendance analytics, faculty roster, and export compliance reports.
          </p>
        </div>

        <button
          onClick={() => handleOpenEditModal()}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:hover:bg-[#a3a8e0] text-white dark:text-[#0D1127] text-xs font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Department
        </button>
      </div>

      {/* Departments Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {adminDepartments.map((dept) => {
          const deptStudents = getDeptStudents(dept);
          const deptFac = getDeptFaculty(dept);
          const flagged = getDeptFlaggedStudents(dept);

          return (
            <div
              key={dept.id}
              onClick={() => setInspectedDept(dept)}
              className="bg-white dark:bg-[#161B33] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#313866] dark:hover:border-[#8A92D0] transition-all cursor-pointer group space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#F3F4F9] dark:bg-[#0D1127] text-[#313866] dark:text-[#8A92D0] flex items-center justify-center font-bold text-lg shadow-inner">
                    {dept.code}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-[#313866] dark:group-hover:text-[#8A92D0] transition-colors">
                      {dept.name}
                    </h3>
                    <p className="text-xs text-[#313866] dark:text-[#8A92D0] font-semibold mt-0.5">
                      HOD: {dept.hodName || 'Unassigned'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleOpenEditModal(dept, e)}
                    className="p-1.5 text-zinc-400 hover:text-[#313866] hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Edit Department Details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                <div className="p-2 bg-zinc-50 dark:bg-[#0D1127] rounded-xl">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">{deptStudents.length || dept.studentCount}</span>
                  <span className="text-[10px] text-zinc-400 flex items-center justify-center gap-1 mt-0.5">
                    <GraduationCap className="w-3 h-3" /> Students
                  </span>
                </div>

                <div className="p-2 bg-zinc-50 dark:bg-[#0D1127] rounded-xl">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">{deptFac.length || dept.facultyCount}</span>
                  <span className="text-[10px] text-zinc-400 flex items-center justify-center gap-1 mt-0.5">
                    <Users className="w-3 h-3" /> Faculty
                  </span>
                </div>

                <div className="p-2 bg-zinc-50 dark:bg-[#0D1127] rounded-xl">
                  <span className="text-xs font-bold text-[#313866] dark:text-[#8A92D0] block">{dept.avgAttendancePct}%</span>
                  <span className="text-[10px] text-zinc-400 flex items-center justify-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3 h-3" /> Attendance
                  </span>
                </div>
              </div>

              {/* Footer action */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs font-bold text-[#313866] dark:text-[#8A92D0]">
                <span className="text-[11px] text-zinc-400 font-normal">
                  {flagged.length > 0 ? `${flagged.length} At-Risk (<75%)` : '100% Compliant'}
                </span>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Inspect Analysis <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Department Deep Analysis Modal */}
      {inspectedDept && (
        <Modal
          isOpen={!!inspectedDept}
          onClose={() => setInspectedDept(null)}
          title={`Department Analysis: ${inspectedDept.name} (${inspectedDept.code})`}
          subtitle={`HOD: ${inspectedDept.hodName} · HOD Phone: +91 98765 11223 · Dept Avg: ${inspectedDept.avgAttendancePct}%`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            {/* Top Analysis Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-zinc-50 dark:bg-[#0D1127] border border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <div>
                <h4 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                  {inspectedDept.name} Performance & Compliance Overview
                </h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Assigned HOD Phone: <span className="font-mono font-bold text-[#313866] dark:text-[#8A92D0]">+91 98765 11223</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportDeptAnalysis(inspectedDept)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Export Full Department Report
                </button>
              </div>
            </div>

            {/* Semester Attendance Distribution Chart */}
            <div className="p-4 bg-white dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#313866] dark:text-[#8A92D0]" /> Semester Attendance Average (%)
              </h4>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={semChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#37415120" />
                    <XAxis dataKey="sem" stroke="#9CA3AF" fontSize={10} />
                    <YAxis domain={[60, 100]} stroke="#9CA3AF" fontSize={10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0D1127', borderColor: '#313866', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                    />
                    <Bar dataKey="pct" fill="#313866" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Flagged Students List in this Department */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
              <div className="p-3 bg-zinc-50 dark:bg-[#0D1127] border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between font-bold">
                <span className="text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> At-Risk Flagged Students (&lt;75% Limit)
                </span>
                <span className="text-rose-600 dark:text-rose-400 font-extrabold">
                  {getDeptFlaggedStudents(inspectedDept).length} Flagged
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100 dark:bg-[#161B33] text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-2.5 pl-3">Reg No & Student Phone</th>
                      <th className="p-2.5">Student Name</th>
                      <th className="p-2.5">Semester</th>
                      <th className="p-2.5">Attendance %</th>
                      <th className="p-2.5">Exam Status</th>
                      <th className="p-2.5 text-right pr-3">Parent Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-semibold">
                    {getDeptFlaggedStudents(inspectedDept).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-zinc-400">
                          All students in this department meet minimum 75% attendance.
                        </td>
                      </tr>
                    ) : (
                      getDeptFlaggedStudents(inspectedDept).map((s) => (
                        <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                          <td className="p-2.5 pl-3">
                            <span className="text-[11px] font-mono font-bold text-[#313866] dark:text-[#8A92D0] block">{s.regNo}</span>
                            <span className="text-[10px] font-mono text-zinc-500 block">Ph: {s.phone || '+91 98765 43210'}</span>
                          </td>
                          <td className="p-2.5 font-bold text-zinc-900 dark:text-zinc-100">{s.name}</td>
                          <td className="p-2.5 font-bold">Sem {s.semester}</td>
                          <td className="p-2.5 font-extrabold text-rose-600 dark:text-rose-400">{s.overallAttendancePct}%</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 font-bold rounded-md text-[10px]">
                              Ineligible
                            </span>
                          </td>
                          <td className="p-2.5 text-right pr-3 font-mono text-zinc-500">{s.guardianPhone}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ALL ENROLLED DEPARTMENT STUDENTS LIST AT END */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden space-y-0">
              <div className="p-3 bg-zinc-50 dark:bg-[#0D1127] border-b border-zinc-200 dark:border-zinc-800 font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-[#313866] dark:text-[#8A92D0]" />
                  All Enrolled Department Students Roster ({getDeptStudents(inspectedDept).length})
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">Complete List for Export</span>
              </div>

              <div className="max-h-52 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100 dark:bg-[#161B33] text-zinc-400 font-semibold uppercase tracking-wider text-[10px] sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5 pl-3">S.No</th>
                      <th className="p-2.5">Reg No & Student Phone</th>
                      <th className="p-2.5">Student Name</th>
                      <th className="p-2.5">Semester</th>
                      <th className="p-2.5">Attendance %</th>
                      <th className="p-2.5">Eligibility</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-semibold">
                    {getDeptStudents(inspectedDept).map((s, idx) => (
                      <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                        <td className="p-2.5 pl-3 text-zinc-400 font-mono">{idx + 1}</td>
                        <td className="p-2.5">
                          <span className="font-mono font-bold text-[#313866] dark:text-[#8A92D0] block">{s.regNo}</span>
                          <span className="text-[10px] font-mono text-zinc-500 block">Ph: {s.phone || '+91 98765 43210'}</span>
                        </td>
                        <td className="p-2.5 font-bold text-zinc-900 dark:text-zinc-100">{s.name}</td>
                        <td className="p-2.5 font-semibold text-zinc-700 dark:text-zinc-300">Sem {s.semester}</td>
                        <td className="p-2.5 font-extrabold">
                          <span className={s.overallAttendancePct >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                            {s.overallAttendancePct}%
                          </span>
                        </td>
                        <td className="p-2.5">
                          {s.overallAttendancePct >= 75 ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-bold rounded-md text-[10px]">
                              Eligible
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 font-bold rounded-md text-[10px]">
                              Ineligible
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Department Faculty Staff Roster */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
              <div className="p-3 bg-zinc-50 dark:bg-[#0D1127] border-b border-zinc-200 dark:border-zinc-800 font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
                <span>Assigned Department Faculty ({getDeptFaculty(inspectedDept).length})</span>
                <span className="text-[#313866] dark:text-[#8A92D0]">Staff Compliance: 100%</span>
              </div>

              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100 dark:bg-[#161B33] text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-2.5 pl-3">Emp ID & Name</th>
                      <th className="p-2.5">Designation</th>
                      <th className="p-2.5">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-semibold">
                    {getDeptFaculty(inspectedDept).map((f) => (
                      <tr key={f.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                        <td className="p-2.5 pl-3">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{f.name}</span>
                          <span className="text-[10px] font-mono text-zinc-400">{f.employeeId}</span>
                        </td>
                        <td className="p-2.5 font-medium text-zinc-600 dark:text-zinc-300">{f.designation}</td>
                        <td className="p-2.5 font-mono text-zinc-500">{f.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Department Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedDeptForEdit ? 'Edit Department Details' : 'Create New Department'}
        subtitle="Specify code, name, and appoint Head of Department"
      >
        <form onSubmit={handleSaveDepartment} className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Dept Code</label>
              <input
                type="text"
                required
                placeholder="CSE"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full p-2.5 text-xs font-bold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Department Name</label>
              <input
                type="text"
                required
                placeholder="Computer Science & Engineering"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Appoint Head of Department (HOD)</label>
            <select
              value={formData.hodId || ''}
              onChange={(e) => {
                const fac = facultyList.find((f) => f.id === e.target.value);
                setFormData({
                  ...formData,
                  hodId: e.target.value,
                  hodName: fac?.name || ''
                });
              }}
              className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-[#313866] dark:text-[#8A92D0]"
            >
              <option value="">-- Select Faculty for HOD --</option>
              {facultyList.filter((f) => f.departmentId === 'dept-cs' || f.departmentName?.toLowerCase().includes('computer')).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.employeeId})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#313866] hover:bg-[#161B33] text-white text-xs font-bold rounded-xl transition-colors shadow-md mt-2"
          >
            {selectedDeptForEdit ? 'Save Department Changes' : 'Create Department'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
