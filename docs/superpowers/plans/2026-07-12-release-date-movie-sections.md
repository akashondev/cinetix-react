# Release-Date Movie Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Classify HomePage movies by release calendar date so released movies automatically appear in Now Showing.

**Architecture:** A pure helper in `movieApi.js` validates and compares `YYYY-MM-DD` date keys. HomePage normalizes the response once, calls the helper with the current date, and stores the returned arrays.

**Tech Stack:** React 19, Axios, Jest, React Testing Library

## Global Constraints

- Ignore persisted movie category when choosing HomePage sections.
- Future release date means Coming Soon; today or past means Now Showing.
- Missing or invalid release dates appear in neither section.
- Preserve unrelated UI and existing uncommitted work.

---

### Task 1: Release-Date Classifier

**Files:**
- Modify: `cinetix-frontend/src/api/movieApi.test.js`
- Modify: `cinetix-frontend/src/api/movieApi.js`

**Interfaces:**
- Produces: `classifyMoviesByReleaseDate(movies, today): { nowShowing: Movie[], comingSoon: Movie[] }`

- [ ] **Step 1: Write failing boundary tests**

With reference date `2026-07-12`, assert dates before and equal to the reference are Now Showing, later dates are Coming Soon, ISO timestamps use their first calendar date, stale categories do not matter, and missing/malformed/impossible dates appear in neither array.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- --watchAll=false --runInBand --runTestsByPath src/api/movieApi.test.js`

Expected: FAIL because the classifier is not exported.

- [ ] **Step 3: Implement the pure classifier**

Validate the leading `YYYY-MM-DD` against a UTC date round-trip, build today's key from local date parts, and partition only valid movie arrays into `nowShowing` and `comingSoon`.

- [ ] **Step 4: Run tests and verify GREEN**

Run the focused command from Step 2.

Expected: all movie API tests pass.

---

### Task 2: HomePage Integration

**Files:**
- Modify: `cinetix-frontend/src/Component/HomePage.test.jsx`
- Modify: `cinetix-frontend/src/Component/HomePage.jsx`

**Interfaces:**
- Consumes: `classifyMoviesByReleaseDate(movieData, new Date())`
- Produces: date-derived HomePage section arrays

- [ ] **Step 1: Write a failing integration test**

Use a past movie labeled `comingSoon` and a future movie labeled `nowShowing`; assert the past movie renders in Now Showing and the future movie renders in Coming Soon.

- [ ] **Step 2: Run the HomePage test and verify RED**

Run: `npm test -- --watchAll=false --runInBand --runTestsByPath src/Component/HomePage.test.jsx`

Expected: FAIL because HomePage still filters by category.

- [ ] **Step 3: Integrate the classifier**

Import the classifier, call it after `normalizeMovies`, and set both state arrays from its result. Preserve loading, error, and empty states.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run both movie API and HomePage tests. Expected: all pass.

---

### Task 3: Verification

**Files:**
- Verify: all frontend files

**Interfaces:**
- Consumes: Tasks 1 and 2
- Produces: passing frontend suite and build

- [ ] **Step 1:** Run `npm test -- --watchAll=false --runInBand`; expect zero failures.
- [ ] **Step 2:** Run `npm run build`; expect `Compiled successfully.`
- [ ] **Step 3:** Run `git diff --check` and review scoped diffs without altering unrelated changes.
