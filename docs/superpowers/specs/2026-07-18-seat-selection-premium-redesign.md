# Seat Selection Premium Redesign

## Goal

Modernize the CineTix seat-selection page with a premium booking-panel layout and restrained Framer Motion while preserving the current light theme and every existing backend-facing behavior.

## Scope

This is a frontend-only redesign of `SeatSelectionPage.jsx` and `Seat.jsx`, plus focused frontend tests. It must not change backend code, API endpoints, request payloads, availability behavior, local-storage keys, authentication routing, payment navigation state, seat identifiers, seat limits, or ticket pricing.

## Visual Direction

The page will continue the established CineTix palette:

- light gray page background;
- white content surfaces;
- near-black headings and cinematic accents;
- `#5c6ac4` indigo as the primary action and selected-seat color;
- restrained gray, amber, and red feedback states.

The presentation should feel polished and cinematic without switching to a dark theme. Cards may use rounded corners, subtle borders, soft shadows, and a faint indigo screen glow.

## Layout

The main content will use a responsive two-column layout on large screens:

- The wider left column contains show information, status feedback, the screen treatment, legend, and seat map.
- The narrower right column contains a sticky booking summary.
- Small and medium screens collapse into a single column. The summary follows the seat map, and the payment action remains easy to reach without covering seats.

The header will display the movie title and a compact metadata row for theater, screen, date, and time. Missing optional display fields should degrade gracefully rather than showing empty separators.

## Seat Map

The existing eight rows, seat identifiers, aisle positions, maximum selection of ten, and booked-seat authority remain unchanged.

Each seat remains a native button with its current accessible label, pressed state, disabled state, and title. Visual states will be:

- Available: white surface, neutral border, readable dark label, and an indigo hover/focus treatment.
- Selected: solid indigo surface, white label, and a subtle indigo glow.
- Booked: muted gray or restrained red-gray surface with reduced emphasis and a not-allowed cursor.

The screen will use a gently curved or perspective-styled visual with an indigo-tinted glow and an explicit `Screen` label. Row labels and aisles must remain clear at all supported viewport widths. Horizontal scrolling is allowed on narrow screens, but the row-label column must remain visually associated with its row.

A legend will explain available, selected, and booked states. Where availability data supplies a remaining count, the interface will show it without deriving a conflicting number.

## Booking Summary

The summary card will show:

- selected seat count;
- selected seat labels as compact chips, or an instructional empty state;
- per-ticket price;
- total ticket price;
- availability refresh status when active;
- the existing proceed-to-payment action.

The action keeps its current disabled rules: loading, availability error, sold out, or no selected seats. The existing `proceed` flow, login redirect, final availability refetch, conflict handling, local-storage update, and payment navigation payload remain unchanged.

## Motion

Framer Motion will provide restrained interaction feedback:

- header and primary cards fade upward on initial entry;
- seat rows reveal with a short stagger after availability loads;
- selected seats use a small spring scale response;
- feedback messages enter and leave with `AnimatePresence`;
- selected-seat chips and total changes animate subtly;
- the primary action may lift slightly on hover when enabled.

All nonessential motion must honor `useReducedMotion`. Motion must not delay input, obscure state changes, or animate layout so aggressively that seat positions become difficult to track.

## States and Error Handling

Loading will use a themed seat-map skeleton or spinner inside the layout rather than an unstructured blank area.

Availability errors retain the current retry action in an accessible alert-style card. Sold-out and selection-conflict states remain prominent. The maximum-seat message and realtime conflict message preserve their current meaning. Feedback regions should use appropriate live-region semantics so updates are announced without moving focus.

## Component Boundaries

`SeatSelectionPage` continues to own booking data, availability, selection state, validation, and navigation.

`Seat` continues to own the presentation and interaction of one seat. It may receive reduced-motion information or determine it locally, but its public behavior remains `id`, `selected`, `booked`, and `onClick`.

Small presentational helpers may remain within `SeatSelectionPage.jsx` when they are specific to this page. No shared abstraction should be introduced unless it removes clear duplication without changing other pages.

## Testing

Focused React tests will verify:

- show metadata and the three-state legend render;
- available, selected, and booked seats expose correct accessible states;
- selecting and deselecting updates seat chips, count, total, and action availability;
- the ten-seat maximum still shows its warning;
- sold-out, loading, error, retry, and refresh states remain usable;
- proceeding preserves the established login and payment navigation behavior;
- reduced-motion rendering does not depend on animations completing.

The frontend test suite and production build will be run after implementation. No backend files or tests are part of this change.

## Acceptance Criteria

The seat page matches the existing CineTix light theme, presents a premium responsive two-column booking experience, includes purposeful reduced-motion-aware Framer Motion, and remains keyboard accessible. All current seat availability and booking behavior continues through the same frontend APIs and navigation contracts, and no backend file is modified.
