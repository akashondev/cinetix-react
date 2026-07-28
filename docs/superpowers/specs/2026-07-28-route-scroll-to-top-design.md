# Route Scroll-to-Top Design

## Goal

Every page navigation must open at the top of the document, including browser Back and Forward navigation.

## Architecture

Add one `ScrollToTop` component inside the application router and above the route definitions. The component observes the React Router location key and runs an immediate `window.scrollTo({ top: 0, left: 0, behavior: "auto" })` in a layout effect whenever navigation produces a new history entry.

Using the location key covers normal links, programmatic navigation, redirects, Back, and Forward even when two history entries use the same pathname. Centralizing the behavior avoids duplicating effects across customer, login, and admin pages.

## Boundaries

- Reset scroll only when React Router navigation changes the active history entry.
- Do not add smooth scrolling or page-loading animation.
- Do not interfere with scrolling caused by controls within the current route.
- Apply the behavior to all routes.
- Keep existing page and navigation functionality unchanged.

## Testing

A focused component test will render two routes in a memory router, navigate between them, then navigate Back. It will assert that `window.scrollTo` is called with the immediate top position for each navigation.

The production build and safe frontend test suite will be rerun. The previously skipped `src/Component/BookingFlow.test.jsx` will remain excluded.
