# Local Development API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Point the React development server at the working backend on localhost port 3000 while leaving production configuration unchanged.

**Architecture:** Use Create React App's ignored `.env.development.local` override. Existing application code continues reading `REACT_APP_BACKEND_URL`; no source or production environment files change.

**Tech Stack:** Create React App, React, Axios, Jest

## Global Constraints

- Do not start or stop the user's frontend process.
- Do not change production configuration, application source, backend logic, or UI.
- Local frontend remains on `http://localhost:3001`.
- Local backend remains on `http://localhost:3000`.

---

### Task 1: Local API Override

**Files:**
- Create: `cinetix-frontend/.env.development.local`
- Verify: `cinetix-frontend/src/config/api.js`
- Test: `cinetix-frontend/src/Component/HomePage.test.jsx`

**Interfaces:**
- Consumes: Create React App development environment loading
- Produces: `process.env.REACT_APP_BACKEND_URL === "http://localhost:3000/api"` after the user restarts the development server

- [ ] **Step 1: Confirm the local API works**

Run an HTTP GET for `http://localhost:3000/api/movies` with origin `http://localhost:3001`.

Expected: status 200, JSON movie data, and `Access-Control-Allow-Origin: http://localhost:3001`.

- [ ] **Step 2: Create the development override**

Create `.env.development.local` with exactly:

```env
REACT_APP_BACKEND_URL=http://localhost:3000/api
```

- [ ] **Step 3: Verify environment precedence without starting the app**

Run Create React App's dotenv loader for the development environment and print only `REACT_APP_BACKEND_URL`.

Expected: `http://localhost:3000/api`.

- [ ] **Step 4: Run focused HomePage tests**

Run: `npm test -- --watchAll=false --runInBand --runTestsByPath src/Component/HomePage.test.jsx`

Expected: all HomePage tests pass.

- [ ] **Step 5: Hand off restart**

Tell the user to stop and restart `npm start` because Create React App reads environment files only at startup. Do not start or stop the process for them.
