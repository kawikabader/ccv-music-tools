# Musician Contact Directory PRD

## Introduction/Overview

A secure, mobile-optimized web application for CCV music directors to access musician contact information. The system will be hosted on GitHub Pages with a private repository to maintain data security.

## Goals

1. Provide quick access to musician contact information for authorized music directors
2. Maintain data security through private repository and basic authentication
3. Enable efficient search and filtering of musician information
4. Support CSV import/export for admin data management
5. Ensure mobile-first, fast user experience

## User Stories

1. As a music director, I want to search for musicians by name or instrument so I can quickly find their contact information
2. As a music director, I want to view all musician information in a mobile-friendly format
3. As an admin, I want to import/export musician data via CSV to maintain the database
4. As an admin, I want to add/edit musician information to keep the database current
5. As a music director, I want to securely access the system with my credentials

## Functional Requirements

1. Authentication System
   - Must support two user roles: admin and music director
   - Must implement basic authentication
   - Must restrict access to authorized users only

2. Musician Data Management
   - Must store: name, instrument, phone number for each musician
   - Must support approximately 200 musician records
   - Must be stored in a JSON file within the private repository

3. Search and Filter
   - Must allow searching by musician name
   - Must allow filtering by instrument
   - Must provide instant search results

4. Admin Features
   - Must allow CSV import of musician data
   - Must allow CSV export of musician data
   - Must provide interface for adding new musicians
   - Must provide interface for editing existing musician information

5. User Interface
   - Must be mobile-first and responsive
   - Must load quickly (< 2 seconds)
   - Must have minimal, clean design
   - Must be accessible on all modern browsers

## Non-Goals (Out of Scope)

1. Grouping or categorization of musicians
2. Direct communication features
3. Musician availability tracking
4. Complex permission levels beyond admin/director
5. Real-time updates or collaboration features

## Technical Considerations

1. Frontend:
   - React.js for the UI framework
   - Tailwind CSS for styling
   - GitHub Pages for hosting
   - Private repository for data security

2. Data Storage:
   - JSON file structure:
   

```json
   {
     "musicians": [
       {
         "id": "string",
         "name": "string",
         "instrument": "string",
         "phone": "string"
       }
     ],
     "users": [
       {
         "id": "string",
         "name": "string",
         "role": "admin|director",
         "email": "string"
       }
     ]
   }
   ```

3. Authentication:
   - Basic authentication using GitHub OAuth
   - Role-based access control

## Success Metrics

1. System loads in under 2 seconds on mobile devices
2. Search results appear within 500ms
3. Zero unauthorized access attempts
4. Successful CSV import/export operations
5. Positive user feedback from music directors

## Open Questions

1. Should we implement any rate limiting for search operations?
2. Do we need to implement any data validation rules for phone numbers?
3. Should we add any audit logging for admin actions?
4. Do we need to implement any data backup strategy beyond the repository?

## Implementation Notes

1. The application will be built as a single-page application (SPA)
2. All data will be stored in a single JSON file in the repository
3. The application will be deployed to GitHub Pages
4. The repository will be private to maintain data security
5. Basic authentication will be implemented using GitHub OAuth 
