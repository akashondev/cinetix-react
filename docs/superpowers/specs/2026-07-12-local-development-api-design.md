# Local Development API Design

## Goal

Make the React app running at `http://localhost:3001` fetch movies from the working local backend at `http://localhost:3000/api` without changing production API configuration.

## Configuration

Add an ignored Create React App development override at `.env.development.local`:

```env
REACT_APP_BACKEND_URL=http://localhost:3000/api
```

Create React App loads this value in development with higher priority than the existing ignored `.env`, which continues to contain the Render API base. No application source, production deployment setting, UI, or backend logic changes are required.

## Runtime Flow

The local backend listens on port 3000 and already returns `/api/movies` with `Access-Control-Allow-Origin: http://localhost:3001`. The React development server listens on port 3001 and requests `http://localhost:3000/api/movies` through the existing `API_URL` configuration.

Because Create React App reads environment files at startup, restart the frontend process after creating the override.

## Verification

Confirm the local backend returns a movie array, start the React development server on port 3001, and verify the compiled development bundle contains `http://localhost:3000/api`. Run the focused HomePage tests to ensure movie response normalization and category rendering remain intact.

## Scope

Do not change the production URL, application source, backend logic, or unrelated UI behavior.
