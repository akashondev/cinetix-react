# Route Scroll-to-Top Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every route navigation, including browser Back and Forward, render from the top of the document.

**Architecture:** Create a focused router-aware component that observes the active location key and resets the viewport in a layout effect. Mount it once inside `BrowserRouter`, before the route definitions.

**Tech Stack:** React 18, React Router 6, Jest, React Testing Library.

## Global Constraints

- Apply the behavior to every customer, login, and admin route.
- Use immediate scrolling with no smooth animation.
- Do not affect scrolling within the current route.
- Do not run `src/Component/BookingFlow.test.jsx`.

---

### Task 1: Add Central Route Scroll Restoration

**Files:**
- Create: `src/Component/ScrollToTop.jsx`
- Create: `src/Component/ScrollToTop.test.jsx`
- Modify: `src/App.js`

**Interfaces:**
- Consumes: `useLocation().key` from a parent React Router.
- Produces: a component that renders `null` and calls `window.scrollTo({ top: 0, left: 0, behavior: "auto" })` for each history entry.

- [ ] **Step 1: Write the failing navigation test**

Render a memory router with `ScrollToTop`, two routes, links between them, and a Back button using `navigate(-1)`. Mock `window.scrollTo`. Assert the initial entry scrolls to the top, clear the mock, navigate forward, assert one top reset, clear it again, navigate Back, and assert another top reset.

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```powershell
$env:CI='true'; npm test -- --watchAll=false --runInBand src/Component/ScrollToTop.test.jsx
```

Expected: FAIL because `ScrollToTop` does not exist.

- [ ] **Step 3: Implement the component**

Create:

```jsx
import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { key } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [key]);

  return null;
}
```

- [ ] **Step 4: Mount it once in the application router**

Import `ScrollToTop` in `src/App.js` and render `<ScrollToTop />` immediately inside `<Router>` and before `<Routes>`.

- [ ] **Step 5: Run focused tests**

Run the new component test and `src/App.test.js`.

Expected: both suites pass.

- [ ] **Step 6: Run safe verification**

Enumerate all frontend test files except `src/Component/BookingFlow.test.jsx` and run those exact files with `--watchAll=false --runInBand`. Then run `npm run build`.

Expected: all selected tests pass and the production build compiles.

- [ ] **Step 7: Commit and push**

Commit the component, test, App integration, specification, and plan with `feat: reset scroll on route navigation`, then push the frontend `main` branch to `origin`.
