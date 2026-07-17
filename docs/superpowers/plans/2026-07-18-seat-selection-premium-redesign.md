# Seat Selection Premium Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a modern, responsive seat-selection page with a premium booking-panel layout and restrained Framer Motion while preserving all existing booking behavior.

**Architecture:** Keep `SeatSelectionPage` responsible for booking data, availability, selection, validation, storage, and navigation. Keep `Seat` as the accessible single-seat control, adding only state styling and motion. Test the public interface through React Testing Library with the availability hook and surrounding layout components mocked.

**Tech Stack:** React 19, React Router 6, Tailwind CSS 3, Framer Motion 12, Lucide React, Jest, React Testing Library

## Global Constraints

- Modify frontend files only; do not change any file under `cinetix-backend`.
- Preserve API endpoints, request payloads, local-storage keys, authentication routing, and payment navigation state.
- Preserve rows A–H, seat identifiers, aisle positions, the ten-seat maximum, and the ₹180 ticket price.
- Preserve the established light gray, white, near-black, and `#5c6ac4` CineTix theme.
- Honor `useReducedMotion` for nonessential animation.
- Retain native button semantics, keyboard access, accessible seat labels, pressed states, disabled states, and feedback announcements.
- Do not add dependencies.

---

## File Structure

- `src/Component/Seat.jsx`: accessible animated control for one available, selected, or booked seat.
- `src/Component/SeatSelectionPage.jsx`: responsive page layout, visual helpers, selection summary, and unchanged booking flow.
- `src/Component/SeatSelectionPage.test.jsx`: focused visual-state, interaction, feedback, and navigation contract tests.

### Task 1: Seat Control States and Motion

**Files:**
- Create: `src/Component/SeatSelectionPage.test.jsx`
- Modify: `src/Component/Seat.jsx`

**Interfaces:**
- Consumes: `Seat({ id: string, selected: boolean, booked: boolean, onClick: (id: string) => void, reduceMotion?: boolean })`.
- Produces: the same accessible seat button contract with a `data-seat-state` value of `available`, `selected`, or `booked`.

- [ ] **Step 1: Write failing seat-state tests**

Create the test harness with deterministic Framer Motion, router, layout, and availability mocks:

```jsx
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SeatSelectionPage from "./SeatSelectionPage";

const mockNavigate = jest.fn();
const mockRefetch = jest.fn();
let availabilityState;

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});
jest.mock("framer-motion", () => {
  const React = require("react");
  const element = (tag) => React.forwardRef(
    ({ initial, animate, exit, transition, whileHover, whileTap, layout, variants, ...props }, ref) =>
      React.createElement(tag, { ...props, ref })
  );
  return {
    AnimatePresence: ({ children }) => children,
    motion: {
      button: element("button"),
      div: element("div"),
      header: element("header"),
      section: element("section"),
      aside: element("aside"),
      span: element("span"),
    },
    useReducedMotion: () => false,
  };
});
jest.mock("./Navbar", () => () => <nav>Navigation</nav>);
jest.mock("./Footer", () => () => <footer>Footer</footer>);
jest.mock("../hooks/useSeatAvailability", () => () => availabilityState);

const bookingData = {
  movieId: "movie-1",
  movieTitle: "Interstellar",
  movieImage: "/poster.jpg",
  theaterName: "CineTix Downtown",
  theaterAddress: "Main Street",
  theaterScreen: "Screen 3",
  dateISO: "2026-07-18",
  dateDisplay: "18 Jul 2026",
  showTime: "7:30 PM",
};

function renderPage() {
  localStorage.setItem("selectedMovie", JSON.stringify(bookingData));
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SeatSelectionPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  mockNavigate.mockClear();
  mockRefetch.mockReset();
  availabilityState = {
    availability: { bookedSeats: ["A2"], availableCount: 79, soldOut: false },
    bookedSeats: ["A2"],
    loading: false,
    refreshing: false,
    error: null,
    refetch: mockRefetch,
  };
});

test("renders accessible available, selected, and booked seat states", () => {
  renderPage();
  const available = screen.getByRole("button", { name: "Seat A1" });
  const booked = screen.getByRole("button", { name: "Seat A2, booked" });

  expect(available).toHaveAttribute("data-seat-state", "available");
  expect(available).toHaveAttribute("aria-pressed", "false");
  expect(booked).toHaveAttribute("data-seat-state", "booked");
  expect(booked).toBeDisabled();

  fireEvent.click(available);
  expect(screen.getByRole("button", { name: "Seat A1, selected" }))
    .toHaveAttribute("data-seat-state", "selected");
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```powershell
npm test -- --watchAll=false --runTestsByPath src/Component/SeatSelectionPage.test.jsx
```

Expected: FAIL because the current seat button does not expose `data-seat-state`.

- [ ] **Step 3: Implement the animated accessible seat**

Update `Seat.jsx` to use a motion button while retaining the current semantic attributes:

```jsx
import React from "react";
import { motion } from "framer-motion";

function Seat({ id, selected, booked, onClick, reduceMotion = false }) {
  const state = booked ? "booked" : selected ? "selected" : "available";
  const styles = {
    booked: "cursor-not-allowed border-gray-300 bg-gray-200 text-gray-400",
    selected: "border-[#5c6ac4] bg-[#5c6ac4] text-white shadow-md shadow-[#5c6ac4]/25",
    available: "border-gray-300 bg-white text-gray-700 hover:border-[#5c6ac4] hover:text-[#4d5ab5]",
  };

  return (
    <motion.button
      type="button"
      aria-label={`Seat ${id}${booked ? ", booked" : selected ? ", selected" : ""}`}
      aria-pressed={selected}
      data-seat-state={state}
      disabled={booked}
      onClick={() => onClick(id)}
      animate={reduceMotion ? undefined : { scale: selected ? 1.08 : 1 }}
      whileHover={reduceMotion || booked ? undefined : { y: -2 }}
      whileTap={reduceMotion || booked ? undefined : { scale: 0.94 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      className={`h-9 w-9 rounded-lg border text-[11px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-[#5c6ac4] focus:ring-offset-2 sm:h-10 sm:w-10 ${styles[state]}`}
      title={booked ? "This seat is already booked" : `Seat ${id}`}
    >
      {id}
    </motion.button>
  );
}

export default React.memo(Seat);
```

- [ ] **Step 4: Run the focused test and verify success**

Run the Task 1 command again.

Expected: PASS for the seat-state test.

- [ ] **Step 5: Commit the seat control**

```powershell
git add src/Component/Seat.jsx src/Component/SeatSelectionPage.test.jsx
git commit -m "test: cover premium seat control states"
```

### Task 2: Responsive Premium Booking Layout

**Files:**
- Modify: `src/Component/SeatSelectionPage.jsx`
- Modify: `src/Component/SeatSelectionPage.test.jsx`

**Interfaces:**
- Consumes: the unchanged `useSeatAvailability(identity)` return shape and Task 1 `Seat` props.
- Produces: semantic regions named `Seat map`, `Seat status`, and `Booking summary`, plus selected-seat chips and current ticket totals.

- [ ] **Step 1: Add failing layout and summary tests**

Append tests that describe the user-visible design:

```jsx
test("shows premium show details, legend, availability, and booking summary", () => {
  renderPage();

  expect(screen.getByRole("heading", { name: "Interstellar" })).toBeInTheDocument();
  expect(screen.getByText("CineTix Downtown")).toBeInTheDocument();
  expect(screen.getByText("Screen 3")).toBeInTheDocument();
  expect(screen.getByText("18 Jul 2026")).toBeInTheDocument();
  expect(screen.getByText("7:30 PM")).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Seat status" })).toHaveTextContent("Available");
  expect(screen.getByRole("region", { name: "Seat status" })).toHaveTextContent("Selected");
  expect(screen.getByRole("region", { name: "Seat status" })).toHaveTextContent("Booked");
  expect(screen.getByText("79 seats available")).toBeInTheDocument();
  expect(screen.getByRole("complementary", { name: "Booking summary" })).toHaveTextContent("₹0");
});

test("updates selected chips, ticket total, and payment action", () => {
  renderPage();
  const proceed = screen.getByRole("button", { name: /proceed to payment/i });
  expect(proceed).toBeDisabled();

  fireEvent.click(screen.getByRole("button", { name: "Seat A1" }));
  fireEvent.click(screen.getByRole("button", { name: "Seat A3" }));

  const summary = screen.getByRole("complementary", { name: "Booking summary" });
  expect(summary).toHaveTextContent("A1");
  expect(summary).toHaveTextContent("A3");
  expect(summary).toHaveTextContent("2 seats");
  expect(summary).toHaveTextContent("₹360");
  expect(proceed).toBeEnabled();
});
```

- [ ] **Step 2: Run the focused tests and verify failure**

Run the Task 1 test command.

Expected: FAIL because the named status region, complementary summary, availability text, and chips do not exist.

- [ ] **Step 3: Build focused presentation helpers**

In `SeatSelectionPage.jsx`, import:

```jsx
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Armchair, CalendarDays, Clock3, MapPin, Monitor, RefreshCw, Ticket } from "lucide-react";
```

Add page-local helpers:

```jsx
const STATE_LEGEND = [
  { label: "Available", className: "border-gray-300 bg-white" },
  { label: "Selected", className: "border-[#5c6ac4] bg-[#5c6ac4]" },
  { label: "Booked", className: "border-gray-300 bg-gray-200" },
];

function Detail({ icon: Icon, children }) {
  if (!children) return null;
  return (
    <span className="inline-flex items-center gap-2 text-sm text-gray-600">
      <Icon className="h-4 w-4 text-[#5c6ac4]" aria-hidden="true" />
      {children}
    </span>
  );
}

function SeatLegend() {
  return (
    <div aria-label="Seat status" role="region" className="flex flex-wrap gap-4">
      {STATE_LEGEND.map(({ label, className }) => (
        <span key={label} className="inline-flex items-center gap-2 text-xs font-medium text-gray-600">
          <span className={`h-4 w-4 rounded border ${className}`} aria-hidden="true" />
          {label}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Replace presentation markup without changing state or booking logic**

Retain `readBookingData`, `identity`, both effects, `toggleSeat`, `proceed`, `soldOut`, and `disabled`. Add:

```jsx
const reduceMotion = useReducedMotion();
const total = selectedSeats.length * TICKET_PRICE;
const availableLabel = Number.isFinite(availability?.availableCount)
  ? `${availability.availableCount} ${availability.availableCount === 1 ? "seat" : "seats"} available`
  : null;
```

Render a `max-w-7xl` page with:

- a motion header containing the title and `Detail` items for `MapPin`, `Monitor`, `CalendarDays`, and `Clock3`;
- an `lg:grid-cols-[minmax(0,1fr)_22rem]` content grid;
- a white rounded seat-map card with `SeatLegend`, availability text, screen glow, existing rows and aisles;
- Task 1 seats receiving `reduceMotion={reduceMotion}`;
- a sticky `<motion.aside aria-label="Booking summary">` with chips rendered from `selectedSeats`;
- price rows for `Tickets (N × ₹180)` and `Total`;
- the unchanged proceed button handler and disabled value.

Use variants that become static under reduced motion:

```jsx
const reveal = reduceMotion
  ? {}
  : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };
```

Use `AnimatePresence initial={false}` for messages and chips. Give feedback containers `role="status"` and the error container `role="alert"`.

- [ ] **Step 5: Run the focused tests and verify success**

Run the Task 1 test command.

Expected: all Task 1 and Task 2 tests PASS.

- [ ] **Step 6: Commit the premium layout**

```powershell
git add src/Component/SeatSelectionPage.jsx src/Component/SeatSelectionPage.test.jsx
git commit -m "feat: redesign premium seat selection layout"
```

### Task 3: Preserve Feedback and Navigation Contracts

**Files:**
- Modify: `src/Component/SeatSelectionPage.test.jsx`
- Modify only if a test exposes a regression: `src/Component/SeatSelectionPage.jsx`

**Interfaces:**
- Consumes: existing `refetch(): Promise<{ bookedSeats: string[] } | undefined>`.
- Produces: unchanged login navigation and payment navigation payloads.

- [ ] **Step 1: Add failing interaction and state coverage**

Append:

```jsx
test("enforces the ten-seat maximum with an announced warning", () => {
  renderPage();
  ["A1", "A3", "A5", "A6", "A7", "A8", "A10", "A11", "A12", "B1", "B2"]
    .forEach((id) => fireEvent.click(screen.getByRole("button", { name: `Seat ${id}` })));

  expect(screen.getByRole("status"))
    .toHaveTextContent("You can select a maximum of 10 seats.");
  expect(screen.getByRole("complementary", { name: "Booking summary" }))
    .toHaveTextContent("10 seats");
});

test("shows an availability error and retries", () => {
  availabilityState = {
    ...availabilityState,
    availability: null,
    bookedSeats: [],
    error: "Unable to load seat availability",
  };
  renderPage();

  expect(screen.getByRole("alert")).toHaveTextContent("Unable to load seat availability");
  fireEvent.click(screen.getByRole("button", { name: /retry/i }));
  expect(mockRefetch).toHaveBeenCalledTimes(1);
});

test("redirects logged-out users to login without refetching", () => {
  renderPage();
  fireEvent.click(screen.getByRole("button", { name: "Seat A1" }));
  fireEvent.click(screen.getByRole("button", { name: /proceed to payment/i }));

  expect(mockNavigate).toHaveBeenCalledWith("/login", { state: { from: "/seats" } });
  expect(mockRefetch).not.toHaveBeenCalled();
});

test("preserves payment navigation state for logged-in users", async () => {
  localStorage.setItem("token", "token");
  mockRefetch.mockResolvedValue({ bookedSeats: [] });
  renderPage();
  fireEvent.click(screen.getByRole("button", { name: "Seat A1" }));
  fireEvent.click(screen.getByRole("button", { name: /proceed to payment/i }));

  expect(await screen.findByRole("button", { name: "Seat A1, selected" })).toBeInTheDocument();
  expect(mockRefetch).toHaveBeenCalledTimes(1);
  expect(mockNavigate).toHaveBeenCalledWith("/payment", {
    state: expect.objectContaining({
      selectedDate: "2026-07-18",
      selectedTime: "7:30 PM",
      selectedSeats: ["A1"],
    }),
  });
});
```

- [ ] **Step 2: Run focused tests**

Run the Task 1 test command.

Expected: tests either PASS immediately because behavior was preserved or identify an exact accessibility/contract regression.

- [ ] **Step 3: Make only regression-driven corrections**

If the maximum warning has multiple `status` regions, give the feedback container an accessible name and query that name. If payment navigation occurs before the async assertion, use:

```jsx
await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(
  "/payment",
  expect.objectContaining({ state: expect.objectContaining({ selectedSeats: ["A1"] }) })
));
```

Do not change the `proceed` payload, storage keys, pricing, or availability checks.

- [ ] **Step 4: Run all frontend tests**

Run:

```powershell
npm test -- --watchAll=false
```

Expected: all suites PASS.

- [ ] **Step 5: Run the production build**

Run:

```powershell
npm run build
```

Expected: `Compiled successfully.` No new ESLint warnings from the modified files.

- [ ] **Step 6: Confirm backend files were untouched**

Run from `D:\cinetext\cinetix-frontend`:

```powershell
git status --short
git diff --name-only HEAD
```

Expected: no paths under `cinetix-backend`; only the intended frontend files are present.

- [ ] **Step 7: Commit verification coverage**

```powershell
git add src/Component/SeatSelectionPage.test.jsx src/Component/SeatSelectionPage.jsx
git commit -m "test: verify seat booking presentation contracts"
```

