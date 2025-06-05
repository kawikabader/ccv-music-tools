-- Debug script for user creation issues
-- Run these queries one by one in Supabase SQL Editor

-- 1. Check if profiles table exists and its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public';

-- 2. Check if trigger exists
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 3. Check if function exists
SELECT routine_name, routine_type, routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 4. Test the function manually (replace with a test UUID)
-- INSERT INTO profiles (id, name, role) VALUES 
-- ('00000000-0000-0000-0000-000000000000', 'Test User', 'director');

-- 5. Check current profiles
SELECT * FROM profiles;

-- 6. Check auth.users (you might not see much here)
SELECT id, email, created_at FROM auth.users LIMIT 5;

-- 7. Simple version of the trigger function if the current one is failing
CREATE OR REPLACE FUNCTION handle_new_user_simple() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    'director'
  );
  RETURN new;
EXCEPTION 
  WHEN others THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Replace the trigger with the safer version
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user_simple(); 