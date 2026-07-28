# Navbar Avatar and Hover Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show only the circular user avatar as the desktop account trigger and ensure desktop link hover animation affects only the underline.

**Architecture:** Keep the existing navbar state, account dropdown, and route behavior unchanged. Refine only the desktop account trigger markup and desktop navigation classes, with DOM-level regression tests covering the visible trigger and animation isolation.

**Tech Stack:** React, React Router, Framer Motion, Tailwind CSS, Jest, React Testing Library

## Global Constraints

- Do not add Profile or Settings destinations.
- Clicking the avatar must continue toggling the existing account dropdown.
- Keep motion lightweight at 200–300ms and respect the existing reduced-motion behavior.
- Do not run `src/Component/BookingFlow.test.jsx`.

---

### Task 1: Refine the Desktop Navbar Trigger and Hover Styling

**Files:**
- Modify: `src/Component/Navbar.test.jsx`
- Modify: `src/Component/Navbar.jsx`

**Interfaces:**
- Consumes: Existing local-storage authentication state and `Open account menu` button behavior.
- Produces: An icon-free circular avatar trigger and desktop navigation links whose hover animation is isolated to the underline.

- [ ] **Step 1: Write failing regression assertions**

In the logged-in navbar test, assert that the account trigger has the `rounded-full` and equal-width classes, contains the expected initials, and contains no SVG:

```jsx
const avatar = screen.getByRole("button", {
  name: /open account menu/i,
});
expect(avatar).toHaveTextContent("A");
expect(avatar).toHaveClass("h-9", "w-9", "rounded-full");
expect(avatar.querySelector("svg")).not.toBeInTheDocument();
```

In the logged-out navigation test, assert that the Movies link does not carry text color transition or hover text-color utilities:

```jsx
const moviesLink = screen.getByRole("link", { name: "Movies" });
expect(moviesLink.className).not.toContain("transition-colors");
expect(moviesLink.className).not.toContain("hover:text-");
```

- [ ] **Step 2: Run the navbar test and verify RED**

Run:

```powershell
$env:CI='true'; npm test -- --watchAll=false --runInBand src/Component/Navbar.test.jsx
```

Expected: FAIL because the account trigger contains the chevron SVG and is not a fixed-width circle, while the desktop link still transitions its text color.

- [ ] **Step 3: Implement the minimal navbar refinement**

Remove `ChevronDown` from the Lucide import and remove its rendered element. Make the motion button itself the circular avatar:

```jsx
<motion.button
  type="button"
  onClick={() => {
    setIsMenuOpen(false);
    setIsAccountOpen((current) => !current);
  }}
  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5c6ac4] text-xs font-bold tracking-wide text-white shadow-sm shadow-[#5c6ac4]/30 outline-none ring-1 ring-white/15 transition-shadow duration-200 hover:ring-[#7c88df]/80 focus-visible:ring-2 focus-visible:ring-[#8f9af0]"
  aria-haspopup="menu"
  aria-expanded={isAccountOpen}
  aria-label="Open account menu"
  {...buttonMotion}
>
  {initials}
</motion.button>
```

Keep desktop link text classes fixed and let only the nested underline use `transition-transform`:

```jsx
className={({ isActive }) =>
  `group relative rounded-md px-1 py-2 text-sm font-medium ${
    isActive ? "text-white" : "text-white/70"
  }`
}
```

- [ ] **Step 4: Run focused tests and verify GREEN**

Run:

```powershell
$env:CI='true'; npm test -- --watchAll=false --runInBand src/Component/Navbar.test.jsx src/Component/LoginPage.test.jsx
```

Expected: 2 suites pass and all navbar/login tests pass.

- [ ] **Step 5: Run safe regression verification**

Enumerate all frontend test files except `src/Component/BookingFlow.test.jsx`, verify the excluded path is absent, and run them serially:

```powershell
$testPaths = Get-ChildItem -Path src -Recurse -File | Where-Object { $_.Name -match '\.test\.(js|jsx)$' -and $_.FullName -notlike '*BookingFlow.test.jsx' } | ForEach-Object { $_.FullName.Substring((Get-Location).Path.Length + 1).Replace('\', '/') }; if ($testPaths -contains 'src/Component/BookingFlow.test.jsx') { throw 'BookingFlow test was not excluded' }; $env:CI='true'; & npm.cmd test -- --watchAll=false --runInBand $testPaths
```

Run the optimized production build:

```powershell
$env:CI='true'; npm run build
```

Expected: All safe suites pass and the production build compiles successfully.

- [ ] **Step 6: Commit and push**

```powershell
git add src/Component/Navbar.jsx src/Component/Navbar.test.jsx
git commit -m "fix: refine navbar avatar and hover"
git push origin main
```
