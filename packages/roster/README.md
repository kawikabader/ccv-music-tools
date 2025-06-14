# @ccv-music-tools/roster

A React-based web application for managing musician contacts, built with TypeScript, Tailwind CSS, and modern web technologies.

## Features

* 🔐 Secure authentication and role-based access control
* 👥 Musician contact management (add, edit, view)
* 🔍 Search and filter functionality
* 📱 Responsive design for all devices
* 🔔 Real-time notifications
* ✅ Form validation
* 🧪 Comprehensive test coverage

## Tech Stack

* React 18
* TypeScript
* Tailwind CSS
* Vite
* React Router
* Jest + React Testing Library
* Cypress
* GitHub Pages

## Development

From the monorepo root:

```bash
# Start development server
pnpm roster:dev

# Build the package
pnpm roster:build

# Run tests
pnpm roster:test

# Deploy (handled by monorepo GitHub Actions)
pnpm roster:deploy
```

Or run commands directly in this package:

```bash
# Navigate to package directory
cd packages/roster

# Start development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Run e2e tests
pnpm test:e2e
```

## Environment Setup

Create a `.env` file in this directory with:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Setup

Set up your Supabase database tables:

```sql
-- Users table
create table users (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  username text unique not null,
  password text not null,
  role text not null check (role in ('MD', 'admin'))
);

-- Musicians table
create table musicians (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  instrument text,
  phone text
);
```

## Project Structure

```
src/
├── components/         # React components
│   ├── Auth/          # Authentication components
│   ├── Common/        # Shared components
│   ├── Layout/        # Layout components
│   └── Musicians/     # Musician-related components
├── context/           # React context providers
├── data/              # JSON data files
├── hooks/             # Custom React hooks
├── pages/             # Page components
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## Available Scripts

* `pnpm dev` - Start development server
* `pnpm build` - Build for production
* `pnpm preview` - Preview production build
* `pnpm test` - Run unit and integration tests
* `pnpm test:e2e` - Run end-to-end tests
* `pnpm lint` - Run ESLint
* `pnpm lint:fix` - Fix ESLint errors
* `pnpm format` - Format code with Prettier
* `pnpm deploy` - Deploy to GitHub Pages (Note: Deployment is handled by monorepo GitHub Actions) 
