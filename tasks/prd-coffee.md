# Product Requirements Document: Coffee Package

## Introduction/Overview

The Coffee package is a GitHub Pages web application that helps CCV (Christ's Church of the Valley) musicians find the best third wave coffee shops near each of the 18 church campuses. When band members are scheduled to perform at different campuses on weekends, they can quickly discover quality coffee options in the area to enhance their worship service experience.

**Goal:** Create a user-friendly web application deployed at `ccvmusic.tools/coffee` that provides curated coffee shop recommendations near CCV church locations.

## Goals

01. **Streamline Coffee Discovery**: Reduce time spent searching for quality coffee near unfamiliar CCV campuses
02. **Enhance Musician Experience**: Improve the weekend experience for rotating band members
03. **Promote Quality Coffee Culture**: Connect musicians with third wave coffee establishments
04. **Provide Campus-Specific Information**: Offer location-relevant recommendations with distance/drive time data
05. **Maintain Simple User Experience**: Deliver information quickly without authentication barriers

## User Stories

* **As a CCV musician** scheduled at East Mesa campus, **I want to** select East Mesa from a list and see nearby third wave coffee shops **so that** I can grab quality coffee before the service.

* **As a drummer** who's never been to the Anthem campus, **I want to** view coffee shops on both a map and list format **so that** I can choose the most convenient option based on my route.

* **As a band leader** planning the team's arrival time, **I want to** see drive times from coffee shops to the campus **so that** I can factor coffee stops into our schedule.

* **As a mobile user** checking coffee options while driving, **I want to** access the app responsively on my phone **so that** I can make quick decisions on the road.

## Functional Requirements

01. **Campus Selection**: The system must allow users to select from all 18 CCV campus locations via a dropdown or clickable interface.

02. **Coffee Shop Display**: The system must display coffee shops in both map view and list view formats, with easy switching between views.

03. **Location Data**: The system must show for each coffee shop:
   - Name
   - Full address
   - Distance from selected campus
   - Drive time from selected campus

04. **Map Integration**: The system must display an interactive map showing:
   - Selected campus location marked distinctly
   - Coffee shop locations as markers
   - Click/tap functionality for additional details

05. **Responsive Design**: The system must function seamlessly across desktop, tablet, and mobile devices.

06. **Campus Filtering**: The system must filter coffee shop results based on the selected campus.

07. **Data Source Integration**: The system must connect to a Supabase database table containing curated coffee shop information.

08. **Performance**: The system must load initial campus selection within 2 seconds and display results within 3 seconds of campus selection.

## Non-Goals (Out of Scope)

* User authentication or login functionality
* User-generated reviews or ratings
* Real-time coffee shop hours or availability
* Online ordering or reservation systems
* Coffee shop detailed descriptions or photos (initial version)
* Advanced filtering (price, amenities, roasting preferences)
* Social features or sharing capabilities
* Admin interface for coffee shop management (will be handled directly in Supabase)

## Design Considerations

* **Consistency**: Follow design patterns established in the existing roster package
* **Visual Hierarchy**: Prioritize campus selection as the primary action
* **Mobile-First**: Design with mobile users as primary consideration
* **Loading States**: Include appropriate loading indicators for map and data fetching
* **Error Handling**: Graceful degradation when map services or database are unavailable
* **Typography**: Use clean, readable fonts suitable for quick scanning

## Technical Considerations

* **Monorepo Integration**: Package should follow established patterns from the existing roster package structure
* **Build System**: Utilize existing Vite configuration for consistency
* **GitHub Pages Deployment**: Configure for deployment to `ccvmusic.tools/coffee` subdirectory
* **Database**: Connect to Supabase for coffee shop data storage and retrieval
* **Map Service**: Integrate with Google Maps or similar service for map display and distance calculations
* **Dependencies**: Reuse existing dependencies where possible to minimize bundle size

## Campus Data Reference

Based on [CCV's locations page](https://ccv.church/locations), the 18 campuses are:

01. Anthem - 39905 N Gavilan Peak Pkwy, Anthem, AZ 85086
02. Avondale - 1565 N 113th Ave, Avondale, AZ 85392
03. Central Scottsdale - 9610 E Cactus Rd, Scottsdale, AZ 85260
04. Chandler - 5835 W Ray Rd, Chandler, AZ 85226
05. Downtown Phoenix - 101 E Buchanan St, Phoenix, AZ 85004
06. East Mesa - 1330 S Crismon Rd, Mesa, AZ 85209
07. Laveen - 4343 W Baseline Rd, Laveen, AZ 85339
08. Maricopa - 19475 N Porter Rd, Maricopa, AZ 85138
09. Maryvale - 5702 N 35th Ave, Phoenix, AZ 85017
10. Midtown Phoenix - 2005 E Indian School Rd, Phoenix, AZ 85016
11. North Phoenix - 15025 N 19th Ave, Phoenix, AZ 85023
12. North Surprise - 23601 N 163rd Ave, Surprise, AZ 85387
13. Peoria - 7007 W Happy Valley Rd, Peoria, AZ 85383
14. Queen Creek - 23805 S. Ellsworth, Queen Creek, AZ 85142
15. Scottsdale - 19030 N Pima Rd, Scottsdale, AZ 85255
16. Surprise - 14787 W Cholla St, Surprise, AZ 85379
17. Verde Valley - 406 S 6th St, Cottonwood, AZ 86326
18. Verrado - 20575 W Indian School Rd, Buckeye, AZ 85396

## Success Metrics

* **Adoption Rate**: 70% of regular CCV musicians use the app within 3 months of launch
* **User Engagement**: Average session duration of 2-5 minutes (indicating efficient coffee discovery)
* **Mobile Usage**: 60%+ of traffic comes from mobile devices
* **Campus Coverage**: Coffee recommendations available for all 18 campuses
* **Performance**: 95% of page loads complete within 3 seconds
* **User Satisfaction**: Positive feedback from initial musician beta testers

## Database Schema Requirements

**Coffee Shops Table** (Supabase):
* `id` (Primary Key)
* `name` (String)
* `address` (String)
* `latitude` (Decimal)
* `longitude` (Decimal)
* `campus_id` (Foreign Key reference)
* `distance_miles` (Decimal)
* `drive_time_minutes` (Integer)
* `created_at` (Timestamp)
* `updated_at` (Timestamp)

**Campuses Table** (Supabase):
* `id` (Primary Key)
* `name` (String)
* `address` (String)
* `latitude` (Decimal)
* `longitude` (Decimal)

## Open Questions

01. **Third Wave Definition**: What specific criteria define a "third wave" coffee shop for this project? (artisanal roasting, specialty brewing methods, single-origin focus, etc.)

02. **Update Frequency**: How often should the coffee shop database be reviewed and updated?

03. **Distance Radius**: What maximum distance from each campus should be considered (5 miles, 10 miles, 15 minutes drive time)?

04. **Backup Plan**: If the primary map service fails, should there be a fallback to list-only view?

05. **Analytics**: Should we implement usage tracking to understand which campuses and coffee shops are most popular?

## Implementation Priority

**Phase 1 (MVP)**: Campus selection, basic list view, Supabase integration
**Phase 2**: Map integration with markers
**Phase 3**: Drive time calculations and mobile optimization
**Phase 4**: Performance optimization and analytics 
