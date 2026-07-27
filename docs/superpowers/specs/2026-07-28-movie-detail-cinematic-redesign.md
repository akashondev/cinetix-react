# Movie Detail Cinematic Redesign

## Objective

Redesign the CineTix movie detail page to match the cinematic composition in the supplied references while preserving the existing CineTix theme, movie API request, showtime selection, booking data, and seat-selection navigation.

This is a frontend-only change. Backend files, API contracts, stored booking fields, and business logic remain unchanged.

## Visual Direction

Use a dark cinematic presentation built from black, white, neutral grays, and the existing `#5c6ac4` CineTix accent. The page should feel immersive without copying the references' branding or introducing a new theme.

The movie backdrop fills the upper page beneath the existing CineTix navigation. A layered dark overlay keeps controls and text readable. The poster and primary movie information overlap the lower edge of the hero on desktop and flow into a stacked layout on smaller screens.

## Hero And Movie Information

The hero uses the existing movie media fields and degrades gracefully when a dedicated wide banner is unavailable. Its centered play control is the single trailer entry point.

The lower hero content includes:

- poster art
- title, rating, duration, certificate, and genres
- description
- director, release date, and cast
- a clear visual transition into showtime selection

The redundant `Watch Trailer` link beneath the poster is removed.

## Trailer Window

Selecting the hero play control opens a large modal trailer window over the current page, following the interaction shown in the second reference.

The modal:

- darkens and subtly blurs the page behind it
- presents a responsive 16:9 YouTube player
- begins playback after the user opens it
- retains standard player controls
- includes a prominent close button
- closes through the close button, the Escape key, or a click on the backdrop
- prevents background scrolling while open
- restores focus to the play control after closing

The frontend converts supported YouTube watch, short, and embed URLs into an embeddable URL. Invalid, empty, or unsupported trailer values do not open a broken player; the play control is disabled or the modal presents a restrained unavailable state.

No external navigation is required to watch the trailer.

## Showtimes And Booking

The existing date generation, current-time checks, theater list, showtime availability, loading state, local storage writes, URL parameters, and `/seats` navigation remain behaviorally unchanged.

The showtime area is visually restyled into a clean booking section with:

- compact date choices using the existing selected state
- clear theater names, locations, screen labels, and available-show counts
- accessible showtime buttons with distinct available, selected, hover, focus, and unavailable states
- consistent responsive spacing and readable grouping

No backend endpoint or booking-data field is added, removed, or renamed.

## Responsive And Accessible Behavior

Desktop uses the layered hero composition from the references. Tablet and mobile stack the poster and movie details while keeping the hero play control visible and the trailer window within the viewport.

Interactive controls use semantic buttons, visible keyboard focus, and descriptive labels. The modal exposes dialog semantics, has an accessible name, handles Escape, and restores focus. Motion is restrained and respects reduced-motion preferences.

## Component Boundaries

The page continues to own its existing data fetching and booking behavior. Small frontend helpers or presentational components may be extracted only when they make trailer URL handling, modal behavior, or testing clearer.

Expected frontend scope:

- `src/Component/MovieDetailPage.jsx`
- a focused `MovieDetailPage` test file
- optional small frontend-only trailer helper or component

Shared navigation, footer, APIs, backend code, and unrelated pages remain unchanged.

## Error And Loading States

The current movie loading and not-found flows remain intact but adopt the page's dark presentation. Movie images use a safe visual fallback. Trailer failures stay within the modal or disable the unavailable action without affecting showtime booking.

## Testing And Verification

Focused tests cover:

- the existing movie request and rendered movie information
- the centered hero trailer control
- opening the trailer in a modal player
- conversion of supported YouTube URLs
- closing by button, Escape, and backdrop
- removal of the old poster trailer link
- preservation of showtime selection and `/seats` booking navigation
- unavailable-trailer behavior

Verification includes the focused tests, the complete frontend test suite, a production build, and responsive visual inspection.

## Success Criteria

- The movie detail page has a clean cinematic hero aligned with the supplied references and CineTix colors.
- Clicking the hero play control plays the trailer inside a large overlay window.
- The old trailer button beneath the poster is gone.
- Movie metadata and showtimes remain readable and responsive.
- Booking behavior and backend integration remain unchanged.
- Keyboard, modal, loading, and unavailable-trailer states remain usable.
