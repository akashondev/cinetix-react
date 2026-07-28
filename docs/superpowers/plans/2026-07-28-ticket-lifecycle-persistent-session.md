# Ticket Lifecycle and Persistent Session Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep users signed in until logout and provide correctly ordered, expiring, removable ticket history.

**Architecture:** Add revocable opaque refresh sessions behind short-lived JWT access tokens and centralize authenticated frontend retries. Keep ticket audit records while filtering two-day-old shows and recording user-hidden expired tickets separately from cancellation.

**Tech Stack:** React 18, Jest, React Testing Library, Express, Mongoose, JSON Web Tokens, Node `crypto`.

## Global Constraints

- Keep all existing booking, payment, ticket generation, and cancellation behavior intact.
- Automatically hide a ticket from customer-facing lists two calendar days after its show date.
- Preserve hidden booking records for payment and booking audits.
- Do not run `src/Component/BookingFlow.test.jsx`.
- Work directly in the existing frontend and backend main folders.

---

### Task 1: Add Revocable Backend Sessions

**Files:**
- Create: `models/UserSession.js`
- Create: `services/userSessionService.js`
- Create: `test/userSessionRoutes.test.js`
- Modify: `app.js`

**Interfaces:**
- Produces: `POST /api/users/login` response containing `token` and `refreshToken`.
- Produces: `POST /api/users/session/refresh` accepting `{ refreshToken }`.
- Produces: `POST /api/users/session/logout` accepting `{ refreshToken }`.

- [ ] **Step 1: Write failing login, refresh, and logout route tests**

Mock `UserSession`, log in with valid credentials, and assert the response contains both credentials. Exchange the refresh credential and assert a new JWT is returned. Revoke the credential and assert the stored hash is deleted.

- [ ] **Step 2: Run the focused backend route test and verify failure**

Run `npm test -- --runInBand test/userSessionRoutes.test.js`.

Expected: FAIL because refresh sessions and endpoints do not exist.

- [ ] **Step 3: Implement hashed refresh sessions**

Create a service using `crypto.randomBytes(32).toString("hex")` for the raw token and SHA-256 for storage. Expose `createSession(userId)`, `refreshSession(rawToken)`, and `revokeSession(rawToken)`. Sign access tokens with a short expiry and never persist raw refresh tokens.

- [ ] **Step 4: Wire login, refresh, and logout routes**

Make login await `createSession`, add both session routes, return generic 401 errors for invalid refresh credentials, and keep existing user response fields.

- [ ] **Step 5: Run focused and full backend tests**

Run `npm test -- --runInBand test/userSessionRoutes.test.js`, then `npm test`.

Expected: all backend suites pass.

- [ ] **Step 6: Commit backend session support**

Commit `models/UserSession.js`, `services/userSessionService.js`, `test/userSessionRoutes.test.js`, and `app.js` with `feat: add persistent user sessions`.

---

### Task 2: Add Backend Ticket Visibility Rules

**Files:**
- Modify: `models/Ticket_data.js`
- Create: `services/ticketLifecycle.js`
- Modify: `app.js`
- Modify: `test/bookingRoutes.test.js`

**Interfaces:**
- Produces: `ticketVisibilityFilter(userId, now)` for list queries.
- Produces: `isShowExpired(ticket, now)` for manual history removal.
- Produces: `DELETE /api/tickets/:id/history`.

- [ ] **Step 1: Write failing lifecycle and route tests**

Assert the list query includes owner, `hiddenByUserAt: null`, and a show-date cutoff while retaining `.sort({ createdAt: -1 }).lean()`. Assert the history endpoint rejects future shows and sets `hiddenByUserAt` for an owner’s past show.

- [ ] **Step 2: Run focused backend tests and verify failure**

Run `npm test -- --runInBand test/bookingRoutes.test.js`.

Expected: FAIL because visibility filters and the history-removal endpoint are absent.

- [ ] **Step 3: Implement ticket lifecycle helpers**

Add pure UTC-safe helpers that calculate the start of the calendar day two days before `now`, parse supported showtime strings, retain invalid legacy dates, and determine whether showtime has passed.

- [ ] **Step 4: Implement filtered lists and history removal**

Add `hiddenByUserAt` to the schema. Filter the GET query with the lifecycle filter. Add `DELETE /api/tickets/:id/history`, validate the ObjectId and owner, reject non-expired shows with 409, and update only `hiddenByUserAt`.

- [ ] **Step 5: Run focused and full backend tests**

Run `npm test -- --runInBand test/bookingRoutes.test.js`, then `npm test`.

Expected: all suites pass, and cancellation tests remain unchanged.

- [ ] **Step 6: Commit ticket lifecycle support**

Commit the model, lifecycle service, route, and tests with `feat: manage expired ticket history`.

---

### Task 3: Refresh Frontend Authentication Transparently

**Files:**
- Create: `src/api/authenticatedFetch.js`
- Create: `src/api/authenticatedFetch.test.js`
- Modify: `src/api/authSession.js`
- Modify: `src/api/authSession.test.js`
- Modify: `src/api/bookingApi.js`
- Modify: `src/api/bookingApi.test.js`
- Modify: `src/Component/LoginPage.jsx`
- Modify: `src/Component/LogoutButton.jsx`

**Interfaces:**
- Produces: `authenticatedFetch(url, options)` that retries once after refresh.
- Produces: `revokeAndClearUserSession()` for explicit logout.
- Consumes: login response `refreshToken`.

- [ ] **Step 1: Write failing refresh, retry, and deduplication tests**

Mock an initial 403, a successful refresh response, and a successful retry. Assert the retry uses the new bearer token. Start two expired requests and assert they share one refresh call. Assert failed refresh clears authentication.

- [ ] **Step 2: Run focused frontend API tests and verify failure**

Run safe Jest commands targeting `src/api/authenticatedFetch.test.js`, `src/api/authSession.test.js`, and `src/api/bookingApi.test.js`.

Expected: FAIL because the shared authenticated request helper does not exist.

- [ ] **Step 3: Implement refresh and retry**

Store one module-level refresh promise, exchange `refreshToken`, update `token`, clone request options with the current bearer token, and retry only once. Clear all session keys when refresh cannot succeed.

- [ ] **Step 4: Integrate login, booking payment, and logout**

Persist `refreshToken` after login. Make booking creation use `authenticatedFetch`. On logout, call the revocation endpoint and always clear local session state. Do not alter admin authentication.

- [ ] **Step 5: Run focused frontend tests**

Run only the API, Login, Logout, and Payment tests; do not include `BookingFlow.test.jsx`.

Expected: all focused tests pass.

- [ ] **Step 6: Commit frontend persistent-session support**

Commit the API helpers, auth components, and tests with `feat: refresh user sessions until logout`.

---

### Task 4: Add Newest-First Expired Ticket Management UI

**Files:**
- Create: `src/utils/ticketLifecycle.js`
- Create: `src/utils/ticketLifecycle.test.js`
- Modify: `src/Component/TicketPage.jsx`
- Modify: `src/Component/TicketPage.test.jsx`

**Interfaces:**
- Produces: `sortTicketsNewestFirst(tickets)` and `hasShowPassed(ticket, now)`.
- Consumes: `authenticatedFetch`.
- Consumes: `DELETE /api/tickets/:id/history`.

- [ ] **Step 1: Write failing sorting, expiry, and deletion tests**

Use tickets returned oldest-first and assert newest titles render first. Use a past show and assert an accessible Delete button appears; click it, assert the history endpoint is called, and assert the ticket disappears. Verify future tickets have no Delete button and deletion errors retain the ticket.

- [ ] **Step 2: Run focused ticket tests and verify failure**

Run Jest for `src/utils/ticketLifecycle.test.js` and `src/Component/TicketPage.test.jsx`.

Expected: FAIL because lifecycle utilities and deletion controls are absent.

- [ ] **Step 3: Implement deterministic grouping and ordering**

Sort a copied ticket array by `createdAt` descending before grouping. Preserve the newest group insertion order and avoid mutating API data.

- [ ] **Step 4: Implement expired Delete controls**

Use `authenticatedFetch` for ticket reads and removal. Display Delete only after showtime, disable it while pending, remove all ticket IDs in the grouped booking after successful responses, and show an inline error on failure.

- [ ] **Step 5: Run focused ticket tests**

Run the lifecycle utility and Ticket page tests.

Expected: all focused tests pass.

- [ ] **Step 6: Commit the ticket UI**

Commit the utility, Ticket page, and tests with `feat: manage expired tickets`.

---

### Task 5: Safe Verification

**Files:**
- Modify only if verification exposes a defect: files listed in Tasks 1–4.

**Interfaces:**
- Verifies all new backend and frontend boundaries without executing the skipped integration test.

- [ ] **Step 1: Run all frontend suites except the skipped test**

Enumerate frontend test files, exclude `src/Component/BookingFlow.test.jsx`, and pass the remaining exact paths to Jest with `--watchAll=false --runInBand`.

Expected: all selected suites pass.

- [ ] **Step 2: Run the frontend production build**

Run `npm run build`.

Expected: compilation succeeds with no ESLint errors.

- [ ] **Step 3: Run the complete backend suite**

Run `npm test`.

Expected: all backend suites pass.

- [ ] **Step 4: Inspect repository state**

Run `git diff --check`, `git status --short --branch`, and recent logs in both repositories.

Expected: no whitespace errors and only intentional commits ahead of origin.

- [ ] **Step 5: Report the skipped test explicitly**

Final verification must say that `src/Component/BookingFlow.test.jsx` was not run, per the user’s earlier instruction.

