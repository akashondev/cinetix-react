# Customer Mobile Overflow Repair

## Scope

Repair horizontal overflow and mobile navigation/footer alignment on customer-facing routes only: Home, Login, Movie Details, Seat Selection, Payment, and Tickets. Admin routes are explicitly excluded. Existing in-progress home-page and navigation work must be preserved.

## Root Causes

- The login page positions a 400px decorative element at a fixed `left: 1000px`, enlarging the document on narrow screens.
- Movie Details uses fixed 320px poster and action widths inside a container with horizontal padding, which exceeds some 320px viewports.
- Shared navigation overlays and footer contact rows do not consistently constrain, shrink, or wrap their contents.
- Decorative or animated children can still create document-level overflow even after their visible layout is responsive.

## Design

Use targeted containment at each confirmed source. Shared navigation and footer roots will occupy at most the viewport width, allow children to shrink, and wrap long footer contact content. Mobile menu, search, and account panels will use viewport-safe maximum widths. Fixed customer-page content widths will become fluid with the existing desktop size retained as a maximum. The login decoration will be positioned relative to its container and clipped rather than placed at a large absolute horizontal offset.

Add a document-level `overflow-x: clip` safeguard after correcting the source layouts. This is defensive containment for visual effects, not the primary repair, and must not hide horizontally scrollable functional content such as the seat map.

## Testing

Add focused regression tests before production changes. Tests will assert the shared navigation/footer containment contract and the removal of known fixed-width/absolute-offset overflow sources. Run the complete frontend test suite and production build. Where browser automation is available, inspect every in-scope route at 320px, 375px, and 390px widths and verify that `scrollWidth` does not exceed `clientWidth`; otherwise use component tests plus a source audit and build as the verification boundary.

## Delivery

Commit the implementation without altering unrelated backend or admin code, then push the frontend repository's `master` branch to its configured `origin` (`akashondev/cinetix-react`). Existing relevant uncommitted frontend redesign changes remain preserved.
