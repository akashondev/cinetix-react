# Premium Login and Navbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a minimal premium authentication page and a polished responsive navbar with clear logged-out and logged-in states.

**Architecture:** Keep authentication requests and storage behavior in `LoginPage`, while the shared `Navbar` derives presentation from the existing browser session keys. Use Framer Motion only for short card, control, dropdown, and mobile-menu transitions, with reduced-motion fallbacks.

**Tech Stack:** React 19, React Router 6, Tailwind CSS 3, Framer Motion 12, Lucide React, Jest, React Testing Library.

## Global Constraints

- Preserve the existing black, white, gray, and `#5c6ac4` CineTix palette.
- Keep login, registration, persistent refresh sessions, logout revocation, and current routes functional.
- Do not create Profile or Settings pages.
- Keep motion between 200ms and 300ms and respect reduced-motion preferences.
- Do not run `src/Component/BookingFlow.test.jsx`.
- Preserve the centralized route scroll-to-top change already committed on `main`.

---

### Task 1: Refine Navbar Navigation and Account States

**Files:**
- Modify: `src/Component/Navbar.jsx`
- Modify: `src/Component/Navbar.test.jsx`

**Interfaces:**
- Consumes: `isLoggedIn`, `userName`, and `userEmail` local-storage keys plus `user-login`, `user-logout`, and `storage` events.
- Produces: logged-out `Login` link; logged-in initials avatar and menu with identity header, `/ticket` My Bookings link, and existing `LogoutButton`.

- [ ] **Step 1: Write failing logged-out and active-route assertions**

Render on `/movies` and assert:

```jsx
expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute(
  "href",
  "/login"
);
expect(screen.getByRole("link", { name: "Movies" })).toHaveAttribute(
  "aria-current",
  "page"
);
```

Assert the account-icon button named `Sign in` is absent.

- [ ] **Step 2: Write failing avatar dropdown assertions**

Seed Ava’s session, render the navbar, and assert:

```jsx
expect(screen.getByRole("button", { name: "Open account menu" }))
  .toHaveTextContent("A");
fireEvent.click(screen.getByRole("button", { name: "Open account menu" }));
expect(screen.getByRole("menuitem", { name: "My Bookings" }))
  .toHaveAttribute("href", "/ticket");
expect(screen.queryByRole("menuitem", { name: /profile|settings/i }))
  .not.toBeInTheDocument();
```

Keep the existing logout revocation assertions.

- [ ] **Step 3: Run Navbar tests and verify failure**

Run:

```powershell
$env:CI='true'; npm test -- --watchAll=false --runInBand src/Component/Navbar.test.jsx
```

Expected: FAIL because logged-out desktop state is icon-only, links lack active-route semantics, and the current menu label is Tickets.

- [ ] **Step 4: Implement shared navigation styles**

Replace desktop and mobile `Link` navigation items with `NavLink`. Use a shared function that returns:

```js
`group relative rounded-md px-1 py-2 text-sm font-medium transition-colors duration-200 ${
  isActive ? "text-white" : "text-white/65 hover:text-white"
}`
```

Render a bottom indigo line whose `scale-x-100` state follows `isActive` and whose hover state uses `group-hover:scale-x-100`.

- [ ] **Step 5: Implement Login button and avatar menu**

For logged-out desktop state, render a compact indigo-outline `Link` labeled Login. For logged-in state, derive up to two initials from the stored name, falling back to the email’s first character, and render them in a circular indigo avatar.

Use `motion.button`, `AnimatePresence`, and `motion.div` with 0.2-second opacity/y transitions. Use `useReducedMotion` to remove y offsets and tap scaling when requested. Rename Tickets to My Bookings and keep the identity header and logout action.

- [ ] **Step 6: Keep responsive state synchronized**

Listen for `user-login` in the same effect as `storage` and `user-logout`. Close account, search, and mobile menus after route/account actions. Render matching Login or avatar/account controls in the mobile menu without creating a second authentication state.

- [ ] **Step 7: Run Navbar tests**

Run the focused Navbar suite.

Expected: all tests pass.

- [ ] **Step 8: Commit the navbar refinement**

Commit `Navbar.jsx` and `Navbar.test.jsx` with:

```powershell
git commit -m "feat: refine navbar account experience"
```

---

### Task 2: Redesign the Login and Sign-Up Card

**Files:**
- Modify: `src/Component/LoginPage.jsx`
- Modify: `src/Component/LoginPage.test.jsx`

**Interfaces:**
- Consumes: unchanged `/users/login` and `/users/register` endpoints.
- Produces: unchanged local-storage authentication keys plus a new `user-login` event after successful login.

- [ ] **Step 1: Write failing minimal-structure assertions**

Render Login and assert:

```jsx
expect(screen.getByRole("navigation")).toBeInTheDocument();
expect(screen.getByRole("heading", { name: "Welcome back" }))
  .toBeInTheDocument();
expect(screen.getByLabelText("Email address")).toBeInTheDocument();
expect(screen.getByLabelText("Password")).toBeInTheDocument();
expect(screen.queryByText("Or continue with")).not.toBeInTheDocument();
expect(screen.queryByRole("button", { name: "Google" }))
  .not.toBeInTheDocument();
expect(document.querySelector('[class*="spin_4s"]')).not.toBeInTheDocument();
```

- [ ] **Step 2: Write failing mode, event, and timer-cleanup tests**

Click the Sign Up segment and assert Full name and Confirm password appear. Complete a successful login and assert `user-login` fires once while refresh credentials remain stored. Use fake timers, unmount before 1500ms, advance time, and assert navigation is not called.

- [ ] **Step 3: Run Login tests and verify failure**

Run:

```powershell
$env:CI='true'; npm test -- --watchAll=false --runInBand src/Component/LoginPage.test.jsx
```

Expected: FAIL because the old page has duplicate navigation/footer, decorative/social elements, inaccessible label associations, no login event, and an uncleared redirect timer.

- [ ] **Step 4: Implement the shared page shell**

Replace the local nav/footer with imported `Navbar` and `Footer`. Use a centered responsive main region:

```jsx
<main className="relative flex min-h-[calc(100vh-8rem)] flex-1 items-center justify-center overflow-hidden bg-gray-50 px-4 py-10 sm:px-6">
```

Add only two low-opacity static indigo background shapes, marked `aria-hidden`, with no looping animation.

- [ ] **Step 5: Build the premium authentication card**

Wrap the card in `motion.section` with a reduced-motion-aware 0.25-second fade/y entrance. Use `max-w-md`, `rounded-2xl`, a subtle border, `shadow-xl`, and generous responsive padding.

Build an accessible segmented control with `aria-pressed`. Give every input an `id` and matching `htmlFor`, render Mail, Lock, User, and Eye/EyeOff icons, and use visible focus rings. Remove the Remember me control, social buttons, and divider because the session is always persistent until logout.

- [ ] **Step 6: Preserve authentication behavior and clean timers**

Keep current validation and request payloads. After login, store all existing keys, dispatch:

```js
window.dispatchEvent(new Event("user-login"));
```

Store redirect timeout IDs in a ref and clear them during effect cleanup. Keep the 1500ms redirect and registration-to-login transition.

- [ ] **Step 7: Add restrained control motion**

Use `motion.button` for the primary submit and mode controls with 0.2-second transitions, `whileHover={{ y: -1 }}`, and `whileTap={{ scale: 0.985 }}` when reduced motion is off. Never animate input layout or error-message height.

- [ ] **Step 8: Run Login and Navbar tests**

Run:

```powershell
$env:CI='true'; npm test -- --watchAll=false --runInBand src/Component/LoginPage.test.jsx src/Component/Navbar.test.jsx
```

Expected: both suites pass.

- [ ] **Step 9: Commit the login redesign**

Commit `LoginPage.jsx` and `LoginPage.test.jsx` with:

```powershell
git commit -m "feat: redesign login experience"
```

---

### Task 3: Verify and Push

**Files:**
- Modify only if verification exposes a defect: files listed in Tasks 1–2.

**Interfaces:**
- Verifies the complete frontend without running the excluded booking-flow test.

- [ ] **Step 1: Run safe frontend tests**

Enumerate all `*.test.js` and `*.test.jsx` files under `src`, exclude `src/Component/BookingFlow.test.jsx`, and pass the remaining exact paths to Jest with `--watchAll=false --runInBand`.

Expected: every selected suite passes.

- [ ] **Step 2: Run the production build**

Run:

```powershell
$env:CI='true'; npm run build
```

Expected: `Compiled successfully` with no ESLint errors.

- [ ] **Step 3: Inspect repository state**

Run `git diff --check`, `git status --short --branch`, and `git log -8 --oneline`.

Expected: no whitespace errors, no uncommitted implementation files, and all redesign and earlier scroll commits are ahead of `origin/main`.

- [ ] **Step 4: Push frontend main**

Push `main` to `origin` and verify local `HEAD` equals `origin/main`. The prior scroll-to-top commits must be included in the same push.

- [ ] **Step 5: Report verification and exclusion**

Report test suite/test counts, production-build status, pushed commit, and that `src/Component/BookingFlow.test.jsx` was not run.
