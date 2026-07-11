# Home Page Premium Redesign

## Objective

Modernize the CineTix home page while preserving its theme colors, content, API request, movie classification, routes, and user actions.

## Visual Direction

Use a cinematic editorial layout. The first movie in the existing Now Showing result becomes the hero background after data loads. A black fallback remains visible before data is available or when the movie has no banner. A restrained dark overlay keeps the existing headline, supporting text, and Browse Movies action readable.

The page retains black, white, gray, and the existing `#5c6ac4` accent. It does not introduce gradients, decorative blobs, oversized rounded elements, or a separate visual theme.

## Layout

The hero remains full bleed, but its content aligns to a centered `max-w-7xl` container. Its height is approximately 520px on desktop and 420px on mobile, leaving the next section discoverable.

All content below the hero uses centered responsive containers with consistent horizontal padding and vertical rhythm. Sections are separated through whitespace and full-width bands rather than nested cards.

Movie grids use explicit responsive columns:

- one column on narrow phones where required for stable card width
- two columns on larger phones and tablets
- three columns on medium desktop widths
- four columns on wide desktop widths

Cards remain centered within their tracks and never stretch to fill arbitrary space.

## Hero

The hero background uses `nowShowingMovies[0].banner`. The image uses `object-cover`, meaningful alt text, and a subtle scale change on load/hover only if it remains visually stable. The existing copy and `/movies` route remain unchanged.

Hero content enters with a short opacity and vertical transition. Motion respects reduced-motion preferences.

## Movie Cards

Reuse `MovieCard` for both categories. Every card has the same fixed width and height at a given responsive breakpoint, with a stable poster aspect region and a flex-column information region.

Card behavior:

- maximum desktop width approximately 264px
- fixed overall height approximately 480px
- 8px border radius
- subtle border and shadow
- small hover lift and stronger shadow
- poster image zoom limited to a subtle transform
- certificate and rating remain overlaid on the poster
- title is one line with ellipsis and a title attribute for the complete value
- metadata uses stable-height rows
- genres are limited to the available row and do not increase card height
- the Now Showing action remains `/movie/:id` and stays anchored at the bottom
- Coming Soon retains its formatted release date in the same bottom-aligned region without adding a new action

Lucide icons replace hand-authored inline SVG icons where an equivalent already exists.

## Sections

Now Showing and Coming Soon retain their current content, filtering, empty states, loading state, errors, and routes. Headers use stronger typography, aligned actions, and compact secondary spacing.

The Special Offer section retains its exact copy, code, and button behavior. It becomes a structured black band within the centered container, with the existing accent color and restrained reveal motion.

The Why Choose CineTix section retains all three titles and descriptions. Its repeated items use a consistent three-column layout and subdued borders/shadows with stable icon treatment.

## Motion

Install Framer Motion and remove `scrollY`, scroll event listeners, refs, manual `getBoundingClientRect` checks, inline blur, and scroll-driven style calculations.

Motion is limited to:

- hero content entrance
- section fade/vertical reveal once on viewport entry
- card hover lift and poster scale
- reduced-motion fallback through Framer Motion preferences

Durations remain between 180ms and 500ms with modest displacement. Motion must not resize layout or delay interaction.

## Scope

Modify only:

- `src/Component/HomePage.jsx`
- `src/Component/MovieCard.jsx`
- focused home/card tests
- package files for Framer Motion

Shared navigation, footer, movie data fetching, filtering, backend URLs, routes, and other pages remain unchanged.

## Testing And Verification

Tests cover:

- existing movie API call and category rendering
- first Now Showing banner as hero media
- empty/loading/error behavior
- preserved movie detail and section routes
- long-title truncation contract
- fixed card sizing and bottom action structure
- category-specific release/action content

Verification includes focused tests, the complete frontend test suite, production build, and viewport inspection at mobile, tablet, and desktop widths. Existing unrelated lint warnings are documented rather than refactored.

## Success Criteria

- Page content is centered and no longer visually stretched.
- Cards have stable dimensions regardless of title or genre length.
- Long titles truncate with ellipsis.
- Card actions occupy a consistent bottom position.
- Existing colors, copy, routes, API behavior, and functionality are preserved.
- Motion is subtle, useful, and reduced-motion aware.
- The page is coherent and non-overlapping across mobile, tablet, and desktop.
