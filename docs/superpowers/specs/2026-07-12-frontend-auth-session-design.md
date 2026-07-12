# Frontend Authentication Session Design

## Goal

Make the logged-out account icon lead to login and recover cleanly when payment uses an expired or environment-mismatched JWT.

## Navbar Behavior

The account icon remains an interactive button in both authentication states. When logged in, clicking it opens and closes the existing account menu. When logged out, clicking it navigates to `/login`. The logged-out control uses an explicit sign-in accessible label and is not disabled. Existing menu content, layout, and mobile sign-in behavior remain unchanged.

## Invalid Payment Session Behavior

The payment ticket request already sends the user token as `Authorization: Bearer <token>`. Treat both HTTP 401 and HTTP 403 as invalid authentication because the backend uses 401 for a missing token and 403 for an expired, malformed, or differently signed token.

On either status, clear `token`, `isLoggedIn`, `userName`, and `userEmail`; dispatch the existing `user-logout` event so mounted navigation updates immediately; show the existing re-login notification; and navigate to `/login` while retaining the current payment path in router state. Do not change booking payloads, payment fields, backend JWT logic, or non-authentication error handling.

## Testing

Update Navbar regression tests to assert that the logged-out account icon is enabled and navigates to `/login`, while the logged-in menu and logout flow remain intact. Add focused payment-session coverage demonstrating that both 401 and 403 clear authentication and redirect, while other API errors continue through existing booking error handling.

## Scope

Only frontend authentication recovery and account-icon interaction change. No unrelated UI, payment calculation, booking, seat-selection, backend, or deployment behavior changes.
