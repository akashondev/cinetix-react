# Premium Login and Navbar Design

## Goal

Redesign the CineTix login experience and shared navbar to feel clean, modern, responsive, and premium while preserving the current black, white, gray, and indigo brand palette and all existing authentication behavior.

## Login page

The login page will use the shared `Navbar` and `Footer` so branding and navigation remain consistent across the application. Its main content will be a restrained off-white canvas with one centered authentication card.

The card will include:

- a concise heading and supporting line;
- a compact segmented Login/Sign Up control;
- accessible labeled inputs with relevant Lucide icons;
- password visibility controls;
- the existing inline validation and backend requests;
- one clear indigo primary action;
- a short account-mode prompt beneath the form.

The spinning gradient decoration, fake Google and Email buttons, divider, duplicated local navbar, and duplicated local footer will be removed. Registration remains available inside the same card and retains password confirmation and current validation.

The card will enter with a 250ms opacity and vertical-position transition. Buttons may use subtle hover lift and tap compression. Motion will respect `prefers-reduced-motion`, and no animation will block rendering or navigation.

## Navbar

Desktop navigation will use `NavLink` so Home, Movies, Theaters, and Offers can expose a subtle active state. Each link will have:

- improved horizontal spacing and typography;
- a low-cost color transition;
- a thin indigo underline that scales horizontally over 200–250ms;
- a persistent understated underline for the active route.

The CineTix wordmark remains text-based and lightweight. The mobile menu retains the same destinations, uses matching active states, and closes after selection.

When logged out, the right side displays a labeled `Login` button. When logged in, it displays a compact initials avatar derived from the stored user name or email. The avatar has restrained hover/tap feedback and opens a modern dropdown containing:

- a non-clickable identity header with the user name and email;
- `My Bookings`, linked to `/ticket`;
- `Logout`, using the existing revocation and local cleanup flow.

No Profile or Settings page or placeholder link will be created.

The dropdown will use `AnimatePresence` for a 200ms opacity/position transition. Existing click-outside and Escape-key behavior remains. Mobile navigation will show the same login or account actions without duplicating desktop state logic.

## Authentication state

Navbar authentication state remains based on the current local-storage keys. Login will dispatch a `user-login` browser event after credentials are stored; logout already dispatches `user-logout`. Navbar will listen for storage, login, and logout events through one stable effect.

Existing persistent refresh-session behavior remains unchanged. Login and registration request payloads, response handling, validation messages, redirect destination, and logout revocation endpoint remain intact.

Redirect timers created by the login page will be cleared on unmount.

## Components and boundaries

- `LoginPage.jsx` owns login/signup state, validation, API calls, and the authentication card.
- `Navbar.jsx` owns responsive navigation and account-menu presentation.
- `LogoutButton.jsx` remains the single logout action implementation.
- No backend changes or new routes are required.
- The recently added centralized scroll-to-top behavior remains unchanged.

## Performance and accessibility

- Framer Motion transitions remain between 200ms and 300ms.
- Only the authentication card, primary controls, avatar, dropdown, and mobile menu use motion.
- No looping, blur-heavy, or layout-intensive animation is introduced.
- Reduced-motion users receive immediate state changes.
- Inputs have programmatic labels, icon-only buttons have accessible names, menus retain roles, and focus rings remain visible.
- Derived avatar initials and navigation definitions remain cheap and deterministic.

## Testing

Focused tests will verify:

- the minimal login structure and removal of decorative/social controls;
- login and sign-up mode switching;
- persistent refresh credentials after login;
- redirect timeout cleanup;
- logged-out navbar displays a labeled Login action;
- logged-in navbar displays initials and opens the account dropdown;
- My Bookings links to `/ticket`;
- logout clears and revokes the session;
- active desktop navigation exposes the current-page indicator.

The safe frontend suite and production build will be rerun. `src/Component/BookingFlow.test.jsx` remains excluded per the prior instruction.
