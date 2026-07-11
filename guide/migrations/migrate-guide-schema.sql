-- 1. Alter users table to add new profile fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Alter assignments table to allow nullable trip_id and add main backend details
ALTER TABLE assignments ALTER COLUMN trip_id DROP NOT NULL;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'assigned' NOT NULL;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS main_backend_trip_id TEXT;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS main_backend_trip_name TEXT;

-- 3. Alter guide_work_days table to allow nullable trip_id
ALTER TABLE guide_work_days ALTER COLUMN trip_id DROP NOT NULL;

-- 4. Alter guide_day_reports table to allow nullable trip_id
ALTER TABLE guide_day_reports ALTER COLUMN trip_id DROP NOT NULL;

-- 5. Create guide expenses table
CREATE TABLE IF NOT EXISTS guide_expenses (
  id SERIAL PRIMARY KEY,
  guide_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  receipt_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  admin_remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. Create traveler attendance table
CREATE TABLE IF NOT EXISTS traveler_attendance (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  booking_id TEXT NOT NULL,
  traveler_name TEXT NOT NULL,
  traveler_phone TEXT,
  status TEXT NOT NULL,
  notes TEXT,
  marked_by_guide_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT unique_traveler_assignment UNIQUE (assignment_id, booking_id, traveler_name)
);

-- 7. Create trip status updates table
CREATE TABLE IF NOT EXISTS trip_status_updates (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  guide_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  location TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
