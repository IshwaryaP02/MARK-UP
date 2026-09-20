-- Add Customization Fields to users
ALTER TABLE users ADD COLUMN theme VARCHAR(50) DEFAULT 'Classic';
ALTER TABLE users ADD COLUMN wallpaper_url TEXT;

-- Add Class Adviser Role fields to users
ALTER TABLE users ADD COLUMN is_class_adviser BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN advising_programme VARCHAR(20);
ALTER TABLE users ADD COLUMN advising_department_id VARCHAR(36) REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN advising_year INTEGER;
ALTER TABLE users ADD COLUMN advising_shift VARCHAR(20);

-- Create OD Requests Table
CREATE TABLE od_requests (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    from_period INTEGER NOT NULL,
    to_period INTEGER NOT NULL,
    reason TEXT NOT NULL,
    proof_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    class_adviser_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    hod_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    adviser_comment TEXT,
    hod_comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
