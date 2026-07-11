# Home Page Premium Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the existing CineTix home page and movie cards into a centered, premium, responsive experience without changing content, routes, fetching, or functionality.

**Architecture:** `HomePage` remains responsible for fetching and categorizing movies, but delegates repeated section rendering to small local presentation units and uses the first Now Showing banner for hero media. `MovieCard` owns stable card geometry and category-specific bottom content. Framer Motion replaces manual scroll state and viewport calculations.

**Tech Stack:** React 19, React Router 6, Tailwind CSS 3, Framer Motion, Lucide React, Jest, React Testing Library.

## Global Constraints

- Preserve the existing `#5c6ac4`, black, white, and gray theme.
- Preserve all copy, routes, API calls, filtering, loading, errors, empty states, and actions.
- Use the first Now Showing banner as hero media with a black fallback.
- Cards must have stable width/height, truncated titles, and bottom-aligned actions/content.
- Motion must be subtle, reduced-motion aware, and must not drive React state on scroll.
- Do not modify unrelated components or logic.

---

### Task 1: Lock Existing Home And Card Contracts

**Files:**
- Create: `src/Component/HomePage.test.jsx`
- Create: `src/Component/MovieCard.test.jsx`

**Interfaces:**
- Verifies existing API endpoint, category split, copy, and routes.
- Verifies fixed card geometry, title truncation, and category-specific bottom content.

- [ ] **Step 1: Write failing card tests**

Render long-title Now Showing and Coming Soon cards in `MemoryRouter`. Assert the card exposes `data-testid="movie-card"`, stable `h-[30rem] w-full max-w-[16.5rem]`, title `truncate` plus complete `title`, Now Showing `/movie/:id`, and Coming Soon release text without a booking link.

- [ ] **Step 2: Verify card tests fail for missing stable contract**

Run `npm test -- --watchAll=false --runInBand --runTestsByPath src/Component/MovieCard.test.jsx`; expect failures for missing test ID, fixed geometry, and truncation.

- [ ] **Step 3: Write failing home tests**

Mock Axios and Framer Motion, return one released and one future movie, and assert `/movies` is requested, both category headings render, the released movie banner becomes an image with accessible hero alt text, and View All links retain `/movies` and `/coming-soon`.

- [ ] **Step 4: Verify home tests fail for missing hero media**

Run `npm test -- --watchAll=false --runInBand --runTestsByPath src/Component/HomePage.test.jsx`; expect the hero media assertion to fail.

### Task 2: Redesign Movie Card

**Files:**
- Modify: `src/Component/MovieCard.jsx`
- Test: `src/Component/MovieCard.test.jsx`

**Interfaces:**
- Consumes unchanged movie props.
- Preserves `/movie/${_id}` for Now Showing.
- Produces a fixed-height, centered card with bottom-aligned category content.

- [ ] **Step 1: Implement stable card geometry**

Use `motion.article` with `h-[30rem] w-full max-w-[16.5rem]`, `overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm`, and flex-column structure. Use a fixed `h-[21rem]` poster region and `flex-1` information region.

- [ ] **Step 2: Implement constrained content**

Use `truncate` and `title={title}` for the heading. Limit visible genres to two plus an optional `+N` badge. Keep duration in one metadata row. Use `mt-auto` for either the booking link or release information.

- [ ] **Step 3: Replace inline SVGs and add restrained motion**

Use Lucide `Star` and `Clock`; apply a 2px hover lift and subtle image scale. Respect reduced motion through `useReducedMotion`.

- [ ] **Step 4: Verify card tests pass**

Run the focused card suite; expect all assertions passing.

### Task 3: Redesign Home Layout And Motion

**Files:**
- Modify: `src/Component/HomePage.jsx`
- Test: `src/Component/HomePage.test.jsx`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Preserves `GET ${REACT_APP_BACKEND_URL}/movies` and release-date classification.
- Preserves all existing route destinations and visible copy.

- [ ] **Step 1: Install Framer Motion**

Run `npm install framer-motion` and confirm it is recorded in package files.

- [ ] **Step 2: Remove manual scroll animation state**

Delete `scrollY`, refs, scroll listener, `isInViewport`, and scroll-driven inline styles. Import `motion`, `useReducedMotion`, and Lucide `ArrowRight`, `Clock3`, `CreditCard`, and `Sparkles`.

- [ ] **Step 3: Build the cinematic hero**

Render the first Now Showing banner as an absolute full-bleed image with a black fallback and dark overlay. Align unchanged content inside `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8`. Use a 420px mobile and 520px desktop height with a modest entrance transition.

- [ ] **Step 4: Build centered movie sections**

Extract a file-local `MovieSection` to remove duplicated loading/error/empty/grid markup while preserving messages and routes. Use `grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`, centered cards, and consistent section spacing.

- [ ] **Step 5: Restyle offer and feature bands**

Retain exact offer/feature copy and button behavior. Use full-width bands with constrained inner layout, 8px radius maximum, stable icon controls, and viewport reveal motion once.

- [ ] **Step 6: Verify home tests pass**

Run the focused home suite; expect API, hero, category, copy, and route assertions passing.

### Task 4: Responsive And Production Verification

**Files:**
- Modify only if verification reveals a defect: `src/Component/HomePage.jsx`, `src/Component/MovieCard.jsx`

**Interfaces:**
- Confirms no overlap or card resizing across target widths.

- [ ] **Step 1: Run full tests**

Run `npm test -- --watchAll=false --runInBand`; expect all suites passing.

- [ ] **Step 2: Run production build**

Run `npm run build`; expect successful compilation. Record only unrelated pre-existing warnings.

- [ ] **Step 3: Inspect desktop, tablet, and mobile**

Run the local frontend and inspect 1440x900, 768x1024, and 390x844. Confirm hero cropping/readability, next-section visibility, explicit grid columns, identical card geometry, ellipsis, bottom actions, and no overlap/horizontal page scroll.

- [ ] **Step 4: Verify diffs and commit**

Run `git diff --check` and `git status --short`, confirm no build artifacts or unrelated files are staged, then commit as `feat: redesign premium home page`.

