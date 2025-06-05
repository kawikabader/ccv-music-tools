# Supabase Auth Migration Instructions

## 🔧 Database Setup (Required First)

### Step 1: Run the Migration SQL

1. Go to your Supabase Dashboard: `https://supabase.com/dashboard/project/uuinnbmmkfdevpctnqmy`
2. Navigate to **SQL Editor**
3. Copy and paste the **entire content** of `src/scripts/migrateToSupabaseAuth.sql`
4. Click **Run** to execute the migration

### Step 2: Create Test Users

1. Go to **Authentication** > **Users** in your Supabase dashboard
2. Click **"Add user"** and create:
   - **Email**: `admin@teamroster.com`

   - **Password**: (choose a secure password)
   - **Confirm**: Check "Auto Confirm User"

3. Create another user:
   - **Email**: `director@teamroster.com`

   - **Password**: (choose a secure password)
   - **Confirm**: Check "Auto Confirm User"

### Step 3: Set User Roles

1. Go back to **SQL Editor**
2. Run these commands to set the roles:

```sql
-- Set admin role
UPDATE profiles SET role = 'admin', name = 'Admin User' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@teamroster.com');

-- Set director role  
UPDATE profiles SET role = 'director', name = 'Director User'
WHERE id = (SELECT id FROM auth.users WHERE email = 'director@teamroster.com');
```

## 📝 Code Changes Made

### ✅ Updated Components:

* **Login**: Now uses email instead of username
* **MusicianList**: Uses profile data and Supabase auth methods
* **ProtectedRoute**: Improved with loading states and better auth checks
* **App.tsx**: Uses new AuthProvider

### ✅ New Files:

* **authSupabase.tsx**: Complete Supabase auth implementation
* **Updated types**: New Profile type, updated User type

### ✅ New Features:

* **Proper password hashing** (handled by Supabase)
* **JWT token management** with auto-refresh
* **Loading states** during auth operations
* **Better error handling** with specific auth errors
* **Database-level security** with RLS policies
* **Role-based permissions** enforced at database level

## 🚀 Testing the Migration

### Test Login:

1. Visit `/login` page
2. Use email: `admin@teamroster.com`

3. Use the password you set
4. Should redirect to musicians page with admin privileges

### Test Permissions:

* **Admin users**: Can add, edit, delete musicians
* **Director users**: Can only view musicians
* **Database level**: RLS policies enforce these permissions

## 🔐 Security Improvements

### Before (Insecure):

* Plain text password comparison
* Client-side only auth checks
* No token management
* Manual session handling

### After (Secure):

* Proper password hashing
* JWT tokens with automatic refresh
* Database-level permission enforcement
* Professional auth flows (email verification, password reset ready)

## 🆘 Rollback Plan

If anything goes wrong, you can rollback by:
1. Reverting git changes: `git reset --hard HEAD~1`
2. Dropping the profiles table: `DROP TABLE profiles;`
3. Disabling RLS: `ALTER TABLE musicians DISABLE ROW LEVEL SECURITY;`

## 🎯 Future Enhancements Available

With Supabase Auth, you can easily add:
* Email verification for new users
* Password reset flows
* Social logins (Google, GitHub, etc.)
* Multi-factor authentication (MFA)
* Magic link authentication (passwordless)
* Advanced role management

The foundation is now in place for all these features! 
