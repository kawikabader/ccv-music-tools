# Team Roster Documentation

This folder contains all documentation for the Team Roster application.

## 📋 Documentation Index

### 🔐 Authentication & Migration

* **[migrationInstructions.md](migrationInstructions.md)** - Complete guide for migrating from custom auth to Supabase Auth
* **[migrateToSupabaseAuth.sql](migrateToSupabaseAuth.sql)** - SQL migration script for database setup
* **[debugUserCreation.sql](debugUserCreation.sql)** - Debug script for troubleshooting user creation issues

### 👥 User Management

* **[adminManagement.md](adminManagement.md)** - Complete guide for managing admin roles and permissions

## 🚀 Quick Start

1. **For new installations:** Follow `migrationInstructions.md`
2. **For user management:** See `adminManagement.md`
3. **For troubleshooting:** Use `debugUserCreation.sql`

## 🏗️ Architecture Overview

The application uses:
* **Supabase Auth** for authentication
* **Row Level Security (RLS)** for database access control
* **Profiles table** for role management (admin/director)
* **Automatic trigger** for profile creation

## 📞 Support

If you encounter issues:
1. Check the troubleshooting sections in the relevant documentation
2. Use the debug scripts to diagnose problems
3. Verify your Supabase configuration matches the migration instructions 
