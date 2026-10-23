# signed-in-home Specification

## Purpose
Defines what a signed-in learner sees and can do on the `/home` page: the login gate, the hero carousel, the Complete your Course, Trending Course and Popular Instructor sections, their loading, empty and error states, the Expand More behaviour, the fields shown and deliberately omitted, and the link rules.

## Requirements

### Requirement: Login gate on the signed-in home
The `/home` page SHALL show a loading indicator while the current-user request is pending, SHALL show a "Sign in" call to action that navigates to the login route with `/home` as the return path when session cookies exist but no user can be loaded (an expired session; visitors without session cookies are redirected to the public homepage before the page renders, see `signed-in-home-entry`), and SHALL render the home sections only for a signed-in user. The page SHALL NOT request any home data while no user is signed in.

#### Scenario: Expired session opens /home
- **WHEN** a visitor holding stale session cookies, for whom no user can be loaded, opens `/home`
- **THEN** the page shows the sign-in prompt and its call to action leads to the login route with `next=/home`
- **AND** no request to the three home endpoints is made

#### Scenario: Current user still loading
- **WHEN** the current-user request has not finished
- **THEN** the page shows a loading indicator and no section content or sign-in prompt

#### Scenario: Signed-in user opens /home
- **WHEN** a signed-in user opens `/home`
- **THEN** the hero carousel, Complete your Course, Trending Course and Popular Instructor sections are rendered in that order

### Requirement: Hero carousel
The page SHALL show a looping hero carousel of exactly three slides, each with its own localised copy: (1) a reddish-tinted tiled image collage with the headline "Learn something new everyday." and the sub-headline "Become professionals and ready to join the world."; (2) a yellow panel with "Learn from the best." / "Courses built by real industry experts." next to the "instructor recording a lesson" photo; (3) the "learner at ease" photo next to a teal panel with "Learn at your own pace." / "Anytime, anywhere, no deadlines." (on narrow screens the panel and photo stack vertically). The carousel SHALL NOT render previous or next arrow buttons. It SHALL be navigable by pagination dots and by dragging (mouse) or swiping (touch) left and right, SHALL expose the active slide to assistive technology, and SHALL contain exactly one level-one heading on the page (the slide-1 headline).

#### Scenario: Navigate slides
- **WHEN** the user drags or swipes the carousel, or activates a pagination dot
- **THEN** the corresponding slide becomes active and the active dot is highlighted

#### Scenario: No arrow controls
- **WHEN** the hero is rendered
- **THEN** no previous or next button is present

#### Scenario: Autoplay to the right
- **WHEN** the user does not interact with the carousel for 3 seconds
- **THEN** the carousel scrolls to the next slide on its own and, from the last slide, wraps to the first

#### Scenario: Manual interaction restarts the countdown
- **WHEN** the user changes the slide manually (swipe, drag or dot) while the countdown runs
- **THEN** the 3-second countdown restarts from that moment
- **AND** the countdown is paused while the pointer is held down and restarts when the drag settles

#### Scenario: Reduced motion
- **WHEN** the user's system prefers reduced motion
- **THEN** the carousel does not auto-advance

### Requirement: Complete your Course section
For a user who holds the course-read permission, the page SHALL show the learner's enrolled courses ordered as the backend returns them (most recent learning activity first), each card showing the thumbnail, the title, the owner display name when present, a progress bar and the text "completed of total sub-lessons completed" built from the completed and total sub-lesson counts. The section SHALL initially request 3 items. A user without the course-read permission SHALL NOT see the section and no request SHALL be made.

#### Scenario: Learner has enrollments
- **WHEN** the backend returns enrolled courses
- **THEN** each course is shown with its progress bar value equal to the returned progress percent clamped to 0–100 and its completed and total sub-lesson counts
- **AND** the wording speaks of sub-lessons, not videos

#### Scenario: Learner has no enrollments
- **WHEN** the backend returns an empty list
- **THEN** the section shows an empty state instead of cards

#### Scenario: Missing course-read permission
- **WHEN** the signed-in user does not hold the course-read permission
- **THEN** the Complete your Course section is not rendered and its endpoint is not called

### Requirement: Trending Course section
The page SHALL show trending courses as cards with the thumbnail, the title, the owner display name when present and the short description, in the order the backend returns them, initially 8 cards in a grid. The cards SHALL NOT show a price, discount, badge, rating or review count, because the backend does not provide them.

#### Scenario: Trending courses available
- **WHEN** the backend returns trending courses
- **THEN** at most 8 are shown initially in a responsive grid and none shows price, discount, badge, rating or review count

#### Scenario: Optional fields missing
- **WHEN** a course has no thumbnail or no owner display name
- **THEN** the card shows a neutral placeholder image or omits the owner line and remains otherwise intact

### Requirement: Popular Instructor section
The page SHALL show popular instructors as cards with the picture, the display name and the subtitle (job title), in the order the backend returns them, initially 4 cards. Each card SHALL fall back to coloured initials when no picture is available and SHALL omit the subtitle when it is absent. Instructor cards SHALL NOT be links.

#### Scenario: Instructor with picture
- **WHEN** an instructor has a picture URL
- **THEN** the card shows it with the display name as the alternative text

#### Scenario: Instructor without picture or subtitle
- **WHEN** an instructor has no picture and no subtitle
- **THEN** the card shows initials derived from the display name and no subtitle line

### Requirement: Expand More
Complete your Course and Trending Course SHALL each offer an Expand More control while more items than currently shown may exist. Activating it SHALL re-request the same endpoint once with that endpoint's maximum limit (10 for Complete your Course, 24 for Trending Course) and replace the list in place, after which the control SHALL no longer be shown. Expand More SHALL NOT navigate to another page in this release. The control SHALL NOT be shown when the initial response contains fewer items than were requested.

#### Scenario: Expand trending courses
- **WHEN** the user activates Expand More on Trending Course after 8 items were returned
- **THEN** the section requests 24 items, shows them and hides the control

#### Scenario: Fewer items than requested
- **WHEN** the initial response contains fewer items than the initial limit
- **THEN** the Expand More control is not shown

### Requirement: Swipeable sections on mobile
Below the `sm` breakpoint (640 px), the items of Complete your Course, Trending Course and Popular Instructor SHALL form one horizontally swipeable row with scroll snapping (each item about 85% of the row width so the next one peeks in), without a visible scrollbar and without horizontal scrolling of the page. From `sm` up the sections SHALL keep their existing grids (columns, gaps and card sizes unchanged). The loading skeletons SHALL use the same row so the layout does not jump.

#### Scenario: Mobile viewport
- **WHEN** the page is shown in a viewport narrower than 640 px and a section has more than one item
- **THEN** its items are laid out in one row that scrolls horizontally with snapping and the document itself does not scroll horizontally

#### Scenario: Tablet and desktop viewport
- **WHEN** the viewport is 640 px or wider
- **THEN** Trending Course and Popular Instructor are grids (2 columns from `sm`, 4 from `lg`) and Complete your Course is a grid (2 columns from `sm`, 3 from `lg`) with the same gaps as before

### Requirement: Loading, empty and error states per section
Each data section SHALL show skeleton placeholders matching its card layout while its request is pending, an empty-state message when the response is an empty list, and an error message with a retry control when the request fails. A failure in one section SHALL NOT hide or break the other sections. The retry control SHALL re-request only that section.

#### Scenario: One section fails
- **WHEN** the trending request fails and the other two succeed
- **THEN** Trending Course shows an error with a retry control and the other two sections render normally

#### Scenario: Retry
- **WHEN** the user activates retry in a failed section
- **THEN** only that section's request is repeated

### Requirement: Links and slug handling
Trending and Complete your Course cards SHALL link to the course detail route built from the course `slug` when the slug is non-empty, and SHALL render as non-link cards when it is empty. Slugs SHALL NOT be used as React list keys or identity (the course id, or the instructor user id, is the key). The owner slug and the instructor slug SHALL be stored in the types but SHALL NOT produce links in this release.

#### Scenario: Course card with a slug
- **WHEN** a trending or continue item has a non-empty slug
- **THEN** activating the card navigates to `/courses/<slug>` in the current locale

#### Scenario: Course card without a slug
- **WHEN** an item's slug is empty
- **THEN** the card is rendered without a link
