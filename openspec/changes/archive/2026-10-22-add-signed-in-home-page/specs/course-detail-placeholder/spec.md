## Purpose

Defines the temporary public course page at `/courses/[slug]` that gives the Home cards a valid link target until the real course detail page is built.

## ADDED Requirements

### Requirement: Placeholder course route
The application SHALL serve a public page at `/{locale}/courses/{slug}` that renders a clearly temporary "course page coming soon" message and a link back to the signed-in home, for any non-empty slug, without requesting any course data. The page SHALL NOT be indexable by search engines and SHALL NOT appear in the sitemap or in the crawl-disallow list derived from private routes.

#### Scenario: Open from a home card
- **WHEN** the user activates a trending or continue-learning card with slug `abc`
- **THEN** the application shows the placeholder page at `/courses/abc` in the same locale

#### Scenario: Not indexable
- **WHEN** a crawler requests the page
- **THEN** the response carries a no-index robots directive

#### Scenario: Back navigation
- **WHEN** the user activates the back link
- **THEN** the user returns to `/home`

### Requirement: Replaceable by the real page
The placeholder SHALL be isolated in one screen component and one route file so that the real course detail page replaces it without touching the Home cards, and the Home cards SHALL build the link only through the shared course-detail href helper.

#### Scenario: Link construction
- **WHEN** any component links to a course page
- **THEN** it uses the shared course-detail href helper rather than a hard-coded path
