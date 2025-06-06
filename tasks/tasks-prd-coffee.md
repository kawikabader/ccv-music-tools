# Task List: Coffee Package Implementation

Based on `prd-coffee.md`

## Relevant Files

* `packages/coffee/package.json` - Package configuration with dependencies for React, Tailwind, Supabase, map integration
* `packages/coffee/vite.config.ts` - Vite build configuration for GitHub Pages deployment
* `packages/coffee/tsconfig.json` - TypeScript configuration
* `packages/coffee/tailwind.config.js` - Tailwind CSS configuration following existing patterns
* `packages/coffee/src/App.tsx` - Main application component with campus selection and coffee shop display
* `packages/coffee/src/App.test.tsx` - Main application tests
* `packages/coffee/src/components/CampusSelector/CampusSelector.tsx` - Campus selection dropdown component
* `packages/coffee/src/components/CampusSelector/CampusSelector.test.tsx` - Campus selector tests
* `packages/coffee/src/components/CoffeeShopList/CoffeeShopList.tsx` - List view component for coffee shops
* `packages/coffee/src/components/CoffeeShopList/CoffeeShopList.test.tsx` - Coffee shop list tests
* `packages/coffee/src/components/CoffeeShopMap/CoffeeShopMap.tsx` - Map view component with markers
* `packages/coffee/src/components/CoffeeShopMap/CoffeeShopMap.test.tsx` - Coffee shop map tests
* `packages/coffee/src/components/ViewToggle/ViewToggle.tsx` - Toggle between list and map views
* `packages/coffee/src/components/ViewToggle/ViewToggle.test.tsx` - View toggle tests
* `packages/coffee/src/components/CoffeeShopCard/CoffeeShopCard.tsx` - Individual coffee shop display component
* `packages/coffee/src/components/CoffeeShopCard/CoffeeShopCard.test.tsx` - Coffee shop card tests
* `packages/coffee/src/data/campuses.ts` - Static campus data with coordinates
* `packages/coffee/src/lib/supabase.ts` - Supabase client configuration
* `packages/coffee/src/lib/database.ts` - Database query functions and API calls
* `packages/coffee/src/lib/database.test.ts` - Database function tests
* `packages/coffee/src/types/index.ts` - TypeScript type definitions for Campus and CoffeeShop
* `packages/coffee/src/hooks/useCoffeeShops.ts` - Custom hook for fetching coffee shop data
* `packages/coffee/src/hooks/useCoffeeShops.test.ts` - Coffee shops hook tests
* `packages/coffee/src/utils/distance.ts` - Distance calculation utilities
* `packages/coffee/src/utils/distance.test.ts` - Distance utilities tests
* `packages/coffee/index.html` - Entry HTML file
* `packages/coffee/.github/workflows/deploy-coffee.yml` - GitHub Pages deployment workflow
* `packages/coffee/jest.config.js` - Jest testing configuration
* `packages/coffee/src/setupTests.ts` - Jest setup file

### Notes

* Unit tests should typically be placed alongside the code files they are testing
* Use `npm test` to run tests from the coffee package directory
* Use `npm run build` to create production build
* Use `npm run deploy` to deploy to GitHub Pages at ccvmusic.tools/coffee

## Tasks

* [x] 1.0 Project Setup & Configuration
  + [x] 1.1 Create new `packages/coffee` directory in monorepo
  + [x] 1.2 Initialize `package.json` with React, TypeScript, Vite, Tailwind CSS, Supabase, and testing dependencies
  + [x] 1.3 Configure `vite.config.ts` for GitHub Pages deployment with base path `/coffee`
  + [x] 1.4 Setup TypeScript configuration files (`tsconfig.json`,                                      `tsconfig.app.json`,                                      `tsconfig.node.json`)
  + [x] 1.5 Configure Tailwind CSS with `tailwind.config.js` following existing patterns
  + [x] 1.6 Setup Jest testing configuration with `jest.config.js` and `setupTests.ts`
  + [x] 1.7 Create basic project structure with `src` directories for components, lib, types, hooks, utils
  + [x] 1.8 Create entry `index.html` file
  + [x] 1.9 Update root workspace `pnpm-workspace.yaml` to include coffee package

* [ ] 2.0 Database Schema & Supabase Integration
  + [x] 2.1 Create Supabase project and obtain connection credentials
  + [x] 2.2 Create `campuses` table with id, name, address, latitude, longitude columns
  + [ ] 2.3 Create `coffee_shops` table with id, name, address, latitude, longitude, campus_id, distance_miles, drive_time_minutes columns
  + [ ] 2.4 Populate `campuses` table with all 18 CCV campus locations from PRD
  + [ ] 2.5 Setup Supabase client configuration in `src/lib/supabase.ts`
  + [ ] 2.6 Create TypeScript types in `src/types/index.ts` for Campus and CoffeeShop interfaces
  + [ ] 2.7 Create database query functions in `src/lib/database.ts` for fetching campuses and coffee shops
  + [ ] 2.8 Write unit tests for database functions

* [ ] 3.0 Campus Selection & Data Management
  + [ ] 3.1 Create static campus data file `src/data/campuses.ts` with all 18 locations
  + [ ] 3.2 Build `CampusSelector` component with dropdown functionality
  + [ ] 3.3 Implement campus selection state management in main App component
  + [ ] 3.4 Create custom hook `useCoffeeShops` for fetching coffee shops by campus
  + [ ] 3.5 Add loading and error states for data fetching
  + [ ] 3.6 Write unit tests for campus selector component and hook
  + [ ] 3.7 Implement campus filtering logic to show relevant coffee shops

* [ ] 4.0 Coffee Shop Display Components (List & Map Views)
  + [ ] 4.1 Create `CoffeeShopCard` component to display individual shop information (name, address, distance, drive time)
  + [ ] 4.2 Build `CoffeeShopList` component with responsive grid/list layout
  + [ ] 4.3 Create `CoffeeShopMap` component with Google Maps integration
  + [ ] 4.4 Implement map markers for campus location and coffee shops
  + [ ] 4.5 Add map click/tap functionality for coffee shop details
  + [ ] 4.6 Create `ViewToggle` component to switch between list and map views
  + [ ] 4.7 Implement responsive design for mobile, tablet, and desktop
  + [ ] 4.8 Add loading spinners and error handling for map and data
  + [ ] 4.9 Write comprehensive unit tests for all display components
  + [ ] 4.10 Integrate distance calculation utilities

* [ ] 5.0 Deployment & Performance Optimization
  + [ ] 5.1 Create GitHub Actions workflow `.github/workflows/deploy-coffee.yml` for automated deployment
  + [ ] 5.2 Configure workflow to build and deploy to GitHub Pages at `ccvmusic.tools/coffee`
  + [ ] 5.3 Optimize bundle size by analyzing dependencies and removing unused code
  + [ ] 5.4 Implement code splitting for map components to improve initial load time
  + [ ] 5.5 Add performance monitoring to ensure 2-3 second load requirements
  + [ ] 5.6 Configure proper error boundaries and fallback UI components
  + [ ] 5.7 Test deployment process and verify functionality at target URL
  + [ ] 5.8 Conduct mobile responsiveness testing across different devices
  + [ ] 5.9 Performance audit and optimization based on lighthouse scores
