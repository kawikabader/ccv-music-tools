-- Migration script to move from custom auth to Supabase Auth
-- Run this in your Supabase SQL Editor

-- Step 1: Create profiles table linked to Supabase Auth
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'director')),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  PRIMARY KEY (id)
);

-- Step 2: Enable RLS on all tables
ALTER TABLE musicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Profiles policies - users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Step 4: Musicians policies - role-based access
-- Admins can do everything
CREATE POLICY "Admins full access to musicians" ON musicians
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Directors can only read
CREATE POLICY "Directors read access to musicians" ON musicians
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'director')
    )
  );

-- Step 5: Function to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, name, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'director'  -- Default role is director
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Trigger to auto-create profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Step 7: Create some initial users (you'll need to set these up manually in Supabase Auth)
-- Instructions:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add user" and create:
--    - Email: admin@teamroster.com, Password: (your choice)
--    - Email: director@teamroster.com, Password: (your choice)
-- 3. Then run these updates to set their roles:

-- UPDATE profiles SET role = 'admin', name = 'Admin User' 
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@teamroster.com');

-- UPDATE profiles SET role = 'director', name = 'Director User' 
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'director@teamroster.com');

-- Step 8: Drop old users table (ONLY after confirming new auth works)
-- DROP TABLE IF EXISTS users; 