# Booking Flow Performance and Payment UX Design

## Goal

Make the customer booking flow feel immediate, modernize the Payment page, and preserve authoritative seat and ticket behavior across Seat Selection, Payment, and Tickets.

## Scope

This change applies only to customer-facing pages. Admin and login pages are unchanged.

Normal page transitions, hover effects, and interaction animations remain. The change removes unnecessary page-level loading screens and loading circles. Unavoidable asynchronous work uses inline, contextual feedback.

## Selected Approach

Use a targeted booking-flow optimization rather than a shared application-wide loading refactor or cache-first seat availability.

The targeted approach minimizes regression risk while improving the customer paths where waiting is currently visible. Cached seat availability is explicitly excluded because stale cached data could temporarily present a booked seat as available.

## Customer Loading Experience

Customer pages render their stable layout immediately. They do not replace the whole page with a loading screen or centered loading circle.

Data-dependent areas use local placeholders only while their API request is unresolved. Existing content remains visible during background refreshes. Error states appear next to the affected content and include a retry action when the request can be retried.

Admin and login loading behavior is outside this design and must not be changed.

## Seat Availability

### Initial rendering

Seat Selection renders the full seat-map geometry immediately. Until authoritative availability arrives, every seat appears as a neutral animated placeholder:

- placeholders use a subtle shimmer or pulse animation;
- placeholders are disabled;
- placeholders are not styled as available, selected, or booked;
- the page does not show `Loading current seat availability...`;
- the page does not show a loading circle or loading screen.

This makes the layout immediate without creating a window in which a booked seat appears available.

### Authoritative state

The frontend requests availability once for each stable show identity. When the response arrives, the existing grid updates in place:

- available seats become selectable;
- booked seats become disabled and visibly booked;
- selected seats remain selected only if still available;
- sold-out and conflict states continue to use authoritative backend data.

Background refreshes keep the resolved grid visible. They do not revert seats to placeholders or block the page. Newly unavailable selected seats are removed as soon as authoritative data reports them.

### Failure and retry

If the first availability request fails, seats remain neutral and disabled. A compact inline error and Retry action replace the status copy. Unknown seats are never shown as available.

## Payment Page

### Layout

The Payment page uses the Home page container: `max-w-7xl` with matching responsive horizontal padding.

On desktop, the page uses two columns:

- the payment form is the primary left column;
- the booking and price summary is a narrower sticky right column.

On mobile and tablet, the layout becomes one column. Content order stays understandable, fields use full available width, and the payment action remains easy to reach.

### Visual language

The redesign keeps the existing CineTix visual identity:

- clean white cards;
- restrained borders and shadows;
- consistent rounded corners;
- clearer section headings and field grouping;
- stronger whitespace and vertical rhythm;
- CineTix purple for primary actions, focus states, and success accents;
- accessible contrast and visible keyboard focus.

Every existing payment field, validation rule, authentication check, amount calculation, booking payload, and error path remains functionally unchanged.

### Submission feedback

Payment submission remains a single guarded request. While it is pending:

- inputs and submission actions that could duplicate the payment are disabled;
- the page remains visible;
- the primary button uses compact inline progress text or an inline indicator;
- no page-level loading screen or loading circle appears.

## Payment Success

The Payment page no longer renders or navigates to a separate success page/state.

After the backend confirms booking and ticket creation:

1. Keep the Payment page visible.
2. Show a compact accessible modal/toast centered over the page.
3. Display a success icon and the text `Payment Successful`.
4. Keep the popup visible for 1.5 seconds.
5. Automatically navigate to `/ticket`, preserving any state the Tickets page currently requires.

The timeout is cleared if the component unmounts. Duplicate submission remains impossible during the success interval. Backend or validation failures never show the success popup.

## Frontend Performance

Optimization is evidence-based and limited to the booking path:

- create a stable canonical show identity for availability requests;
- prevent duplicate initial fetches for an unchanged show;
- cancel or ignore stale request results after identity changes;
- memoize the booked-seat lookup and derived seat view;
- keep seat components memoized with stable callbacks and primitive props;
- avoid storing duplicated derived seat objects in state;
- retain resolved data during non-blocking background refreshes;
- guard payment submission synchronously so rapid repeated clicks create one request;
- remove artificial delays and page-level loading branches from customer booking pages.

Existing realtime availability behavior remains the source of freshness after the initial request.

## Backend Performance

Seat availability remains database-authoritative.

For an availability request:

- normalize and validate the show identity once;
- query reservations by the indexed `showKey`;
- fetch only seat values rather than full reservation documents;
- return normalized unique booked seat IDs and the sold-out state;
- avoid population or unrelated ticket queries.

The existing unique compound index on `{ showKey: 1, seat: 1 }` continues to protect correctness and support show-scoped availability. The implementation must verify the relevant index definition and query shape in tests.

After successful booking, avoid redundant work where correctness permits. The response must still include the confirmed ticket and authoritative current availability. Any optimization must preserve transaction boundaries, conflict detection, idempotency, and realtime broadcasts.

## Error Handling

- Initial availability failure keeps all seat placeholders disabled and offers Retry.
- Background refresh failure keeps the last authoritative grid visible and exposes a non-blocking retry/error state.
- HTTP `409` seat conflicts return the customer to Seat Selection with refreshed availability and the conflicting seat IDs.
- Authentication failures retain the existing login redirect behavior.
- Payment validation, network, transaction, and server errors remain visible on Payment and never generate a ticket-success popup.
- Ticket creation is considered successful only after the backend confirms the booking response.

## Compatibility and Non-Goals

- Do not change admin or login pages.
- Do not remove normal UI animations.
- Do not use cached availability as seat authority.
- Do not change payment provider semantics, field meanings, price calculations, or authentication rules.
- Do not create a new payment-success route.
- Do not change ticket schema or booking concurrency guarantees unless a measured backend optimization requires a compatible internal query change.
- Do not perform unrelated visual or architectural refactors.

## Testing

### Frontend

Add or update tests for:

- immediate neutral seat placeholders before availability resolves;
- placeholders being disabled and not marked available;
- in-place transition to authoritative available/booked states;
- initial availability failure and Retry;
- no duplicate request for an unchanged show identity;
- selected-seat removal after an availability conflict;
- Payment page responsive content and preserved form behavior;
- one booking request despite repeated submission;
- success popup only after a confirmed booking;
- automatic `/ticket` navigation after 1.5 seconds;
- timeout cleanup on unmount;
- absence of the separate success screen.

### Backend

Add or update tests for:

- show-scoped availability returning only normalized seat data;
- availability query using a seat-only indexed shape;
- sold-out calculation;
- successful booking returning a ticket and current availability;
- duplicate idempotent submission;
- concurrent conflict behavior;
- no partial ticket or reservations after a failed transaction.

### End-to-end flow

Verify the complete customer path:

1. Open Seat Selection and observe neutral disabled placeholders.
2. Resolve authoritative availability and select only available seats.
3. Continue to Payment with the correct booking summary and total.
4. Submit once and create the booking/ticket.
5. See `Payment Successful` for 1.5 seconds.
6. Arrive at Tickets and see the generated ticket.

Run the full frontend test suite, frontend CI production build, and full backend test suite before integration.

## Acceptance Criteria

- Customer pages no longer use unnecessary page-level loading screens or loading circles.
- Admin and login loading behavior is unchanged.
- Seat geometry appears immediately without any unknown seat appearing available.
- The loading availability message is removed.
- Availability remains authoritative, retryable, and conflict-safe.
- Payment matches the Home page maximum width and is clean and responsive.
- Payment behavior and calculations remain intact.
- Successful payment uses a 1.5-second popup and redirects directly to Tickets.
- No separate payment-success page/state is used.
- Duplicate API calls, unnecessary renders, and avoidable database work in the booking path are reduced.
- Seat selection, payment, ticket creation, and ticket display pass automated and flow verification without errors.
