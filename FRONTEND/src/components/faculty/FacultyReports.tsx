import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Download } from 'lucide-react';

export const FacultyReports: React.FC = () => {
  const { students, attendanceRecords, currentUser, addToast } = useApp();
  const [selectedRange, setSelectedRange] = useState('monthly');

  const myRecords = attendanceRecords.filter((r) => r.facultyId === currentUser.id);
  const enrolledStudents = students.filter((st) =>
    myRecords.some((r) => r.entries.some((e) => e.studentId === st.id))
  );

  const isPresent = (status: string) => status === 'present' || status === 'late' || status === 'od';

  const getStats = (stId: string) => {
    const recs = myRecords.filter((r) => r.entries.some((e) => e.studentId === stId));
    const attended = recs.filter((r) => {
      const e = r.entries.find((x) => x.studentId === stId);
      return e ? isPresent(e.status) : false;
    }).length;
    const total = recs.length;
    return { attended, total, pct: total > 0 ? Math.round((attended / total) * 100) : 0 };
  };

  const handleExport = () => {
    if (enrolledStudents.length === 0) {
      addToast('Nothing to Export', 'No attendance records found yet', 'warning');
      return;
    }

    const headers = ['Reg No', 'Student Name', 'Attended / Total', 'Attendance %', 'Status'];
    const rows = enrolledStudents.map((st) => {
      const { attended, total, pct } = getStats(st.id);
      return [
        st.regNo,
        `"${st.name}"`,
        `${attended} / ${total}`,
        `${pct}%`,
        pct >= 75 ? 'Eligible' : 'Warning (<75%)'
      ];
    });

    const csvString = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Faculty_Attendance_Report_${selectedRange.toUpperCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('Report Exported', `Downloaded CSV attendance report (${selectedRange})`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Course Attendance Performance Reports
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Generate student participation analytics and identify low attendance students
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white dark:bg-[#161B33] p-1 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold">
            {(['weekly', 'monthly', 'overall'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRange(r)}
                className={`px-2.5 py-1 rounded-lg transition-all capitalize ${
                  selectedRange === r ? 'bg-[#313866] text-white' : 'text-zinc-600 dark:text-zinc-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:text-[#0D1127] dark:hover:bg-white text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Course Report
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#21284C] border border-zinc-200/80 dark:border-[#2D376A] rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3">Enrolled Student Attendance Breakdown</h3>
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-[#161B33]/80 border-b border-zinc-200 dark:border-[#2D376A] text-zinc-500 font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-3">Reg No</th>
              <th className="p-3">Student Name</th>
              <th className="p-3">Attended / Total</th>
              <th className="p-3">Attendance %</th>
              <th className="p-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {enrolledStudents.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-zinc-400 text-xs">
                  No attendance records have been marked yet for your courses.
                </td>
              </tr>
            ) : (
              enrolledStudents.map((s) => {
                const { attended, total, pct } = getStats(s.id);
                return (
                  <tr key={s.id}>
                    <td className="p-3">
                      <span className="font-mono font-bold text-[#313866] dark:text-[#8A92D0] block">{s.regNo}</span>
                      <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 block font-semibold">📱 {s.phone || s.guardianPhone || '—'}</span>
                    </td>
                    <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">{s.name}</td>
                    <td className="p-3 font-mono">{attended} / {total}</td>
                    <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">{pct}%</td>
                    <td className="p-3 text-right">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                          total === 0
                            ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                            : pct >= 75
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                        }`}
                      >
                        {total === 0 ? 'No Data' : pct >= 75 ? 'Eligible' : 'Warning (<75%)'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};