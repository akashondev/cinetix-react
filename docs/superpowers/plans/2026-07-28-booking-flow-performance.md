# Booking Flow Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove customer-facing loading circles, make authoritative seat availability feel immediate, modernize Payment, replace its success screen with a 1.5-second popup, and preserve the complete seat-to-ticket flow.

**Architecture:** Keep the existing React/Express/Mongoose booking architecture and improve only the customer booking path. The frontend renders stable page geometry with local skeletons while authoritative requests run, and the backend reduces reservation and ticket query payloads without weakening transactions, uniqueness, idempotency, or realtime updates.

**Tech Stack:** React 19, React Router 6, React Testing Library/Jest, Tailwind CSS, Express 4, Mongoose 7, Socket.IO, Supertest/Jest.

## Global Constraints

- Apply loading changes only to customer-facing pages; do not modify Admin or Login loading behavior.
- Keep normal page transitions, hover effects, and interaction animations.
- Never display an unresolved seat as available.
- Do not use cached seat availability as authority.
- Preserve payment fields, validation, totals, authentication, booking payload semantics, transaction behavior, and ticket generation.
- Show `Payment Successful` for exactly 1.5 seconds, then navigate directly to `/ticket`.
- Do not add a payment-success route or separate success page.
- Preserve the unique `{ showKey: 1, seat: 1 }` reservation constraint.

---

## File Structure

### Backend repository: `D:\cinetext\cinetix-backend`

- Modify `services/bookingService.js`: use a seat-only availability query and retain authoritative booking responses.
- Modify `test/bookingService.test.js`: verify the optimized query, sold-out calculation, idempotency, and booking response.
- Modify `app.js`: return lean ticket documents without unused population and remove diagnostic logging.
- Modify `test/bookingRoutes.test.js`: verify ticket-list response and route behavior.

### Frontend repository: `D:\cinetext\cinetix-frontend`

- Modify `src/hooks/useSeatAvailability.js`: stabilize show identity, abort stale requests, and avoid the duplicate fetch on initial socket connection.
- Create `src/hooks/useSeatAvailability.test.jsx`: exercise initial fetch, stable rerender, stale request, retry, and reconnect behavior.
- Modify `src/Component/Seat.jsx`: add a neutral disabled placeholder state.
- Modify `src/Component/SeatSelectionPage.jsx`: always render the seat layout, replace blocking status UI, and keep background refresh non-blocking.
- Modify `src/Component/SeatSelectionPage.test.jsx`: verify safe placeholder and resolved/error states.
- Modify `src/Component/HomePage.jsx`: replace movie-section loading circles with card skeletons.
- Modify `src/Component/HomePage.test.jsx`: verify skeletons and removal after data resolves.
- Modify `src/Component/MovieDetailPage.jsx`: replace the full-screen circle with a page-shaped skeleton and remove the small theater circle while retaining theater skeletons.
- Modify `src/Component/MovieDetailPage.test.jsx`: verify immediate structure and resolved content.
- Modify `src/Component/TicketPage.jsx`: replace the full-screen circle with a ticket-page skeleton.
- Create `src/Component/TicketPage.test.jsx`: verify skeleton and ticket rendering.
- Modify `src/api/bookingApi.js`: use the existing booking request helper from Payment.
- Modify `src/api/bookingApi.test.js`: verify booking payload normalization and response handling.
- Modify `src/Component/PaymentPage.jsx`: modernize layout, remove invalid-context circle, use `createBooking`, and render the timed success popup.
- Create `src/Component/PaymentPage.test.jsx`: verify preserved payment behavior, duplicate-submit protection, popup, timer, conflict, and redirect.
- Create `src/Component/BookingFlow.test.jsx`: verify Seat Selection → Payment → success popup → Tickets using mocked network boundaries.

---

### Task 1: Optimize Backend Availability and Ticket Queries

**Files:**
- Modify: `D:\cinetext\cinetix-backend\services\bookingService.js`
- Modify: `D:\cinetext\cinetix-backend\test\bookingService.test.js`
- Modify: `D:\cinetext\cinetix-backend\app.js`
- Modify: `D:\cinetext\cinetix-backend\test\bookingRoutes.test.js`

**Interfaces:**
- Consumes: `normalizeShowIdentity(identity)`, the unique reservation index, and the existing booking/ticket HTTP contracts.
- Produces: unchanged availability shape `{ show, bookedSeats, totalSeats, availableCount, soldOut, updatedAt }` with a seat-only query; unchanged ticket route JSON.

- [ ] **Step 1: Write the failing availability query test**

Replace the `SeatReservation.find` expectation with a distinct-seat expectation:

```js
test("availability reads only distinct seats for one indexed show", async () => {
  SeatReservation.distinct.mockResolvedValue(["A2", "A1", "A2"]);
  const service = createBookingService({
    TicketModel: Ticket,
    ReservationModel: SeatReservation,
  });

  const result = await service.getAvailability(identity);

  expect(SeatReservation.distinct).toHaveBeenCalledWith("seat", {
    showKey: result.show.showKey,
  });
  expect(result.bookedSeats).toEqual(["A1", "A2"]);
  expect(result.availableCount).toBe(78);
  expect(result.soldOut).toBe(false);
});
```

Update the model mock to:

```js
jest.mock("../models/SeatReservation", () => ({
  distinct: jest.fn(),
  insertMany: jest.fn(),
}));
```

- [ ] **Step 2: Run the focused backend test and verify RED**

Run:

```powershell
npm test -- --runTestsByPath test/bookingService.test.js
```

Expected: FAIL because `getAvailability` still calls `find(...).lean()`.

- [ ] **Step 3: Implement the seat-only availability query**

Use:

```js
const reservedSeats = await ReservationModel.distinct("seat", {
  showKey: show.showKey,
});
const bookedSeats = [...new Set(reservedSeats)]
  .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
```

Keep the response shape and sold-out calculation unchanged.

- [ ] **Step 4: Add booking success and idempotency assertions**

Add tests that make the transaction insert seats, return a ticket, then resolve one distinct availability query:

```js
expect(result).toMatchObject({
  idempotent: false,
  ticket: expect.objectContaining({ _id: "ticket-1" }),
  availability: expect.objectContaining({ bookedSeats: ["A1"] }),
});
expect(ReservationModel.insertMany).toHaveBeenCalledTimes(1);
```

For repeated `session_id`, assert `idempotent: true` and no session/insert call.

- [ ] **Step 5: Write the failing lean ticket-list route test**

Mock the Mongoose chain:

```js
Ticket.find.mockReturnValue({
  sort: jest.fn().mockReturnValue({
    lean: jest.fn().mockResolvedValue([{ _id: "ticket-1", movie_title: "Movie" }]),
  }),
});
```

Assert `GET /api/tickets` returns the array without calling `populate`.

- [ ] **Step 6: Implement the lean ticket query**

Change the ticket read to:

```js
const tickets = await Ticket.find({ user: req.user.id })
  .sort({ createdAt: -1 })
  .lean();
```

Remove `console.log("running")`, remove `.populate("movie_id")`, and keep the existing success/error response contract.

- [ ] **Step 7: Run backend tests**

Run:

```powershell
npm test
```

Expected: all backend suites pass with zero failures.

- [ ] **Step 8: Commit the backend optimization**

```powershell
git add services/bookingService.js test/bookingService.test.js app.js test/bookingRoutes.test.js
git commit -m "perf: reduce booking query overhead"
```

---

### Task 2: Deduplicate and Cancel Seat Availability Requests

**Files:**
- Create: `src/hooks/useSeatAvailability.test.jsx`
- Modify: `src/hooks/useSeatAvailability.js`

**Interfaces:**
- Consumes: `fetchAvailability(identity, { signal })` and Socket.IO show rooms.
- Produces: the unchanged hook result `{ availability, bookedSeats, loading, refreshing, error, refetch }`.

- [ ] **Step 1: Write a hook harness and failing initial-fetch test**

Create:

```jsx
function Harness({ identity }) {
  const state = useSeatAvailability(identity);
  return (
    <>
      <output data-testid="loading">{String(state.loading)}</output>
      <output data-testid="seats">{state.bookedSeats.join(",")}</output>
      <button onClick={() => state.refetch().catch(() => {})}>Retry</button>
    </>
  );
}
```

Mock `fetchAvailability` and `socket.io-client`. Assert:

```js
expect(fetchAvailability).toHaveBeenCalledTimes(1);
rerender(<Harness identity={{ ...identity }} />);
expect(fetchAvailability).toHaveBeenCalledTimes(1);
```

This requires equal show identities not to trigger duplicate requests.

- [ ] **Step 2: Run the hook test and verify RED**

Run:

```powershell
$env:CI='true'; npm test -- --watchAll=false --runInBand src/hooks/useSeatAvailability.test.jsx
```

Expected: FAIL because a new object identity recreates `refetch` and the effect.

- [ ] **Step 3: Implement a canonical identity key and stale-request cancellation**

Derive:

```js
const identityKey = [
  identity?.movieId,
  identity?.cinema,
  identity?.screen,
  identity?.date,
  identity?.time,
].map((value) => String(value || "")).join("|");
```

Store the latest identity in a ref, create an `AbortController` for each request, pass its signal to `fetchAvailability`, abort the previous request, and ignore `AbortError` without showing an error.

Depend effects and callbacks on `identityKey`, not the identity object reference.

- [ ] **Step 4: Write reconnect and retry tests**

Assert initial Socket.IO `connect` does not immediately produce a second fetch. Simulate the manager reconnect event and assert one background refresh. Reject the first request, click Retry, resolve the second, and assert the error clears.

- [ ] **Step 5: Implement reconnect-only refresh**

Join the show room after initial availability. Subscribe to:

```js
socket.io.on("reconnect", onRefresh);
```

Do not subscribe the refresh callback to the socket's initial `connect` event. Unsubscribe from manager and window listeners during cleanup.

- [ ] **Step 6: Run hook and booking API tests**

Run:

```powershell
$env:CI='true'; npm test -- --watchAll=false --runInBand src/hooks/useSeatAvailability.test.jsx src/api/bookingApi.test.js
```

Expected: all focused tests pass.

- [ ] **Step 7: Commit the request lifecycle change**

```powershell
git add src/hooks/useSeatAvailability.js src/hooks/useSeatAvailability.test.jsx
git commit -m "perf: stabilize seat availability requests"
```

---

### Task 3: Render Safe Seat Placeholders Immediately

**Files:**
- Modify: `src/Component/Seat.jsx`
- Modify: `src/Component/SeatSelectionPage.jsx`
- Modify: `src/Component/SeatSelectionPage.test.jsx`

**Interfaces:**
- Consumes: hook `loading`, `error`, `bookedSeats`, and resolved availability.
- Produces: `Seat` with new Boolean prop `placeholder`; unresolved seats remain disabled and use `data-seat-state="placeholder"`.

- [ ] **Step 1: Replace the old loading assertion with a failing placeholder test**

Add:

```jsx
test("renders the full neutral disabled seat map while availability loads", () => {
  mockAvailabilityState = {
    ...mockAvailabilityState,
    availability: null,
    bookedSeats: [],
    loading: true,
  };

  renderPage();

  expect(screen.queryByText("Loading current seat availability...")).not.toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Seat map" })).toBeInTheDocument();
  const seat = screen.getByRole("button", { name: "Seat A1, checking availability" });
  expect(seat).toBeDisabled();
  expect(seat).toHaveAttribute("data-seat-state", "placeholder");
  expect(document.querySelectorAll('[data-seat-state="placeholder"]')).toHaveLength(80);
});
```

- [ ] **Step 2: Run Seat Selection tests and verify RED**

Run:

```powershell
$env:CI='true'; npm test -- --watchAll=false --runInBand src/Component/SeatSelectionPage.test.jsx
```

Expected: FAIL because the page still renders a blocking loading region.

- [ ] **Step 3: Add the Seat placeholder state**

Compute state in this order:

```js
const state = placeholder
  ? "placeholder"
  : booked
    ? "booked"
    : selected
      ? "selected"
      : "available";
```

Use neutral styling:

```js
placeholder:
  "cursor-wait border-gray-200 bg-gray-100 text-transparent animate-pulse",
```

Set `disabled={placeholder || booked}`, label unresolved seats as `Seat ${id}, checking availability`, and suppress hover/tap motion for placeholders.

- [ ] **Step 4: Always render the seat-map layout**

Remove the standalone `loading` section. Render the grid for loading, error, and resolved states.

Pass:

```jsx
<Seat
  id={seat}
  placeholder={loading || (!availability && Boolean(error))}
  booked={!loading && booked.has(seat)}
  selected={!loading && selectedSeats.includes(seat)}
  onClick={toggleSeat}
  reduceMotion={reduceMotion}
/>
```

Place the compact error and Retry button inside the seat-map card above the grid. Remove the `RefreshCw` spinning icon and use non-blocking text such as `Checking for seat updates…` during refresh.

- [ ] **Step 5: Add resolved, failure, and background-refresh tests**

Verify:

- resolved A1 is available and A2 is booked;
- initial error leaves all 80 seats in placeholder state and Retry works;
- background refresh keeps previously resolved available/booked states;
- Proceed remains disabled during unresolved/error/sold-out states.

- [ ] **Step 6: Run Seat Selection tests**

Run:

```powershell
$env:CI='true'; npm test -- --watchAll=false --runInBand src/Component/SeatSelectionPage.test.jsx
```

Expected: all Seat Selection tests pass.

- [ ] **Step 7: Commit safe immediate seat rendering**

```powershell
git add src/Component/Seat.jsx src/Component/SeatSelectionPage.jsx src/Component/SeatSelectionPage.test.jsx
git commit -m "feat: show safe seat availability placeholders"
```

---

### Task 4: Replace Remaining Customer Loading Circles

**Files:**
- Modify: `src/Component/HomePage.jsx`
- Modify: `src/Component/HomePage.test.jsx`
- Modify: `src/Component/MovieDetailPage.jsx`
- Modify: `src/Component/MovieDetailPage.test.jsx`
- Modify: `src/Component/TicketPage.jsx`
- Create: `src/Component/TicketPage.test.jsx`

**Interfaces:**
- Consumes: existing page `loading` values.
- Produces: local skeletons marked with `role="status"` and descriptive labels; no customer `.animate-spin` elements.

- [ ] **Step 1: Write failing Home skeleton assertions**

Hold the movies promise unresolved and assert:

```js
expect(screen.getByRole("status", { name: "Loading Now Showing" })).toBeInTheDocument();
expect(screen.getAllByTestId("movie-card-skeleton")).toHaveLength(8);
expect(document.querySelector(".animate-spin")).not.toBeInTheDocument();
```

Resolve the promise and assert skeletons disappear and movie cards render.

- [ ] **Step 2: Implement Home movie-card skeletons**

Replace each section circle with four local card placeholders per section using `animate-pulse`, fixed poster aspect ratio, and title/button bars. Keep the hero, navigation, promotion, and features visible while movies load.

- [ ] **Step 3: Write failing Movie Detail skeleton assertion**

Before the movie request resolves, assert Navbar/page structure and:

```js
expect(screen.getByRole("status", { name: "Loading movie details" })).toBeInTheDocument();
expect(document.querySelector(".animate-spin")).not.toBeInTheDocument();
```

- [ ] **Step 4: Implement the Movie Detail skeleton**

Replace the `h-screen` circle return with a dark page-shaped skeleton containing hero, title, metadata, poster, and showtime-card blocks. Keep `Navbar` mounted. Remove the small theater spinner next to `Select Theater`; retain the existing theater card skeletons during the unavoidable theater transition.

- [ ] **Step 5: Write Ticket loading tests**

Mock the ticket request with an unresolved promise and assert:

```js
expect(screen.getByRole("status", { name: "Loading your tickets" })).toBeInTheDocument();
expect(screen.getByText("Your Tickets")).toBeInTheDocument();
expect(document.querySelector(".animate-spin")).not.toBeInTheDocument();
```

Resolve with a ticket array and assert the generated ticket and booking ID render.

- [ ] **Step 6: Implement the Ticket skeleton**

Keep Navbar, Footer, the `max-w-7xl` heading container, and action/content card geometry mounted. While loading, render two `animate-pulse` ticket card placeholders instead of returning a full-screen circle.

- [ ] **Step 7: Run customer page tests**

Run:

```powershell
$env:CI='true'; npm test -- --watchAll=false --runInBand src/Component/HomePage.test.jsx src/Component/MovieDetailPage.test.jsx src/Component/TicketPage.test.jsx
```

Expected: all focused tests pass and no customer loading-circle assertion fails.

- [ ] **Step 8: Commit customer skeletons**

```powershell
git add src/Component/HomePage.jsx src/Component/HomePage.test.jsx src/Component/MovieDetailPage.jsx src/Component/MovieDetailPage.test.jsx src/Component/TicketPage.jsx src/Component/TicketPage.test.jsx
git commit -m "feat: replace customer loading circles with skeletons"
```

---

### Task 5: Modernize Payment and Use a Timed Success Popup

**Files:**
- Modify: `src/api/bookingApi.js`
- Modify: `src/api/bookingApi.test.js`
- Modify: `src/Component/PaymentPage.jsx`
- Create: `src/Component/PaymentPage.test.jsx`

**Interfaces:**
- Consumes: `createBooking(payload, token)`, current location/local-storage booking context, and current validation rules.
- Produces: the existing booking payload; accessible `role="dialog"` popup named `Payment Successful`; `/ticket` navigation after 1500 ms.

- [ ] **Step 1: Add the failing booking API helper test**

Add:

```js
test("creates one normalized booking request", async () => {
  fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, data: { _id: "ticket-1" } }),
  });

  await createBooking(
    { movie_id: "movie", date: "2026-07-28T00:00:00.000Z", seats: ["A1"] },
    "token"
  );

  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining("/tickets"),
    expect.objectContaining({
      method: "POST",
      body: expect.stringContaining('"date":"2026-07-28"'),
    })
  );
});
```

- [ ] **Step 2: Write failing Payment behavior tests**

Create a helper that seeds valid booking context and token, renders Payment in `MemoryRouter`, and fills:

- Card Number: `4242 4242 4242 4242`
- Cardholder Name: `Akash Kumar`
- Expiry: a deterministic future `MM/YY`
- CVV: `123`
- Email: `akash@example.com`

Tests must assert:

```js
expect(screen.getByRole("main")).toHaveClass("max-w-7xl");
await userEvent.dblClick(screen.getByRole("button", { name: /pay ₹/i }));
expect(createBooking).toHaveBeenCalledTimes(1);
expect(await screen.findByRole("dialog", { name: "Payment Successful" })).toBeInTheDocument();
expect(screen.getByRole("heading", { name: "Payment Details" })).toBeInTheDocument();
```

With fake timers:

```js
act(() => jest.advanceTimersByTime(1499));
expect(mockNavigate).not.toHaveBeenCalledWith("/ticket", expect.anything());
act(() => jest.advanceTimersByTime(1));
expect(mockNavigate).toHaveBeenCalledWith("/ticket", {
  state: expect.objectContaining({ justCompleted: true }),
});
```

- [ ] **Step 3: Run Payment tests and verify RED**

Run:

```powershell
$env:CI='true'; npm test -- --watchAll=false --runInBand src/api/bookingApi.test.js src/Component/PaymentPage.test.jsx
```

Expected: Payment tests fail because the current page uses direct `fetch`, a separate success screen, and a 2000 ms timeout.

- [ ] **Step 4: Refactor Payment submission through `createBooking`**

Import:

```js
import {
  BookingApiError,
  createBooking,
  normalizeCalendarDate,
} from "../api/bookingApi";
```

Replace the nested direct-fetch block with one `await createBooking(ticketData, token)`. Handle `BookingApiError.status` for authentication and `409`, preserve the current redirect/error messages, and leave `processingRef.current` true through the success interval.

Store the confirmed server ticket ID exactly as before.

- [ ] **Step 5: Implement the modern responsive layout**

Use:

```jsx
<main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
```

Use `lg:grid-cols-[minmax(0,1fr)_22rem]`, a primary form card with `rounded-2xl border border-gray-200 bg-white shadow-sm`, and a summary card with `lg:sticky lg:top-24`.

Keep all five fields, current inline validation, ticket/service-fee calculations, and button text. Disable fields and submit while `isProcessing`.

If required booking context is absent, show a compact booking-context error with a `Back to movies` action; do not show a loading circle.

- [ ] **Step 6: Replace the success screen with an overlay popup**

Keep the Payment form mounted. When `isComplete` is true render:

```jsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4" role="presentation">
  <div
    role="dialog"
    aria-modal="true"
    aria-label="Payment Successful"
    className="w-full max-w-sm rounded-2xl border border-green-100 bg-white p-6 text-center shadow-2xl"
  >
    <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" aria-hidden="true" />
    <p className="mt-3 text-lg font-bold text-gray-950">Payment Successful</p>
    <p className="mt-1 text-sm text-gray-600">Opening your tickets…</p>
  </div>
</div>
```

Create the redirect timeout in an effect:

```js
useEffect(() => {
  if (!isComplete || !confirmation) return undefined;
  const timer = window.setTimeout(() => {
    navigate("/ticket", {
      state: { bookingConfirmation: confirmation, justCompleted: true },
    });
  }, 1500);
  return () => window.clearTimeout(timer);
}, [confirmation, isComplete, navigate]);
```

- [ ] **Step 7: Add conflict, error, and unmount tests**

Assert a `409` returns to `/seats` with conflicts and never shows the dialog. Unmount during the success interval, advance timers, and assert no navigation. Assert payment errors leave the form usable and reset the synchronous submission guard.

- [ ] **Step 8: Run Payment tests**

Run:

```powershell
$env:CI='true'; npm test -- --watchAll=false --runInBand src/api/bookingApi.test.js src/Component/PaymentPage.test.jsx
```

Expected: all Payment and API helper tests pass.

- [ ] **Step 9: Commit Payment changes**

```powershell
git add src/api/bookingApi.js src/api/bookingApi.test.js src/Component/PaymentPage.jsx src/Component/PaymentPage.test.jsx
git commit -m "feat: modernize payment completion flow"
```

---

### Task 6: Verify the Complete Booking Flow and Performance Constraints

**Files:**
- Create: `src/Component/BookingFlow.test.jsx`
- Modify only if the integration test exposes a defect: files already listed in Tasks 1–5.

**Interfaces:**
- Consumes: `/seats`, `/payment`, `/ticket`, local booking context, mocked availability/booking/ticket network boundaries.
- Produces: one automated flow proving selection, payment, ticket creation, popup, redirect, and ticket display.

- [ ] **Step 1: Write the booking-flow integration test**

Render Routes for Seat Selection, Payment, and a lightweight Tickets destination using real Seat Selection and Payment components. Mock availability as resolved, mock `createBooking` to return `{ _id: "ticket-1" }`, seed a valid token/movie/show, then:

```js
await userEvent.click(screen.getByRole("button", { name: "Seat A1" }));
await userEvent.click(screen.getByRole("button", { name: /proceed to payment/i }));
expect(await screen.findByRole("heading", { name: "Payment Details" })).toBeInTheDocument();
```

Fill the payment fields, submit, assert `createBooking` receives `seats: ["A1"]`, assert the success dialog, advance 1500 ms, and assert the Tickets destination receives `justCompleted: true` and the confirmation.

- [ ] **Step 2: Run the flow test and verify RED or integration gaps**

Run:

```powershell
$env:CI='true'; npm test -- --watchAll=false --runInBand src/Component/BookingFlow.test.jsx
```

Expected before final wiring: FAIL at any mismatched navigation/state boundary. Fix only the boundary exposed by the assertion.

- [ ] **Step 3: Run the frontend suite**

Run:

```powershell
$env:CI='true'; npm test -- --watchAll=false --runInBand
```

Expected: all frontend suites and tests pass.

- [ ] **Step 4: Run the frontend CI production build**

Run:

```powershell
$env:CI='true'; npm run build
```

Expected: `Compiled successfully` with exit code 0.

- [ ] **Step 5: Prove customer loading circles are gone and excluded pages were untouched**

Run:

```powershell
rg -n "animate-spin|Loading current seat availability" src/Component --glob '!Admin*.jsx' --glob '!LoginPage.jsx'
git diff 22491c5 -- src/Component/AdminLogin.jsx src/Component/AdminPage.jsx src/Component/LoginPage.jsx
```

Expected: the first command has no customer loading-circle/loading-message matches; the second command has no diff.

- [ ] **Step 6: Run the backend suite again**

From `D:\cinetext\cinetix-backend`:

```powershell
npm test
```

Expected: all backend suites and tests pass.

- [ ] **Step 7: Inspect both repository diffs**

Run in each repository:

```powershell
git status --short --branch
git diff --check
git log -6 --oneline
```

Expected: no unstaged implementation changes, no whitespace errors, and the task commits are present.

- [ ] **Step 8: Commit the booking-flow integration test**

```powershell
git add src/Component/BookingFlow.test.jsx
git commit -m "test: verify complete booking flow"
```

- [ ] **Step 9: Push only after explicit integration choice**

Push the frontend and backend `main` branches only after the user selects the integration option and fresh verification remains green.
