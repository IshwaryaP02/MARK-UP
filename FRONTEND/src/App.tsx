import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { BottomNav } from './components/common/BottomNav';
import { CommandPalette } from './components/common/CommandPalette';
import { ToastContainer } from './components/common/ToastContainer';
import { LoginPage } from './components/auth/LoginPage';

// Admin Components
import { AdminDashboard } from './components/admin/AdminDashboard';
import { StudentManagement } from './components/admin/StudentManagement';
import { FacultyManagement } from './components/admin/FacultyManagement';
import { DepartmentManagement } from './components/admin/DepartmentManagement';
import { SubjectManagement } from './components/admin/SubjectManagement';
import { TimetableBuilder } from './components/admin/TimetableBuilder';
import { AcademicCalendar } from './components/admin/AcademicCalendar';
import { MonthlyStaffOrder } from './components/admin/MonthlyStaffOrder';
import { UserAccounts } from './components/admin/UserAccounts';
import { ReportsHub } from './components/admin/ReportsHub';
import { DBBackup } from './components/admin/DBBackup';
import { AuditLogs } from './components/admin/AuditLogs';

// Faculty Components
import { FacultyDashboard } from './components/faculty/FacultyDashboard';
import { MyClasses } from './components/faculty/MyClasses';
import { FacultyTimetable } from './components/faculty/FacultyTimetable';
import { MarkAttendance } from './components/faculty/MarkAttendance';
import { FacultyBonafide } from './components/faculty/FacultyBonafide';
import { AttendanceHistory } from './components/faculty/AttendanceHistory';
import { FacultyReports } from './components/faculty/FacultyReports';
import { StudentSearch } from './components/faculty/StudentSearch';
import { LeaveQueue } from './components/faculty/LeaveQueue';
import { SubstitutionManager } from './components/faculty/SubstitutionManager';
import { TutorCircular } from './components/faculty/TutorCircular';
import { TutorClassStudents } from './components/faculty/TutorClassStudents';

// Student Components
import { StudentDashboard } from './components/student/StudentDashboard';
import { StudentAttendance } from './components/student/StudentAttendance';
import { StudentTimetable } from './components/student/StudentTimetable';
import { ApplyLeave } from './components/student/ApplyLeave';
import { StudentReports } from './components/student/StudentReports';
import { StudentNotifications } from './components/student/StudentNotifications';
import { StudentCirculars } from './components/student/StudentCirculars';
import { StudentProfile } from './components/student/StudentProfile';
import { StudentBonafide } from './components/student/StudentBonafide';

// HOD Components
import { HODDashboard } from './components/hod/HODDashboard';
import { AllClassesView } from './components/hod/AllClassesView';
import { FacultyMonitoring } from './components/hod/FacultyMonitoring';
import { ApproveCorrections } from './components/hod/ApproveCorrections';
import { ApproveLeaves } from './components/hod/ApproveLeaves';
import { ApproveSubstitutions } from './components/hod/ApproveSubstitutions';
import { HODCirculars } from './components/hod/HODCirculars';
import { StudentDetails } from './components/hod/StudentDetails';
import { HODBonafide } from './components/hod/HODBonafide';

// Shared Components
import { NotificationCenter } from './components/common/NotificationCenter';
import { SettingsPage } from './components/common/SettingsPage';
import { ForbiddenPage } from './components/common/ForbiddenPage';
import { NotFoundPage } from './components/common/NotFoundPage';

const AppContent: React.FC = () => {
  const { isAuthenticated, currentUser, activeScreen } = useApp();

  if (!isAuthenticated || activeScreen === 'login') {
    return <LoginPage />;
  }

  const renderScreen = () => {
    const role = currentUser.role;

    // Shared screens accessible across roles
    if (activeScreen === 'notifications') return <NotificationCenter />;
    if (activeScreen === 'settings') return <SettingsPage />;

    // Role-based routing logic
    if (role === 'admin') {
      switch (activeScreen) {
        case 'dashboard': return <AdminDashboard />;
        case 'students': return <StudentManagement />;
        case 'faculty': return <FacultyManagement />;
        case 'departments': return <DepartmentManagement />;
        case 'subjects': return <SubjectManagement />;
        case 'timetable_builder': return <TimetableBuilder />;
        case 'academic_calendar': return <AcademicCalendar />;
        case 'monthly_staff_order': return <MonthlyStaffOrder />;
        case 'user_accounts': return <UserAccounts />;
        case 'reports_hub':
        case 'reports': return <ReportsHub />;
        case 'db_backup': return <DBBackup />;
        case 'audit_logs': return <AuditLogs />;
        default: return <AdminDashboard />;
      }
    }

    if (role === 'faculty') {
      switch (activeScreen) {
        case 'dashboard': return <FacultyDashboard />;
        case 'my_classes': return <MyClasses />;
        case 'faculty_timetable': return <FacultyTimetable />;
        case 'mark_attendance': return <MarkAttendance />;
        case 'faculty_bonafide': return <FacultyBonafide />;
        case 'attendance_history': return <AttendanceHistory />;
        case 'faculty_reports': return <FacultyReports />;
        case 'student_search': return <StudentSearch />;
        case 'leave_queue': return <LeaveQueue />;
        case 'substitution': return <SubstitutionManager />;
        case 'tutor_circular': return <TutorCircular />;
        case 'tutor_class_students': return <TutorClassStudents />;
        default: return <FacultyDashboard />;
      }
    }

    if (role === 'student') {
      switch (activeScreen) {
        case 'dashboard': return <StudentDashboard />;
        case 'student_attendance': return <StudentAttendance />;
        case 'student_timetable': return <StudentTimetable />;
        case 'student_apply_leave': return <ApplyLeave />;
        case 'student_reports': return <StudentReports />;
        case 'student_notifications': return <StudentNotifications />;
        case 'student_circulars': return <StudentCirculars />;
        case 'student_profile': return <StudentProfile />;
        case 'student_bonafide': return <StudentBonafide />;
        default: return <StudentDashboard />;
      }
    }

    if (role === 'hod') {
      switch (activeScreen) {
        case 'dashboard': return <HODDashboard />;
        case 'hod_all_classes': return <AllClassesView />;
        case 'student_details': return <StudentDetails />;
        case 'hod_circulars': return <HODCirculars />;
        case 'faculty_monitoring': return <FacultyMonitoring />;
        case 'hod_corrections': return <ApproveCorrections />;
        case 'hod_leaves': return <ApproveLeaves />;
        case 'hod_substitutions': return <ApproveSubstitutions />;
        case 'hod_bonafide': return <HODBonafide />;
        case 'hod_reports':
        case 'reports_hub':
        case 'reports': return <ReportsHub />;
        default: return <HODDashboard />;
      }
    }

    return <NotFoundPage />;
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#F1F5F9] dark:bg-[#000000] text-zinc-900 dark:text-zinc-100 font-sans antialiased selection:bg-[#1E40AF] selection:text-white transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar (Desktop) */}
        <Sidebar />

        {/* Main Content View Container */}
        <main className="flex-1 h-full overflow-y-auto p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full transition-all pb-24 md:pb-8">
          {renderScreen()}
        </main>
      </div>

      {/* Bottom Mobile Navigation */}
      <BottomNav />

      {/* Cmd+K Command Palette */}
      <CommandPalette />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
