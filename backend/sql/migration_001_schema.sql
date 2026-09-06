-- ============================================================
-- Smart Attendance Management System - Database Schema
-- Supabase Postgres Migration
-- ============================================================

-- ── Enums ──────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('admin', 'hod', 'faculty', 'student');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'od', 'leave');
CREATE TYPE leave_type AS ENUM ('medical', 'casual', 'duty_leave', 'on_duty');
CREATE TYPE leave_status AS ENUM ('pending_faculty', 'pending_hod', 'approved', 'rejected');
CREATE TYPE correction_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE substitution_status AS ENUM ('pending', 'accepted', 'rejected_by_sub', 'approved_by_hod');
CREATE TYPE calendar_event_type AS ENUM ('holiday', 'exam', 'working', 'event');
CREATE TYPE backup_type AS ENUM ('manual', 'automated');
CREATE TYPE backup_status AS ENUM ('success', 'failed');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'success', 'danger');
CREATE TYPE day_of_week AS ENUM ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday');

-- ── Departments ────────────────────────────────────────────
CREATE TABLE departments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(20)  NOT NULL UNIQUE,
    name            VARCHAR(255) NOT NULL,
    hod_user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ── Academic Sessions ──────────────────────────────────────
CREATE TABLE academic_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    is_current      BOOLEAN DEFAULT false,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ── Users (unified base table for admin, hod, faculty, student)
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid    VARCHAR(255) UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    name            VARCHAR(255) NOT NULL,
    avatar          TEXT,
    role            user_role NOT NULL,
    department_id   UUID REFERENCES departments(id) ON DELETE SET NULL,

    -- Student-specific (nullable)
    reg_no          VARCHAR(50),
    roll_no         VARCHAR(50),

    -- Faculty / HOD-specific (nullable)
    employee_id     VARCHAR(50),

    -- Academic (student)
    semester        INTEGER,
    section         VARCHAR(20),
    batch           VARCHAR(50),

    -- Contact / personal
    phone           VARCHAR(30),
    address         TEXT,
    gender          VARCHAR(20),
    dob             DATE,
    father_name     VARCHAR(255),
    mother_name     VARCHAR(255),
    guardian_name   VARCHAR(255),
    parent_phone    VARCHAR(30),

    -- Status
    is_hod          BOOLEAN DEFAULT false,
    is_active       BOOLEAN DEFAULT true,
    last_login      TIMESTAMP,

    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ── Subjects ───────────────────────────────────────────────
CREATE TABLE subjects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(30) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    department_id   UUID REFERENCES departments(id) ON DELETE CASCADE,
    semester        INTEGER NOT NULL,
    credits         INTEGER DEFAULT 3,
    min_attendance_pct INTEGER DEFAULT 75,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ── Faculty-Subject assignment (many-to-many) ──────────────
CREATE TABLE faculty_subjects (
    faculty_id  UUID REFERENCES users(id) ON DELETE CASCADE,
    subject_id  UUID REFERENCES subjects(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (faculty_id, subject_id)
);

-- ── Academic Calendar ──────────────────────────────────────
CREATE TABLE calendar_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID REFERENCES academic_sessions(id) ON DELETE SET NULL,
    date        DATE NOT NULL,
    type        calendar_event_type NOT NULL,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ── Timetable Slots ────────────────────────────────────────
CREATE TABLE timetable (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day         day_of_week NOT NULL,
    period_number INTEGER NOT NULL CHECK (period_number >= 1 AND period_number <= 8),
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    subject_id  UUID REFERENCES subjects(id) ON DELETE CASCADE,
    faculty_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    room_no     VARCHAR(50),
    department_id UUID REFERENCES departments(id),
    semester    INTEGER NOT NULL,
    section     VARCHAR(20) NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW(),
    UNIQUE(day, period_number, semester, section, department_id)
);

-- ── Substitutions ──────────────────────────────────────────
CREATE TABLE substitutions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_faculty_id UUID REFERENCES users(id) ON DELETE CASCADE,
    substitute_faculty_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subject_id      UUID REFERENCES subjects(id) ON DELETE CASCADE,
    date            DATE NOT NULL,
    period_number   INTEGER NOT NULL CHECK (period_number >= 1 AND period_number <= 8),
    reason          TEXT,
    status          substitution_status DEFAULT 'pending',
    created_at      TIMESTAMP DEFAULT NOW(),
    responded_at    TIMESTAMP,
    UNIQUE(date, period_number, subject_id)
);

-- ── Attendance Sessions (one per date/period/subject) ──────
CREATE TABLE attendance_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id      UUID REFERENCES subjects(id) ON DELETE CASCADE,
    faculty_id      UUID REFERENCES users(id) ON DELETE SET NULL,
    date            DATE NOT NULL,
    period_number   INTEGER NOT NULL,
    room_no         VARCHAR(50),
    department_id   UUID REFERENCES departments(id),
    semester        INTEGER,
    section         VARCHAR(20),
    is_substitution BOOLEAN DEFAULT false,
    marked_at       TIMESTAMP DEFAULT NOW(),
    marked_by       UUID REFERENCES users(id),
    UNIQUE(date, period_number, subject_id, section)
);

-- ── Attendance Entries (one per student per session) ───────
CREATE TABLE attendance_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id      UUID REFERENCES users(id) ON DELETE CASCADE,
    status          attendance_status NOT NULL,
    remarks         TEXT,
    marked_at       TIMESTAMP DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

-- ── Attendance Corrections ─────────────────────────────────
CREATE TABLE corrections (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id          UUID REFERENCES users(id) ON DELETE CASCADE,
    subject_id          UUID REFERENCES subjects(id),
    date                DATE NOT NULL,
    period_number       INTEGER NOT NULL,
    original_status     attendance_status NOT NULL,
    proposed_status     attendance_status NOT NULL,
    reason              TEXT NOT NULL,
    status              correction_status DEFAULT 'pending',
    created_at          TIMESTAMP DEFAULT NOW(),
    reviewed_by         UUID REFERENCES users(id),
    review_comment      TEXT,
    reviewed_at         TIMESTAMP
);

-- ── Leave Requests ─────────────────────────────────────────
CREATE TABLE leave_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID REFERENCES users(id) ON DELETE CASCADE,
    department_id   UUID REFERENCES departments(id),
    semester        INTEGER,
    section         VARCHAR(20),
    leave_type      leave_type NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    total_days      INTEGER NOT NULL,
    reason          TEXT NOT NULL,
    attachment_url  TEXT,
    status          leave_status DEFAULT 'pending_faculty',
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ── Leave Approvals ────────────────────────────────────────
CREATE TABLE leave_approvals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leave_request_id UUID REFERENCES leave_requests(id) ON DELETE CASCADE,
    approver_id     UUID REFERENCES users(id),
    approver_role   user_role NOT NULL,
    status          VARCHAR(20) NOT NULL,
    comment         TEXT,
    approved_at     TIMESTAMP DEFAULT NOW()
);

-- ── Notifications ──────────────────────────────────────────
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    message         TEXT NOT NULL,
    type            notification_type NOT NULL,
    link            TEXT,
    target_role     user_role,
    is_read         BOOLEAN DEFAULT false,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ── Audit Logs ─────────────────────────────────────────────
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,
    module          VARCHAR(100) NOT NULL,
    details         TEXT,
    ip_address      VARCHAR(45),
    payload_diff    TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ── Backup Snapshots ───────────────────────────────────────
CREATE TABLE backup_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename        VARCHAR(255) NOT NULL,
    size            VARCHAR(50) NOT NULL,
    type            backup_type NOT NULL,
    status          backup_status NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ── Indexes ────────────────────────────────────────────────
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_reg_no ON users(reg_no);
CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_timetable_day ON timetable(day);
CREATE INDEX idx_timetable_faculty ON timetable(faculty_id);
CREATE INDEX idx_attendance_sessions_date ON attendance_sessions(date);
CREATE INDEX idx_attendance_entries_session ON attendance_entries(session_id);
CREATE INDEX idx_attendance_entries_student ON attendance_entries(student_id);
CREATE INDEX idx_attendance_entries_status ON attendance_entries(status);
CREATE INDEX idx_leave_requests_student ON leave_requests(student_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_corrections_status ON corrections(status);
CREATE INDEX idx_substitutions_status ON substitutions(status);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_target_role ON notifications(target_role);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_calendar_date ON calendar_events(date);
CREATE INDEX idx_subjects_department ON subjects(department_id);
