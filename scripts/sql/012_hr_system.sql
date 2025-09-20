-- HR System Tables for Cashier Time Tracking and Payroll

-- Work sessions table to track login/logout times
CREATE TABLE IF NOT EXISTS work_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  login_time TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  logout_time TIMESTAMP WITHOUT TIME ZONE DEFAULT NULL,
  session_duration INTERVAL DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Payroll information table
CREATE TABLE IF NOT EXISTS payroll_info (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  hourly_rate DECIMAL(10, 2) DEFAULT 15.00,
  position VARCHAR(100) DEFAULT 'Cashier',
  hire_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT TRUE,
  overtime_rate DECIMAL(10, 2) DEFAULT NULL, -- will be calculated as hourly_rate * 1.5
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Monthly payroll summary table
CREATE TABLE IF NOT EXISTS payroll_summaries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  total_hours DECIMAL(10, 2) DEFAULT 0,
  regular_hours DECIMAL(10, 2) DEFAULT 0,
  overtime_hours DECIMAL(10, 2) DEFAULT 0,
  total_pay DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, paid
  calculated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  approved_by INTEGER REFERENCES users(id) DEFAULT NULL,
  approved_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month, year)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_work_sessions_user_id ON work_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_login_time ON work_sessions(login_time);
CREATE INDEX IF NOT EXISTS idx_work_sessions_active ON work_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_payroll_info_user_id ON payroll_info(user_id);
CREATE INDEX IF NOT EXISTS idx_payroll_summaries_user_month ON payroll_summaries(user_id, month, year);

-- Function to automatically calculate session duration on logout
CREATE OR REPLACE FUNCTION update_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.logout_time IS NOT NULL AND OLD.logout_time IS NULL THEN
    NEW.session_duration = NEW.logout_time - NEW.login_time;
    NEW.is_active = FALSE;
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update session duration
DROP TRIGGER IF EXISTS trigger_update_session_duration ON work_sessions;
CREATE TRIGGER trigger_update_session_duration
  BEFORE UPDATE ON work_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_duration();

-- Function to automatically set overtime rate
CREATE OR REPLACE FUNCTION set_overtime_rate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.overtime_rate IS NULL THEN
    NEW.overtime_rate = NEW.hourly_rate * 1.5;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set overtime rate
DROP TRIGGER IF EXISTS trigger_set_overtime_rate ON payroll_info;
CREATE TRIGGER trigger_set_overtime_rate
  BEFORE INSERT OR UPDATE ON payroll_info
  FOR EACH ROW
  EXECUTE FUNCTION set_overtime_rate();
