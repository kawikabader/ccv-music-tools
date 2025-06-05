# Admin Role Management Documentation

## Overview

The team roster application uses Supabase Auth with Row Level Security (RLS) and a custom profiles system. Users have two possible roles:
* **admin**: Full access - can create, read, update, and delete musicians
* **director**: Read-only access - can only view musicians

## How the System Works

1. **User Creation**: When a user is created in Supabase Auth, a trigger automatically creates a profile with role "director" (default)
2. **Role Enforcement**: Database RLS policies enforce role-based access to the musicians table
3. **Admin Promotion**: Admins must be manually promoted by updating their profile role

## Making a User an Admin

### Method 1: Update Existing User by Email

```sql
-- Update user to admin role by email
UPDATE profiles 
SET role = 'admin', name = 'Admin User Name' 
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'user@example.com'
);
```

### Method 2: Update by User ID

```sql
-- Update user to admin role by ID (if you know the UUID)
UPDATE profiles 
SET role = 'admin', name = 'Admin User Name' 
WHERE id = '12345678-1234-1234-1234-123456789abc';
```

### Method 3: Create Admin User from Scratch

1. **In Supabase Dashboard:**
   - Go to Authentication > Users
   - Click "Add user"
   - Enter email and password
   - Make sure "Auto Confirm User?" is checked
   - Click "Create user"

2. **In SQL Editor:**
   

```sql
   -- Promote the newly created user to admin
   UPDATE profiles 
   SET role = 'admin', name = 'Admin Display Name' 
   WHERE id = (
     SELECT id FROM auth.users 
     WHERE email = 'newadmin@example.com'
   );
   ```

## Checking Current Roles

### View All Users and Their Roles

```sql
SELECT 
  u.email,
  p.name,
  p.role,
  p.created_at,
  u.created_at as user_created_at
FROM profiles p 
JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC;
```

### Check Specific User's Role

```sql
SELECT 
  u.email,
  p.name,
  p.role
FROM profiles p 
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'user@example.com';
```

## Demoting Admin to Director

```sql
-- Demote admin back to director role
UPDATE profiles 
SET role = 'director' 
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'admin@example.com'
);
```

## Role Permissions

### Admin Role Can:

* ✅ View all musicians
* ✅ Add new musicians
* ✅ Edit existing musicians
* ✅ Delete musicians
* ✅ Export data
* ✅ Access admin panel

### Director Role Can:

* ✅ View all musicians
* ✅ Search and filter musicians
* ✅ Export data (read-only)
* ❌ Add new musicians
* ❌ Edit musicians
* ❌ Delete musicians
* ❌ Access admin panel

## Troubleshooting

### User Can't Log In

1. Check if user exists in auth.users:
   

```sql
   SELECT id, email, email_confirmed_at 
   FROM auth.users 
   WHERE email = 'user@example.com';
   ```

2. Check if profile exists:
   

```sql
   SELECT * FROM profiles 
   WHERE id = (SELECT id FROM auth.users WHERE email = 'user@example.com');
   ```

### User Has No Permissions

1. Verify their role:
   

```sql
   SELECT p.role, u.email 
   FROM profiles p 
   JOIN auth.users u ON p.id = u.id
   WHERE u.email = 'user@example.com';
   ```

2. Check RLS policies are enabled:
   

```sql
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'musicians';
   ```

### Missing Profile (User exists but no profile)

```sql
-- Manually create missing profile
INSERT INTO profiles (id, name, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'user@example.com'),
  'User Display Name',
  'director'  -- or 'admin'
);
```

## Security Notes

* **Only run these commands in the Supabase SQL Editor**
* **Always verify the email/ID before updating roles**
* **Admin role gives full database access - use carefully**
* **Keep a backup of your profiles table when making bulk changes**

## Quick Reference Commands

```sql
-- Promote to admin
UPDATE profiles SET role = 'admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'EMAIL'); 

-- Demote to director  
UPDATE profiles SET role = 'director' WHERE id = (SELECT id FROM auth.users WHERE email = 'EMAIL'); 

-- List all admins
SELECT u.email, p.name FROM profiles p JOIN auth.users u ON p.id = u.id WHERE p.role = 'admin'; 

-- List all directors
SELECT u.email, p.name FROM profiles p JOIN auth.users u ON p.id = u.id WHERE p.role = 'director'; 
```
