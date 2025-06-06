-- Coffee App Database Schema
-- Execute these SQL statements in Supabase SQL Editor

-- Create campuses table
CREATE TABLE campuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for campuses
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_campuses_updated_at 
  BEFORE UPDATE ON campuses 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE campuses ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (since this is public data)
CREATE POLICY "Anyone can view campuses" ON campuses
  FOR SELECT USING (true);

-- Create index for performance
CREATE INDEX idx_campuses_name ON campuses(name);
CREATE INDEX idx_campuses_location ON campuses(latitude, longitude); 