# Standalone Login Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the shared navbar and footer from Login and present authentication in a branded full-viewport standalone layout.

**Architecture:** Keep all form state, API requests, session storage, events, timers, and redirects inside the existing `LoginPage`. Replace only its page shell with a full-height layout and a compact `Link` wordmark that returns to Home.

**Tech Stack:** React, React Router, Framer Motion, Tailwind CSS, Jest, React Testing Library

## Global Constraints

- Preserve login, registration, validation, session persistence, and redirects.
- Do not add a Profile page or new route.
- Keep motion lightweight and respect reduced-motion preferences.
- Do not run `src/Component/BookingFlow.test.jsx`.

---

### Task 1: Make Login a Standalone Full-Viewport Page

**Files:**
- Modify: `src/Component/LoginPage.test.jsx`
- Modify: `src/Component/LoginPage.jsx`

**Interfaces:**
- Consumes: React Router `Link`, existing authentication endpoints, and existing local-storage session keys.
- Produces: A standalone Login page with a Home-linked CineTix wordmark and unchanged authentication behavior.

- [ ] **Step 1: Write the failing standalone-layout test**

Remove the Navbar and Footer component mocks. Update the minimal card test to assert that shared page chrome is absent, the brand link targets `/`, and the page shell fills the viewport:

```jsx
expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
expect(screen.getByRole("link", { name: "CineTix home" })).toHaveAttribute(
  "href",
  "/"
);
expect(screen.getByTestId("standalone-login-page")).toHaveClass("min-h-screen");
```

- [ ] **Step 2: Run the Login test and verify RED**

Run:

```powershell
$env:CI='true'; npm test -- --watchAll=false --runInBand src/Component/LoginPage.test.jsx
```

Expected: FAIL because Login still renders the shared navbar/footer and lacks the standalone brand link and test identifier.

- [ ] **Step 3: Implement the standalone shell**

Remove `Navbar` and `Footer` imports and render a full-viewport root:

```jsx
<div
  data-testid="standalone-login-page"
  className="relative flex min-h-screen flex-col overflow-hidden bg-[#f7f7f8]"
>
  <div className="relative z-10 mx-auto flex w-full max-w-7xl px-5 pt-6 sm:px-8 sm:pt-8">
    <Link
      to="/"
      aria-label="CineTix home"
      className="rounded-md text-xl font-bold tracking-[-0.03em] text-gray-950 outline-none transition-opacity duration-200 hover:opacity-75 focus-visible:ring-2 focus-visible:ring-[#5c6ac4]"
    >
      Cine<span className="text-[#5c6ac4]">Tix</span>
    </Link>
  </div>
  <main className="relative flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
    {/* existing background accents and authentication card */}
  </main>
</div>
```

Keep all authentication form content and logic unchanged.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run:

```powershell
$env:CI='true'; npm test -- --watchAll=false --runInBand src/Component/LoginPage.test.jsx src/Component/Navbar.test.jsx
```

Expected: Both suites and all tests pass.

- [ ] **Step 5: Run safe regression checks**

Run every frontend test except `src/Component/BookingFlow.test.jsx`, then build:

```powershell
$testPaths = Get-ChildItem -Path src -Recurse -File | Where-Object { $_.Name -match '\.test\.(js|jsx)$' -and $_.FullName -notlike '*BookingFlow.test.jsx' } | ForEach-Object { $_.FullName.Substring((Get-Location).Path.Length + 1).Replace('\', '/') }; if ($testPaths -contains 'src/Component/BookingFlow.test.jsx') { throw 'BookingFlow test was not excluded' }; $env:CI='true'; & npm.cmd test -- --watchAll=false --runInBand $testPaths
$env:CI='true'; npm run build
```

Expected: All safe suites pass and the production build compiles successfully.

- [ ] **Step 6: Commit and push**

```powershell
git add src/Component/LoginPage.jsx src/Component/LoginPage.test.jsx
git commit -m "feat: make login page standalone"
git push origin main
```
