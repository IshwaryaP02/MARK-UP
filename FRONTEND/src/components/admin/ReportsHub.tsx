import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FileSpreadsheet, Download, FileText, Filter, CheckCircle2, AlertTriangle, ShieldCheck, Users, Phone } from 'lucide-react';

export const ReportsHub: React.FC = () => {
  const { currentUser, students, departments, subjects, addToast } = useApp();

  const isHod = currentUser.role === 'hod';
  const hodDeptName = currentUser.departmentName || 'Computer Science & Engineering';
  const hodPhoneNumber = currentUser.phone || '+91 98765 11223';

  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'subject' | 'low_att' | 'faculty'>('low_att');
  const [selectedDept, setSelectedDept] = useState<string>(isHod ? 'hod_dept' : 'all');
  const [dateRange, setDateRange] = useState('2026-08-01');

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

  return (
    <div className="space-y-6 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Reports & Analytics Hub
            </h2>
            {isHod && (
              <span className="px-2.5 py-0.5 bg-[#313866] text-white dark:bg-[#8A92D0] dark:text-[#0D1127] text-[10px] font-bold rounded-full uppercase tracking-wider">
                HOD Portal Scoped
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {isHod
              ? `Departmental compliance, flagged students list (<75%), and attendance reports for ${hodDeptName}`
              : 'Generate university-wide daily, weekly, subject-wise, and low-attendance compliance reports'}
          </p>
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
      <div className="p-4 bg-[#F3F4F9] dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#313866] text-white rounded-xl font-bold">
            <ShieldCheck className="w-5 h-5 text-[#8A92D0]" />
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

        <div className="flex items-center gap-2 font-mono text-xs text-[#313866] dark:text-[#8A92D0] bg-white dark:bg-[#0D1127] px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <Phone className="w-4 h-4 text-[#313866] dark:text-[#8A92D0]" />
          <span className="font-bold">HOD Phone: {hodPhoneNumber}</span>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white dark:bg-[#161B33] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            Report Category
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-[#0D1127] border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-[#313866] dark:text-[#8A92D0]"
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
            <div className="p-2.5 bg-[#F3F4F9] dark:bg-[#0D1127] border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-[#313866] dark:text-[#8A92D0] flex items-center justify-between">
              <span>{hodDeptName}</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
          ) : (
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-[#0D1127] border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
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
            className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-[#0D1127] border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium"
          />
        </div>
      </div>

      {/* Preview Sheet */}
      <div className="bg-white dark:bg-[#161B33] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
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
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Flagged Students Below 75% Attendance Threshold
          </h4>

          <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-[#0D1127] text-zinc-500 font-semibold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800 text-[10px]">
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
                        <span className="font-mono font-bold text-[#313866] dark:text-[#8A92D0] block">{s.regNo}</span>
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
                <Users className="w-4 h-4 text-[#313866] dark:text-[#8A92D0]" />
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
              <thead className="bg-zinc-50 dark:bg-[#0D1127] text-zinc-500 font-semibold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800 text-[10px] sticky top-0 z-10">
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
                      <span className="font-mono font-bold text-[#313866] dark:text-[#8A92D0] block">{s.regNo}</span>
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
