# Ticket Lifecycle and Persistent Session Design

## Goal

Keep users signed in until they explicitly log out, prevent payment from failing when a short-lived access token expires, and make ticket history useful by showing newest purchases first, allowing expired tickets to be removed, and automatically removing tickets from customer-facing lists two days after the show.

## Approved behavior

- Access-token expiry must not force a logged-in user back to login while booking or paying.
- A server-backed refresh session remains valid until explicit logout.
- Logout revokes the refresh session and clears all browser authentication state.
- Tickets are returned and rendered newest purchase first.
- A ticket becomes manually removable after its showtime has passed.
- A ticket automatically disappears from ticket lists two calendar days after its show date.
- Manual removal and automatic disappearance hide a ticket from customer-facing history; they do not erase the booking/payment audit record.
- Existing pre-show cancellation and seat-release behavior remains unchanged.
- `src/Component/BookingFlow.test.jsx` remains skipped and must not be run during this task.

## Authentication architecture

Login creates two credentials:

1. A short-lived JWT access token used by authenticated API requests.
2. A cryptographically random refresh token whose SHA-256 hash is stored in a `UserSession` collection.

The raw refresh token is returned once and stored alongside the current frontend login state. A shared authenticated-request helper retries an API request once after a 401 or 403 response by exchanging the refresh token for a new access token. Concurrent refresh attempts share one in-flight promise.

The refresh session has no automatic expiry because the requested behavior is “until explicitly logged out.” Logout calls the backend revocation endpoint and clears the access token, refresh token, and existing login keys locally even if revocation cannot reach the server.

This keeps JWTs short-lived while making normal sessions persistent and revocable. It is safer than issuing a JWT that remains valid forever.

## Ticket lifecycle architecture

The backend remains the authority for visibility:

- `GET /api/tickets` filters out tickets manually hidden by the owner.
- It also filters out tickets whose show date is older than the two-day visibility window.
- It continues sorting by `createdAt: -1`.

The ticket model gains a nullable `hiddenByUserAt` audit field. A dedicated history-removal endpoint validates ownership and show expiry, then sets that timestamp. It does not reuse the cancellation endpoint because cancellation changes reservation availability and must remain a separate pre-show operation.

The frontend also sorts the response by `createdAt` before grouping, so display order remains deterministic even with older or mocked APIs. An expired group exposes a Delete action. A successful delete removes the group immediately from local state and reports failures inline.

## Time rules

- Manual deletion is enabled when the parsed show date and showtime are earlier than the current time.
- Automatic list removal is based on the show’s calendar date plus two days, matching the approved “two days after the show date” wording.
- Invalid legacy dates are retained rather than accidentally hidden.

## Error handling

- Refresh is attempted only once per authenticated request.
- A failed refresh clears session state and surfaces the existing session/login path.
- Ticket deletion rejects invalid IDs, tickets owned by another user, and shows that have not yet passed.
- UI deletion is disabled while its request is in flight and an error leaves the ticket visible.

## Verification

- Backend route tests cover login session creation, refresh, logout revocation, ticket filtering/sorting, and expired-ticket hiding.
- Frontend tests cover access-token refresh and retry, persistent login storage/logout cleanup, newest-first ticket rendering, expired Delete behavior, and deletion errors.
- Run all safe frontend tests while explicitly excluding `src/Component/BookingFlow.test.jsx`.
- Run the complete backend test suite and the frontend production build.

