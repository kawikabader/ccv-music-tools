# Team Roster

A web application for music directors to manage musician contact information.

## Features

* Simple email/password authentication
* Protected routes
* Responsive design with Tailwind CSS
* TypeScript support

## Prerequisites

* Node.js 16+
* npm 7+

## Setup

1. Clone the repository:
   

```bash
   git clone https://github.com/yourusername/team-roster.git
   cd team-roster
   ```

2. Install dependencies:
   

```bash
   npm install
   ```

3. Start the development server:
   

```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Development

* `npm run dev` - Start development server
* `npm run build` - Build for production
* `npm run preview` - Preview production build
* `npm run test` - Run tests
* `npm run lint` - Run linter
* `npm run format` - Format code with Prettier

## Deployment

The application is configured for deployment on GitHub Pages. To deploy:

1. Update the `homepage` field in `package.json` with your GitHub Pages URL
2. Run:
   

```bash
   npm run deploy
   ```

## License

MIT

## Project Structure

* `src/components/` — React components (Auth, MusicianList, Admin)
* `src/pages/` — Page components
* `src/utils/` — Utility functions
* `src/types/` — TypeScript type definitions
* `src/data/` — JSON data files
