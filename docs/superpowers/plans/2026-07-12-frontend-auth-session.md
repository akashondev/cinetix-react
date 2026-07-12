# Frontend Authentication Session Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the logged-out account icon usable and recover payment attempts cleanly from invalid JWT sessions.

**Architecture:** Navbar routes logged-out account clicks directly to login while preserving its authenticated menu. A small authentication-session utility centralizes localStorage cleanup and logout notification; PaymentPage invokes it for both 401 and 403 responses.

**Tech Stack:** React 19, React Router 6, Jest, React Testing Library

## Global Constraints

- Do not change unrelated UI, booking payloads, payment calculations, seat selection, or backend logic.
- Preserve the existing logged-in account menu and logout behavior.
- Treat only HTTP 401 and 403 as invalid authentication sessions.

---

### Task 1: Logged-Out Account Navigation

**Files:**
- Modify: `cinetix-frontend/src/Component/Navbar.test.jsx`
- Modify: `cinetix-frontend/src/Component/Navbar.jsx`

**Interfaces:**
- Consumes: Navbar authentication state and React Router `useNavigate()`
- Produces: an enabled logged-out account button that navigates to `/login`

- [ ] **Step 1: Write a failing Navbar test**

Replace the disabled-control test with an assertion that the button named `Sign in` is enabled and that clicking it calls `navigate("/login")` without opening the account menu.

- [ ] **Step 2: Run the Navbar test and verify RED**

Run: `npm test -- --watchAll=false --runInBand --runTestsByPath src/Component/Navbar.test.jsx`

Expected: FAIL because the current logged-out button is disabled and never navigates.

- [ ] **Step 3: Implement logged-out navigation**

Import `useNavigate`, initialize `navigate`, and change `toggleAccountMenu`:

```js
if (!isLoggedIn) {
  navigate("/login");
  return;
}
```

Remove `disabled` and `aria-disabled`. Use `aria-label={isLoggedIn ? "Open account menu" : "Sign in"}` and a normal hover style in both states.

- [ ] **Step 4: Run the Navbar test and verify GREEN**

Run the focused command from Step 2.

Expected: both logged-out navigation and logged-in menu/logout tests pass.

---

### Task 2: Invalid Payment Session Recovery

**Files:**
- Create: `cinetix-frontend/src/api/authSession.js`
- Create: `cinetix-frontend/src/api/authSession.test.js`
- Modify: `cinetix-frontend/src/Component/PaymentPage.jsx`

**Interfaces:**
- Produces: `isInvalidSessionStatus(status: number): boolean`
- Produces: `clearUserSession(): void`
- Consumes: HTTP response status in PaymentPage

- [ ] **Step 1: Write failing session utility tests**

Test that `isInvalidSessionStatus` returns true for 401 and 403 and false for 400, 409, and 500. Seed `token`, `isLoggedIn`, `userName`, and `userEmail`; listen for `user-logout`; call `clearUserSession`; assert all keys are removed and one event fires.

- [ ] **Step 2: Run the utility tests and verify RED**

Run: `npm test -- --watchAll=false --runInBand --runTestsByPath src/api/authSession.test.js`

Expected: FAIL because `authSession.js` does not exist.

- [ ] **Step 3: Implement the session utility**

Create:

```js
export const isInvalidSessionStatus = (status) => status === 401 || status === 403;

export function clearUserSession() {
  ["token", "isLoggedIn", "userName", "userEmail"].forEach((key) => localStorage.removeItem(key));
  window.dispatchEvent(new Event("user-logout"));
}
```

- [ ] **Step 4: Integrate PaymentPage**

Import both helpers. Replace the 401-only block with `isInvalidSessionStatus(response.status)`, call `clearUserSession()`, preserve the existing alert and `/login` navigation, and return before generic error handling.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npm test -- --watchAll=false --runInBand --runTestsByPath src/api/authSession.test.js src/Component/Navbar.test.jsx src/api/bookingApi.test.js`

Expected: all session, Navbar, and booking API tests pass.

---

### Task 3: Full Frontend Verification

**Files:**
- Verify: all frontend source and test files

**Interfaces:**
- Consumes: Tasks 1 and 2
- Produces: verified frontend test suite and production build

- [ ] **Step 1: Run all frontend tests**

Run: `npm test -- --watchAll=false --runInBand`

Expected: exit code 0 with no failed suites.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: exit code 0 and `Compiled successfully.`

- [ ] **Step 3: Review scoped diffs**

Run `git diff --check` and review only Navbar, PaymentPage, the session utility, and their tests. Preserve all pre-existing frontend changes.
