# Supabase Setup Instructions for Coffee Package

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Fill in project details:
   - **Name**: `ccv-coffee`

   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Choose the closest region to your users (US West for Arizona)
5. Click "Create new project"
6. Wait for the project to be provisioned (usually 1-2 minutes)

## Step 2: Obtain Connection Credentials

Once your project is ready:

1. Go to **Settings** > **API** in your Supabase dashboard
2. Copy the following values:

### Required Environment Variables:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 3: Configure Environment Variables

Create a `.env.local` file in the `packages/coffee/` directory with:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: 
* Replace the placeholder values with your actual Supabase credentials
* The `.env.local` file should be added to `.gitignore` to keep credentials secure
* Use `VITE_` prefix for environment variables to make them available in the React app

## Step 4: Test Connection

Once credentials are configured, you can test the connection using the database utilities that will be created in the next tasks.

## Security Notes

* The anon key is safe to use in client-side code
* Row Level Security (RLS) will be configured to control data access
* Never commit actual credentials to version control 
