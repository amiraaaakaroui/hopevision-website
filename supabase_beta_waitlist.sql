-- Create beta_waitlist table for Beta waitlist submissions
-- This table stores user information for the Beta waitlist

CREATE TABLE IF NOT EXISTS beta_waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'hospital')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  specialty TEXT, -- For doctors
  institution_name TEXT, -- For hospitals
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure unique email addresses
  CONSTRAINT unique_email UNIQUE (email)
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_beta_waitlist_email ON beta_waitlist(email);
CREATE INDEX IF NOT EXISTS idx_beta_waitlist_role ON beta_waitlist(role);
CREATE INDEX IF NOT EXISTS idx_beta_waitlist_created_at ON beta_waitlist(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE beta_waitlist ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow anyone to insert (for public waitlist signup)
CREATE POLICY "Allow public insert on beta_waitlist"
  ON beta_waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- RLS Policy: Only authenticated users can read (for admin dashboard later)
CREATE POLICY "Allow authenticated read on beta_waitlist"
  ON beta_waitlist
  FOR SELECT
  TO authenticated
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_beta_waitlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_beta_waitlist_updated_at
  BEFORE UPDATE ON beta_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION update_beta_waitlist_updated_at();

-- Add comments for documentation
COMMENT ON TABLE beta_waitlist IS 'Stores Beta waitlist submissions from the landing page';
COMMENT ON COLUMN beta_waitlist.role IS 'User role: patient, doctor, or hospital';
COMMENT ON COLUMN beta_waitlist.specialty IS 'Medical specialty (only for doctors)';
COMMENT ON COLUMN beta_waitlist.institution_name IS 'Hospital or clinic name (only for hospitals)';
