# Database Setup Instructions

## Overview

This directory contains the SQL schema files for the CCV Coffee app database.

## Setup Steps

### 1. Execute Schema

1. Open your Supabase project dashboard
2. Go to **SQL Editor** in the left sidebar
3. Create a new query
4. Copy and paste the contents of `schema.sql`
5. Click **Run** to execute the schema

### 2. Verify Tables

After running the schema, verify the tables were created:
1. Go to **Table Editor** in the left sidebar
2. You should see the `campuses` table
3. Check that all columns are present with correct data types

## Tables Created

### campuses

* `id` (UUID, Primary Key) - Auto-generated unique identifier
* `name` (VARCHAR) - Campus name (e.g., "East Mesa")
* `address` (TEXT) - Full campus address
* `latitude` (DECIMAL) - Geographic latitude coordinate
* `longitude` (DECIMAL) - Geographic longitude coordinate
* `created_at` (TIMESTAMP) - Record creation timestamp
* `updated_at` (TIMESTAMP) - Record update timestamp (auto-updated)

## Security

* Row Level Security (RLS) is enabled
* Public read access policy is configured (campuses are public data)
* Indexes are created for optimal query performance

## Next Steps

After creating the campuses table:
1. Execute the coffee_shops schema (task 2.3)
2. Populate campuses table with CCV location data (task 2.4) 
