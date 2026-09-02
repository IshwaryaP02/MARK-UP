import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../common/BackButton';
import { FileSpreadsheet, Download, FileText, Filter, CheckCircle2, AlertTriangle, ShieldCheck, Users, Phone, Search, Building2, GraduationCap } from 'lucide-react';
import { academicYearLabel } from '../../services/academicStructure';

export const ReportsHub: React.FC = () => {
  const { currentUser, students, departments, subjects, addToast } = useApp();

  const isHod = currentUser.role === 'hod';
  const hodDeptName = currentUser.departmentName || 'Computer Science';
  const hodPhoneNumber = currentUser.phone || '+91 98765 11223';

  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'subject' | 'low_att' | 'faculty'>('low_att');
  const [selectedDept, setSelectedDept] = useState<string>(isHod ? 'hod_dept' : 'dept-cs');
  const [dateRange, setDateRange] = useState('2026-08-01');

  // Student Class Search (scoped to single selected department: Computer Science)
  const permittedDepts = departments.filter((d) => d.id === 'dept-cs' || d.name?.toLowerCase().includes('computer science'));
  const classSearchDeptId = permittedDepts[0]?.id || 'dept-cs';

  // Academic structure: Computer Science -> UG (1st/2nd/3rd Year) + MSc (1st/2nd Year); IT -> MSc only.
  const classYearSemesters: Array<{ label: string; sems: number[] }> = [
    { label: 'UG 1st Year', sems: [1, 2] },
    { label: 'UG 2nd Year', sems: [3, 4] },
    { label: 'UG 3rd Year', sems: [5, 6] },
    { label: 'MSc 1st Year', sems: [7, 8] },
    { label: 'MSc 2nd Year', sems: [9, 10] }
  ];

  const [classQuery, setClassQuery] = useState('');
  const [classYear, setClassYear] = useState('All');

  const classSearchResults = students.filter((s) => {
    if (s.departmentId !== classSearchDeptId) return false;
    if (classYear !== 'All') {
      const cat = classYearSemesters.find((c) => c.label === classYear);
      if (cat && !cat.sems.includes(s.semester)) return false;
    }
    if (classQuery) {
      const q = classQuery.toLowerCase();
      if (!s.name.toLowerCase().includes(q) && !s.regNo.toLowerCase().includes(q) && !s.rollNo.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleExportPDF = () => {
    addToast('PDF Report Exported', `Generated PDF report with full student roster for ${isHod ? hodDeptName : 'Institution'}`, 'success');
  };

  const handleExportExcel = () => {
    let csvContent = `UNIVERSITY ATTENDANCE & COMPLIANCE REPORT\n`;
    csvContent += `Scope: ${isHod ? hodDeptName : selectedDept === 'all' ? 'All Departments' : selectedDept}\n`;
    csvContent += `Report Date: ${dateRange}\n`;
    csvContent += `Assigned Department HOD: ${isHod ? currentUser.name : 'Dr. Alan Turing'} (HOD Phone: ${hodPhoneNumber})\n\n`;

    csvContent += `FLAGGED LOW ATTENDANCE STUDENTS (<75%)\n`;
    csvContent += `Reg No,Student Phone,Student Name,Department,Semester,Attendance %,Status,Guardian Phone\n`;
    lowAttendanceList.forEach((s) => {
      csvContent += `${s.regNo},${s.phone || '+91 98765 43210'},"${s.name}",${s.departmentName || hodDeptName},Sem ${s.semester},${s.overallAttendancePct}%,Ineligible,${s.guardianPhone}\n`;
    });

    csvContent += `\nALL ENROLLED STUDENTS ATTENDANCE ROSTER\n`;
    csvContent += `Reg No,Student Phone,Student Name,Department,Semester,Attendance %,Eligibility Status\n`;
    filteredStudents.forEach((s) => {
      csvContent += `${s.regNo},${s.phone || '+91 98765 43210'},"${s.name}",${s.departmentName || hodDeptName},Sem ${s.semester},${s.overallAttendancePct}%,${s.overallAttendancePct >= 75 ? 'Eligible' : 'Ineligible'}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${isHod ? 'HOD' : 'Admin'}_Full_Student_Attendance_Report_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('Excel / CSV Exported', `Downloaded full student roster attendance report CSV`, 'success');
  };

  // Filter students based on HOD role or selected department
  const filteredStudents = students.filter((s) => {
    if (isHod) {
      return (
        s.departmentName?.toLowerCase().includes('computer') ||
        s.departmentName?.toLowerCase() === hodDeptName.toLowerCase() ||
        s.departmentId === currentUser.departmentId ||
        !s.departmentName
      );
    }

    if (selectedDept === 'all') return true;
    return s.departmentId === selectedDept || s.departmentName?.toLowerCase().includes(selectedDept.toLowerCase());
  });

  const lowAttendanceList = filteredStudents.filter((s) => s.overallAttendancePct < 75);

  // Export ONLY the low attendance students (those below the 75% threshold)
  const handleExportLowAttendance = () => {
    if (lowAttendanceList.length === 0) {
      addToast('No Low Attendance Students', 'There are no students below the 75% attendance threshold to export.', 'warning');
      return;
    }

    let csvContent = `LOW ATTENDANCE STUDENTS EXPORT\n`;
    csvContent += `Scope: ${isHod ? hodDeptName : selectedDept === 'all' ? 'All Departments' : selectedDept}\n`;
    csvContent += `Report Date: ${dateRange}\n`;
    csvContent += `Threshold: Below 75% attendance\n\n`;

    csvContent += `Student Name,Register/Roll Number,Class,Semester,Attendance Percentage,Status\n`;
    lowAttendanceList.forEach((s) => {
      csvContent += `"${s.name}",${s.regNo} / ${s.rollNo},${s.departmentName || hodDeptName} (${academicYearLabel(s.semester)}),Sem ${s.semester},${s.overallAttendancePct}%,Ineligible\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Low_Attendance_Students_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('Low Attendance Students Exported', `Exported ${lowAttendanceList.length} low attendance student(s) below 75%`, 'success');
  };

  // Export ONLY the low attendance students as a formatted PDF report
  const handleExportLowAttendancePDF = () => {
    if (lowAttendanceList.length === 0) {
      addToast('No Low Attendance Students', 'There are no students below the 75% attendance threshold to export.', 'warning');
      return;
    }

    const generatedAt = new Date().toLocaleString();
    const scope = isHod ? hodDeptName : selectedDept === 'all' ? 'All Departments' : selectedDept;

    const rows = lowAttendanceList
      .map(
        (s) => `
          <tr>
            <td>${s.name}</td>
            <td>${s.regNo} / ${s.rollNo}</td>
            <td>${s.departmentName || hodDeptName} (${academicYearLabel(s.semester)})</td>
            <td>Sem ${s.semester}</td>
            <td>${s.overallAttendancePct}%</td>
            <td>Ineligible (&lt;75%)</td>
          </tr>`
      )
      .join('');

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Low Attendance Student Report</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #111827; margin: 32px; }
  h1 { font-size: 20px; margin: 0 0 4px 0; color: #1E40AF; }
  .meta { font-size: 12px; color: #64748B; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #CBD5E1; padding: 8px 10px; text-align: left; }
  th { background: #DBEAFE; color: #1E40AF; font-weight: 700; }
  tr:nth-child(even) { background: #F8FAFC; }
  .footer { margin-top: 20px; font-size: 11px; color: #64748B; }
  @media print { body { margin: 16px; } }
</style>
</head>
<body>
<h1>LOW ATTENDANCE STUDENT REPORT</h1>
<div class="meta">Scope: ${scope} &bull; Report Date: ${dateRange} &bull; Threshold: Below 75% attendance &bull; Generated: ${generatedAt}</div>
<table>
  <thead>
    <tr>
      <th>Student Name</th>
      <th>Register / Roll Number</th>
      <th>Class</th>
      <th>Semester</th>
      <th>Attendance %</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">Total low-attendance students: ${lowAttendanceList.length} &bull; Only students below the 75% attendance threshold are included.</div>
</body>
</html>`;

    const w = window.open('', '_blank');
    if (!w) {
      addToast('Popup Blocked', 'Please allow popups to download the PDF report.', 'warning');
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
    addToast('Low Attendance PDF', `Prepared PDF with ${lowAttendanceList.length} low attendance student(s). Save as PDF from the print dialog.`, 'success');
  };

  return (
    <div className="space-y-6 text-xs">
      <BackButton />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Reports & Analytics Hub
            </h2>
            {isHod && (
              <span className="px-2.5 py-0.5 bg-[#1E40AF] text-white dark:bg-[#2563EB] dark:text-[#FFFFFF] text-[10px] font-bold rounded-full uppercase tracking-wider">
                HOD Portal Scoped
              </span>
            )}
          </div>

        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Excel / CSV
          </button>
        </div>
      </div>

      {/* Assigned HOD Info Banner */}
      <div className="p-4 bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#1E40AF] text-white rounded-xl font-bold">
            <ShieldCheck className="w-5 h-5 text-[#1E40AF]" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Assigned Department HOD Contact
            </span>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {isHod ? currentUser.name : 'Dr. Alan Turing'} ({hodDeptName})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-[#1E40AF] dark:text-[#3B82F6] bg-white dark:bg-[#0A0A0A] px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <Phone className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" />
          <span className="font-bold">HOD Phone: {hodPhoneNumber}</span>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            Report Category
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-[#1E40AF] dark:text-[#3B82F6]"
          >
            <option value="low_att">Low Attendance Flagged List (&lt;75%)</option>
            <option value="daily">Daily Attendance Roster</option>
            <option value="weekly">Weekly Aggregated Summary</option>
            <option value="subject">Subject-Wise Performance</option>
            {!isHod && <option value="faculty">Faculty Compliance Rate</option>}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            Department Scope
          </label>
          {isHod ? (
            <div className="p-2.5 bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-[#1E40AF] dark:text-[#3B82F6] flex items-center justify-between">
              <span>{hodDeptName}</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
          ) : (
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium"
            >
              {permittedDepts.length > 0 ? (
                permittedDepts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))
              ) : (
                <option value="all">All Departments</option>
              )}
            </select>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            Report Target Date
          </label>
          <input
            type="date"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium"
          />
        </div>
      </div>

      {/* Student Class Search (single selected department: Computer Science) */}
      <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Search className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" /> Student Class Search
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Search students class-wise within the selected department (Computer Science only)
              </p>
            </div>
            <span className="px-2.5 py-1 bg-[#FFFFFF] dark:bg-[#0A0A0A] text-[#1E40AF] dark:text-[#3B82F6] text-[10px] font-bold rounded-full border border-zinc-200 dark:border-zinc-800">
              {classSearchResults.length} Result(s)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Search Name / Reg No
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                  <input
                    type="text"
                    value={classQuery}
                    onChange={(e) => setClassQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setClassQuery((e.target as HTMLInputElement).value);
                    }}
                    placeholder="Search student..."
                    className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium"
                  />
                </div>
                <button
                  onClick={() => setClassQuery(classQuery)}
                  className="px-3 py-2 text-xs font-bold text-white bg-[#1E40AF] dark:bg-[#2563EB] hover:bg-[#161B33] dark:hover:bg-[#2563EB] rounded-xl transition-colors shrink-0"
                >
                  Enter
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Department
              </label>
              <div className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-[#1E40AF] dark:text-[#3B82F6]">
                {permittedDepts[0]?.name || 'Computer Science'}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
                <GraduationCap className="w-3 h-3" /> Year / Class
              </label>
              <select
                value={classYear}
                onChange={(e) => setClassYear(e.target.value)}
                className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-[#1E40AF] dark:text-[#3B82F6]"
              >
                <option value="All">All Years</option>
                {classYearSemesters.map((c) => (
                  <option key={c.label} value={c.label}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-2xl max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-500 font-semibold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800 text-[10px] sticky top-0 z-10">
                <tr>
                  <th className="p-3">S.No</th>
                  <th className="p-3">Reg No</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Semester</th>
                  <th className="p-3">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 font-semibold">
                {classSearchResults.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-zinc-400">
                      No students found for the selected class filters.
                    </td>
                  </tr>
                ) : (
                  classSearchResults.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="p-3 text-zinc-400 font-mono">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-[#1E40AF] dark:text-[#3B82F6]">{s.regNo}</td>
                      <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">{s.name}</td>
                      <td className="p-3 text-zinc-600 dark:text-zinc-300">{s.departmentName || hodDeptName}</td>
                      <td className="p-3 text-zinc-700 dark:text-zinc-300">Sem {s.semester}</td>
                      <td className="p-3 font-extrabold">
                        <span className={s.overallAttendancePct >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {s.overallAttendancePct}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* Preview Sheet */}
      <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Report Analysis: {reportType === 'low_att' ? 'Flagged Low Attendance Roster (<75%)' : 'Departmental Roster'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Target Date: {dateRange} · Department HOD Phone: {hodPhoneNumber}
            </p>
          </div>
          <span className="px-3 py-1 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 text-xs font-bold rounded-full flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            {reportType === 'low_att' ? `${lowAttendanceList.length} Flagged (<75%)` : 'Compliance Audit Active'}
          </span>
        </div>

        {/* Flagged Students (<75%) Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Flagged Students Below 75% Attendance Threshold
            </h4>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleExportLowAttendance}
                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" /> Export Low Attendance Students
              </button>
              <button
                onClick={handleExportLowAttendancePDF}
                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <FileText className="w-3.5 h-3.5" /> Export Low Attendance PDF
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-500 font-semibold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800 text-[10px]">
                <tr>
                  <th className="p-3">Reg No & Phone</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Semester</th>
                  <th className="p-3">Attendance %</th>
                  <th className="p-3">Exam Status</th>
                  <th className="p-3">Guardian Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 font-semibold">
                {lowAttendanceList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-zinc-400">
                      No students are currently flagged below 75% attendance for this scope.
                    </td>
                  </tr>
                ) : (
                  lowAttendanceList.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="p-3">
                        <span className="font-mono font-bold text-[#1E40AF] dark:text-[#3B82F6] block">{s.regNo}</span>
                        <span className="text-[10px] text-zinc-500 font-mono block">Ph: {s.phone || '+91 98765 43210'}</span>
                      </td>
                      <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">{s.name}</td>
                      <td className="p-3 text-zinc-600 dark:text-zinc-300">{s.departmentName || hodDeptName}</td>
                      <td className="p-3 text-zinc-700 dark:text-zinc-300">Sem {s.semester}</td>
                      <td className="p-3 font-extrabold text-rose-600 dark:text-rose-400">{s.overallAttendancePct}%</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 font-bold rounded-md text-[10px]">
                          Ineligible (&lt;75%)
                        </span>
                      </td>
                      <td className="p-3 text-zinc-600 dark:text-zinc-400 font-mono">
                        {s.guardianName} ({s.guardianPhone})
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ALL STUDENTS ATTENDANCE LIST (Full Roster) AT END */}
        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" />
                All Enrolled Students Roster ({filteredStudents.length} Total Students)
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Complete student list with overall attendance percentage for university audit & export
              </p>
            </div>

            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm shrink-0"
            >
              <Download className="w-3.5 h-3.5" /> Export All Students CSV
            </button>
          </div>

          <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-2xl max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-500 font-semibold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800 text-[10px] sticky top-0 z-10">
                <tr>
                  <th className="p-3">S.No</th>
                  <th className="p-3">Reg No & Student Phone</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Semester</th>
                  <th className="p-3">Overall Attendance %</th>
                  <th className="p-3">Exam Eligibility Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 font-semibold">
                {filteredStudents.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <td className="p-3 text-zinc-400 font-mono">{idx + 1}</td>
                    <td className="p-3">
                      <span className="font-mono font-bold text-[#1E40AF] dark:text-[#3B82F6] block">{s.regNo}</span>
                      <span className="text-[10px] text-zinc-500 font-mono block">Ph: {s.phone || '+91 98765 43210'}</span>
                    </td>
                    <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">{s.name}</td>
                    <td className="p-3 text-zinc-600 dark:text-zinc-300">{s.departmentName || hodDeptName}</td>
                    <td className="p-3 text-zinc-700 dark:text-zinc-300">Sem {s.semester}</td>
                    <td className="p-3 font-extrabold">
                      <span className={s.overallAttendancePct >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                        {s.overallAttendancePct}%
                      </span>
                    </td>
                    <td className="p-3">
                      {s.overallAttendancePct >= 75 ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-bold rounded-md text-[10px]">
                          Eligible (≥ 75%)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 font-bold rounded-md text-[10px]">
                          Ineligible (&lt; 75%)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
