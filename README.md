# Musician Contact Directory

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

## Prerequisites

* Node.js 18 or later
* npm 9 or later

## Getting Started

1. Clone the repository:
   

```bash
   git clone https://github.com/kawikabader/team-roster.git
   cd team-roster
   ```

2. Install dependencies:
   

```bash
   npm install
   ```

3. Set up Supabase:
   - Create a free account at [Supabase](https://supabase.com)
   - Create a new project
   - Get your project URL and anon key from Project Settings > API
   - Create a `.env` file in the root directory with:

     

```
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. Set up your database tables:
   

```sql
   -- Users table
   create table users (
     id uuid default uuid_generate_v4() primary key,
     name text not null,
     username text unique not null,
     password text not null,
     role text not null check (role in ('admin', 'director'))
   );

   -- Musicians table
   create table musicians (
     id uuid default uuid_generate_v4() primary key,
     name text not null,
     instrument text,
     phone text
   );
   ```

5. Start the development server:
   

```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Available Scripts

* `npm run dev` - Start development server
* `npm run build` - Build for production
* `npm run preview` - Preview production build
* `npm run test` - Run unit and integration tests
* `npm run test:e2e` - Run end-to-end tests
* `npm run lint` - Run ESLint
* `npm run lint:fix` - Fix ESLint errors
* `npm run format` - Format code with Prettier
* `npm run deploy` - Deploy to GitHub Pages

## Testing

### Unit and Integration Tests

```bash
npm test
```

### End-to-End Tests

```bash
# Open Cypress Test Runner
npm run cypress:open

# Run tests in headless mode
npm run cypress:run

# Start dev server and run tests
npm run test:e2e
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

## Authentication

The application uses Supabase authentication. For testing purposes, the following test credentials can be used if you set up your own Supabase instance:

* Username: kawikabader (Admin role)
* Password: kawikabader#5289

* Username: testdirector (Director role)  
* Password: testdirector#0123

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

* [React](https://reactjs.org/)
* [Tailwind CSS](https://tailwindcss.com/)
* [Vite](https://vitejs.dev/)
* [Cypress](https://www.cypress.io/)
* [Jest](https://jestjs.io/)
