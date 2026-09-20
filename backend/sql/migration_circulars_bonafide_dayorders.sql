-- Migration: Add circulars, bonafide_requests, staff_day_orders tables
-- Run once in Supabase SQL Editor

-- 1. Circulars
CREATE TABLE IF NOT EXISTS circulars (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','signed','published','archived')),
    target_role VARCHAR(20) CHECK (target_role IN ('admin','hod','faculty','student')),
    department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
    target_semester INTEGER,
    target_section VARCHAR(20),
    author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    signer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    signer_name VARCHAR(255),
    publisher_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    publisher_name VARCHAR(255),
    published_at TIMESTAMP,
    recipient_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_circulars_status ON circulars(status);
CREATE INDEX IF NOT EXISTS idx_circulars_dept ON circulars(department_id);

-- 2. Bonafide Requests
CREATE TABLE IF NOT EXISTS bonafide_requests (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose VARCHAR(255) NOT NULL,
    address_to VARCHAR(255),
    stage VARCHAR(30) NOT NULL DEFAULT 'pending_faculty'
        CHECK (stage IN ('pending_faculty','pending_hod','pending_principal','approved','rejected')),
    faculty_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    faculty_comment TEXT,
    faculty_reviewed_at TIMESTAMP,
    hod_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    hod_comment TEXT,
    hod_reviewed_at TIMESTAMP,
    principal_comment TEXT,
    principal_reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bonafide_student ON bonafide_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_bonafide_stage ON bonafide_requests(stage);

-- 3. Staff Day Orders
CREATE TABLE IF NOT EXISTS staff_day_orders (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    date DATE NOT NULL UNIQUE,
    day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 6),
    label VARCHAR(100),
    notes TEXT,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_day_orders_date ON staff_day_orders(date);

-- Enable Row Level Security (optional but recommended for Supabase)
-- ALTER TABLE circulars ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE bonafide_requests ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE staff_day_orders ENABLE ROW LEVEL SECURITY;
