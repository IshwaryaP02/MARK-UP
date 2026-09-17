-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 002 — Timetable shift column + version tracking table
-- Run this once against your Supabase Postgres database.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add shift + source columns to the timetable table (safe, idempotent)
ALTER TABLE timetable
    ADD COLUMN IF NOT EXISTS shift  VARCHAR(20) DEFAULT 'First Shift',
    ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'manual';

-- 2. Create TimetableVersion tracking table
CREATE TABLE IF NOT EXISTS timetable_versions (
    id             VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::text,
    department_id  VARCHAR(36)  NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    shift          VARCHAR(20),
    source         VARCHAR(20)  NOT NULL DEFAULT 'manual',
    published_by   VARCHAR(36)  REFERENCES users(id) ON DELETE SET NULL,
    published_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    notes          TEXT
);

CREATE INDEX IF NOT EXISTS idx_tt_versions_dept ON timetable_versions(department_id);
CREATE INDEX IF NOT EXISTS idx_timetable_shift  ON timetable(department_id, shift);
CREATE INDEX IF NOT EXISTS idx_timetable_faculty ON timetable(faculty_id);
