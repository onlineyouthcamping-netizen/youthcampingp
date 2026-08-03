-- Migration 010: YouthCamping Departure Workspace Complete Schema

-- Core Departure Entity
CREATE TABLE IF NOT EXISTS departures (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL,
  departure_date DATE NOT NULL,
  status TEXT CHECK(status IN ('draft', 'confirmed', 'in_progress', 'completed', 'cancelled')) DEFAULT 'draft',
  readiness_score INTEGER DEFAULT 0 CHECK(readiness_score BETWEEN 0 AND 100),
  participant_count INTEGER DEFAULT 0,
  paid_count INTEGER DEFAULT 0,
  outstanding_balance DECIMAL(12, 2) DEFAULT 0.00,
  vendor_payables DECIMAL(12, 2) DEFAULT 0.00,
  estimated_profit DECIMAL(12, 2) DEFAULT 0.00,
  created_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Passengers/Bookings
CREATE TABLE IF NOT EXISTS departure_bookings (
  id TEXT PRIMARY KEY,
  departure_id TEXT REFERENCES departures(id) ON DELETE CASCADE,
  customer_id TEXT,
  booking_group_id TEXT,
  status TEXT CHECK(status IN ('confirmed', 'pending', 'cancelled', 'completed')) DEFAULT 'confirmed',
  amount_total DECIMAL(12, 2) DEFAULT 0.00,
  amount_paid DECIMAL(12, 2) DEFAULT 0.00,
  payment_status TEXT CHECK(payment_status IN ('paid_full', 'partial_payment', 'pending_due', 'pending_verification')) DEFAULT 'pending_due',
  couple_status TEXT,
  room_allocated_id TEXT,
  vehicle_allocated_id TEXT,
  train_ticket_status TEXT,
  pickup_point TEXT,
  joining_city TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Itinerary Days
CREATE TABLE IF NOT EXISTS departure_itinerary (
  id TEXT PRIMARY KEY,
  departure_id TEXT REFERENCES departures(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date DATE,
  plan TEXT,
  destination TEXT,
  overnight_stay TEXT,
  travel_distance_km INTEGER DEFAULT 0,
  activities JSONB DEFAULT '[]'::jsonb,
  meals JSONB DEFAULT '[]'::jsonb,
  status TEXT CHECK(status IN ('pending', 'confirmed', 'completed')) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Activities
CREATE TABLE IF NOT EXISTS departure_activities (
  id TEXT PRIMARY KEY,
  departure_id TEXT REFERENCES departures(id) ON DELETE CASCADE,
  itinerary_id TEXT REFERENCES departure_itinerary(id) ON DELETE SET NULL,
  activity_name TEXT NOT NULL,
  activity_type TEXT CHECK(activity_type IN ('travel', 'sightseeing', 'adventure', 'cultural', 'meal', 'other')) DEFAULT 'sightseeing',
  included BOOLEAN DEFAULT true,
  time_start TEXT,
  location TEXT,
  status TEXT CHECK(status IN ('confirmed', 'pending', 'completed')) DEFAULT 'pending',
  cost_per_person DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Hotels
CREATE TABLE IF NOT EXISTS departure_hotels (
  id TEXT PRIMARY KEY,
  departure_id TEXT REFERENCES departures(id) ON DELETE CASCADE,
  destination TEXT,
  hotel_name TEXT NOT NULL,
  vendor_id TEXT,
  check_in_date DATE,
  check_out_date DATE,
  nights_count INTEGER DEFAULT 1,
  total_rooms INTEGER DEFAULT 1,
  room_type TEXT,
  cost_per_night DECIMAL(10, 2) DEFAULT 0.00,
  total_cost DECIMAL(12, 2) DEFAULT 0.00,
  status TEXT CHECK(status IN ('pending', 'confirmed', 'completed')) DEFAULT 'pending',
  payment_status TEXT CHECK(payment_status IN ('unpaid', 'advance_paid', 'paid', 'settlement_pending')) DEFAULT 'unpaid',
  payment_advance DECIMAL(12, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Room Allocation
CREATE TABLE IF NOT EXISTS departure_room_allocation (
  id TEXT PRIMARY KEY,
  departure_id TEXT REFERENCES departures(id) ON DELETE CASCADE,
  hotel_id TEXT REFERENCES departure_hotels(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  room_type TEXT,
  capacity INTEGER DEFAULT 2,
  assigned_passengers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vehicle/Tempo Allocation
CREATE TABLE IF NOT EXISTS departure_vehicle_allocation (
  id TEXT PRIMARY KEY,
  departure_id TEXT REFERENCES departures(id) ON DELETE CASCADE,
  vehicle_type TEXT,
  capacity INTEGER DEFAULT 17,
  vehicle_name TEXT NOT NULL,
  vendor_id TEXT,
  cost_per_day DECIMAL(10, 2) DEFAULT 0.00,
  assigned_passengers JSONB DEFAULT '[]'::jsonb,
  status TEXT CHECK(status IN ('pending', 'confirmed', 'completed')) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Guides
CREATE TABLE IF NOT EXISTS departure_guides (
  id TEXT PRIMARY KEY,
  departure_id TEXT REFERENCES departures(id) ON DELETE CASCADE,
  guide_id TEXT NOT NULL,
  role TEXT CHECK(role IN ('lead_guide', 'co_guide', 'adventure_guide', 'local_guide')) DEFAULT 'lead_guide',
  days_assigned JSONB DEFAULT '[]'::jsonb,
  agreed_amount DECIMAL(10, 2) DEFAULT 0.00,
  advance_paid DECIMAL(10, 2) DEFAULT 0.00,
  balance_due DECIMAL(10, 2) DEFAULT 0.00,
  payment_status TEXT CHECK(payment_status IN ('unpaid', 'advance_paid', 'paid')) DEFAULT 'unpaid',
  status TEXT CHECK(status IN ('pending', 'confirmed', 'completed')) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS departure_tasks (
  id TEXT PRIMARY KEY,
  departure_id TEXT REFERENCES departures(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  stage TEXT CHECK(stage IN ('pre_trip_30d', 'pre_trip_7d', 'pre_trip_1d', 'on_departure', 'post_trip')) DEFAULT 'pre_trip_30d',
  priority TEXT CHECK(priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  assigned_to TEXT,
  status TEXT CHECK(status IN ('pending', 'in_progress', 'completed', 'overdue')) DEFAULT 'pending',
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Documents
CREATE TABLE IF NOT EXISTS departure_documents (
  id TEXT PRIMARY KEY,
  departure_id TEXT REFERENCES departures(id) ON DELETE CASCADE,
  document_category TEXT CHECK(document_category IN ('passenger_docs', 'payment_proofs', 'hotel_vouchers', 'vehicle_documents', 'guide_ids', 'operational_files')) DEFAULT 'operational_files',
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  verification_status TEXT CHECK(verification_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
  document_type TEXT,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Customer Payments
CREATE TABLE IF NOT EXISTS departure_customer_payments (
  id TEXT PRIMARY KEY,
  departure_id TEXT REFERENCES departures(id) ON DELETE CASCADE,
  booking_id TEXT REFERENCES departure_bookings(id) ON DELETE CASCADE,
  payment_amount DECIMAL(12, 2) DEFAULT 0.00,
  payment_date DATE DEFAULT CURRENT_DATE,
  payment_method TEXT CHECK(payment_method IN ('bank_transfer', 'upi', 'card', 'cash')) DEFAULT 'upi',
  transaction_id TEXT UNIQUE,
  status TEXT CHECK(status IN ('pending', 'received', 'failed', 'refunded')) DEFAULT 'received',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vendor Payments
CREATE TABLE IF NOT EXISTS departure_vendor_payments (
  id TEXT PRIMARY KEY,
  departure_id TEXT REFERENCES departures(id) ON DELETE CASCADE,
  vendor_id TEXT NOT NULL,
  vendor_type TEXT CHECK(vendor_type IN ('hotel', 'transport', 'activity', 'guide')) DEFAULT 'hotel',
  invoice_amount DECIMAL(12, 2) DEFAULT 0.00,
  advance_paid DECIMAL(12, 2) DEFAULT 0.00,
  balance_amount DECIMAL(12, 2) DEFAULT 0.00,
  payment_date DATE DEFAULT CURRENT_DATE,
  payment_method TEXT,
  transaction_id TEXT,
  status TEXT CHECK(status IN ('pending', 'advance_paid', 'paid', 'settlement_pending')) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Station Payments
CREATE TABLE IF NOT EXISTS departure_station_payments (
  id TEXT PRIMARY KEY,
  departure_id TEXT REFERENCES departures(id) ON DELETE CASCADE,
  booking_id TEXT REFERENCES departure_bookings(id) ON DELETE CASCADE,
  collection_station TEXT NOT NULL,
  package_value DECIMAL(12, 2) DEFAULT 0.00,
  pre_station_paid DECIMAL(12, 2) DEFAULT 0.00,
  cash_collected DECIMAL(12, 2) DEFAULT 0.00,
  upi_collected DECIMAL(12, 2) DEFAULT 0.00,
  upi_verification_status TEXT CHECK(upi_verification_status IN ('verified', 'pending', 'failed')) DEFAULT 'pending',
  remaining_balance DECIMAL(12, 2) DEFAULT 0.00,
  payment_status TEXT CHECK(payment_status IN ('collected', 'pending', 'partial')) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Communication Messages
CREATE TABLE IF NOT EXISTS departure_messages (
  id TEXT PRIMARY KEY,
  departure_id TEXT REFERENCES departures(id) ON DELETE CASCADE,
  channel TEXT CHECK(channel IN ('group_board', 'announcements', 'internal_ops')) DEFAULT 'internal_ops',
  sender_id TEXT,
  message_text TEXT NOT NULL,
  message_type TEXT CHECK(message_type IN ('text', 'image', 'document')) DEFAULT 'text',
  is_broadcast BOOLEAN DEFAULT false,
  visibility TEXT CHECK(visibility IN ('passengers_and_crew', 'crew_only')) DEFAULT 'crew_only',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reports Cache
CREATE TABLE IF NOT EXISTS departure_reports (
  id TEXT PRIMARY KEY,
  departure_id TEXT REFERENCES departures(id) ON DELETE CASCADE,
  report_type TEXT CHECK(report_type IN ('passenger_manifest', 'financials', 'hotel_voucher', 'transport_fleet', 'guide_payout', 'operational_checklist')) NOT NULL,
  report_data JSONB DEFAULT '{}'::jsonb,
  generated_at TIMESTAMP DEFAULT NOW(),
  generated_by TEXT
);
