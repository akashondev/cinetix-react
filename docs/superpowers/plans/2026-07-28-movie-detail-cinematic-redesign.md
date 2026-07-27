# Movie Detail Cinematic Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a cinematic CineTix movie-detail page whose hero play button opens a working in-page YouTube trailer window, without changing backend or booking behavior.

**Architecture:** Keep `MovieDetailPage` responsible for its current movie request, showtime state, and booking navigation. Add one pure YouTube URL normalizer and one focused accessible trailer dialog, then compose them into a restyled responsive page. Use the movie fields already returned by the current API; no endpoint, response shape, route, storage key, or booking field changes.

**Tech Stack:** React 19, React Router 6, Tailwind CSS 3, Lucide React, Jest, React Testing Library, Axios.

## Global Constraints

- Modify frontend files under `cinetix-frontend` only.
- Do not change backend files, API contracts, business logic, or booking-data fields.
- Preserve the movie request to `${API_URL}/movies/${id}`.
- Preserve date generation, passed-showtime checks, theater data, `movieSelection`, `selectedMovie`, and `/seats` navigation behavior.
- Use black, white, neutral grays, and the existing `#5c6ac4` CineTix accent.
- Remove the poster-level `Watch Trailer` link; the centered hero play control is the single trailer entry point.
- Respect reduced-motion preferences and provide keyboard-visible focus.

## File Structure

- Create `src/Component/trailerUrl.js`: pure conversion and validation of supported YouTube URLs.
- Create `src/Component/trailerUrl.test.js`: table-driven behavior tests for URL conversion.
- Create `src/Component/TrailerModal.jsx`: accessible modal, player, body-scroll lock, close behavior, and focus restoration.
- Create `src/Component/TrailerModal.test.jsx`: dialog behavior tests against the real component.
- Create `src/Component/MovieDetailPage.test.jsx`: page integration tests using a complete movie API fixture.
- Modify `src/Component/MovieDetailPage.jsx`: cinematic presentation and modal integration while retaining the existing request and booking functions.

---

### Task 1: YouTube Trailer URL Normalizer

**Files:**
- Create: `src/Component/trailerUrl.js`
- Create: `src/Component/trailerUrl.test.js`

**Interfaces:**
- Consumes: a trailer URL string from `movie.trailerUrl`.
- Produces: `getYouTubeEmbedUrl(value: string): string | null`.

- [ ] **Step 1: Write the failing URL conversion tests**

```js
import { getYouTubeEmbedUrl } from "./trailerUrl";

describe("getYouTubeEmbedUrl", () => {
  test.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"],
    ["https://youtu.be/dQw4w9WgXcQ?t=12", "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"],
  ])("converts %s into an autoplay embed URL", (input, expected) => {
    expect(getYouTubeEmbedUrl(input)).toBe(expected);
  });

  test.each(["", "#", "not a url", "https://vimeo.com/1234", "https://youtube.com/watch"])(
    "rejects unsupported trailer value %s",
    (input) => {
      expect(getYouTubeEmbedUrl(input)).toBeNull();
    }
  );
});
```

- [ ] **Step 2: Run the URL tests and verify RED**

Run: `npm test -- --watchAll=false src/Component/trailerUrl.test.js`

Expected: FAIL because `./trailerUrl` does not exist.

- [ ] **Step 3: Implement the minimal normalizer**

```js
const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com"]);

export function getYouTubeEmbedUrl(value) {
  if (!value || value === "#") return null;

  try {
    const url = new URL(value);
    let videoId = "";

    if (url.hostname === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] || "";
    } else if (YOUTUBE_HOSTS.has(url.hostname)) {
      if (url.pathname === "/watch") {
        videoId = url.searchParams.get("v") || "";
      } else {
        const [kind, id] = url.pathname.split("/").filter(Boolean);
        if (kind === "embed" || kind === "shorts") videoId = id || "";
      }
    }

    return /^[A-Za-z0-9_-]{6,}$/.test(videoId)
      ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
      : null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run the URL tests and verify GREEN**

Run: `npm test -- --watchAll=false src/Component/trailerUrl.test.js`

Expected: PASS with 2 test groups and all table entries green.

- [ ] **Step 5: Commit the normalizer**

```bash
git add src/Component/trailerUrl.js src/Component/trailerUrl.test.js
git commit -m "feat: normalize movie trailer URLs"
```

---

### Task 2: Accessible Trailer Window

**Files:**
- Create: `src/Component/TrailerModal.jsx`
- Create: `src/Component/TrailerModal.test.jsx`

**Interfaces:**
- Consumes: `isOpen: boolean`, `title: string`, `embedUrl: string | null`, `onClose: () => void`.
- Produces: a modal dialog containing an autoplay-enabled iframe, with close-button, Escape, backdrop, scroll-lock, and focus-restoration behavior.

- [ ] **Step 1: Write failing modal interaction tests**

```jsx
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TrailerModal from "./TrailerModal";

const embedUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0";

test("renders the movie trailer inside a named modal dialog", () => {
  render(<TrailerModal isOpen title="Dune: Part Two" embedUrl={embedUrl} onClose={() => {}} />);

  expect(screen.getByRole("dialog", { name: /dune: part two trailer/i })).toBeInTheDocument();
  expect(screen.getByTitle("Dune: Part Two trailer")).toHaveAttribute("src", embedUrl);
  expect(document.body).toHaveStyle({ overflow: "hidden" });
});

test("closes from the button, Escape, and backdrop", async () => {
  const onClose = jest.fn();
  const { rerender } = render(
    <TrailerModal isOpen title="Dune: Part Two" embedUrl={embedUrl} onClose={onClose} />
  );

  await userEvent.click(screen.getByRole("button", { name: /close trailer/i }));
  expect(onClose).toHaveBeenCalledTimes(1);

  fireEvent.keyDown(document, { key: "Escape" });
  expect(onClose).toHaveBeenCalledTimes(2);

  fireEvent.mouseDown(screen.getByTestId("trailer-backdrop"));
  expect(onClose).toHaveBeenCalledTimes(3);

  rerender(<TrailerModal isOpen={false} title="Dune: Part Two" embedUrl={embedUrl} onClose={onClose} />);
  expect(document.body).not.toHaveStyle({ overflow: "hidden" });
});

test("restores focus to the control active before opening", () => {
  const trigger = document.createElement("button");
  document.body.appendChild(trigger);
  trigger.focus();

  const { rerender } = render(
    <TrailerModal isOpen={false} title="Dune: Part Two" embedUrl={embedUrl} onClose={() => {}} />
  );
  rerender(<TrailerModal isOpen title="Dune: Part Two" embedUrl={embedUrl} onClose={() => {}} />);
  rerender(<TrailerModal isOpen={false} title="Dune: Part Two" embedUrl={embedUrl} onClose={() => {}} />);

  expect(trigger).toHaveFocus();
  trigger.remove();
});
```

- [ ] **Step 2: Run the modal tests and verify RED**

Run: `npm test -- --watchAll=false src/Component/TrailerModal.test.jsx`

Expected: FAIL because `TrailerModal` does not exist.

- [ ] **Step 3: Implement the modal behavior and presentation**

Implement `TrailerModal` with:

```jsx
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function TrailerModal({ isOpen, title, embedUrl, onClose }) {
  const previousFocus = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    previousFocus.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="trailer-backdrop"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`${title} trailer`}
        className="relative w-full max-w-6xl overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close trailer"
          className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/75 text-white transition hover:bg-white hover:text-black focus:outline-none focus:ring-2 focus:ring-[#8f9af0]"
        >
          <X aria-hidden="true" />
        </button>
        <div className="aspect-video w-full">
          {embedUrl ? (
            <iframe
              className="h-full w-full"
              src={embedUrl}
              title={`${title} trailer`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-white">
              Trailer unavailable
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Run the modal tests and verify GREEN**

Run: `npm test -- --watchAll=false src/Component/TrailerModal.test.jsx`

Expected: PASS for dialog rendering, all close paths, body scroll restoration, and focus restoration.

- [ ] **Step 5: Commit the trailer window**

```bash
git add src/Component/TrailerModal.jsx src/Component/TrailerModal.test.jsx
git commit -m "feat: add accessible trailer window"
```

---

### Task 3: Cinematic Movie Detail Page Integration

**Files:**
- Create: `src/Component/MovieDetailPage.test.jsx`
- Modify: `src/Component/MovieDetailPage.jsx`

**Interfaces:**
- Consumes: `getYouTubeEmbedUrl(movie.trailerUrl)` and `TrailerModal`.
- Preserves: current Axios request, `handleDateSelection`, `generateDates`, theater data, `handleBooking`, `formatTimeForBooking`, `isShowtimePassed`, and `getAvailableShowtimes`.
- Produces: a responsive cinematic page with one hero play control and the existing booking flow.

- [ ] **Step 1: Write the failing page integration tests**

Use a complete API fixture rather than a partial movie:

```jsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";
import MovieDetailPage from "./MovieDetailPage";

jest.mock("axios");

const movie = {
  _id: "movie-1",
  title: "Dune: Part Two",
  image: "https://images.example/dune-backdrop.jpg",
  banner: "https://images.example/dune-poster.jpg",
  rating: 4.8,
  duration: "2h 46m",
  genres: ["Sci-Fi", "Adventure"],
  certificate: "PG-13",
  releaseDate: "March 1, 2025",
  director: "Denis Villeneuve",
  cast: ["Timothée Chalamet", "Zendaya"],
  description: "Paul Atreides unites with Chani and the Fremen.",
  trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/movie/movie-1"]}>
      <Routes>
        <Route path="/movie/:id" element={<MovieDetailPage />} />
        <Route path="/seats" element={<div>Seat selection destination</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  axios.get.mockResolvedValue({ data: movie });
});

test("renders cinematic movie information with a single trailer control", async () => {
  renderPage();

  expect(await screen.findByRole("heading", { name: "Dune: Part Two", level: 1 })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /play dune: part two trailer/i })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /watch trailer/i })).not.toBeInTheDocument();
  expect(screen.getByText("Denis Villeneuve")).toBeInTheDocument();
  expect(screen.getByText("Timothée Chalamet")).toBeInTheDocument();
});

test("opens and closes the trailer window from the hero", async () => {
  renderPage();

  await userEvent.click(await screen.findByRole("button", { name: /play dune: part two trailer/i }));
  expect(screen.getByRole("dialog", { name: /dune: part two trailer/i })).toBeInTheDocument();
  expect(screen.getByTitle("Dune: Part Two trailer")).toHaveAttribute(
    "src",
    "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"
  );

  await userEvent.click(screen.getByRole("button", { name: /close trailer/i }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(screen.getByRole("button", { name: /play dune: part two trailer/i })).toHaveFocus();
});

test("keeps trailer unavailable without opening a broken player", async () => {
  axios.get.mockResolvedValue({ data: { ...movie, trailerUrl: "#" } });
  renderPage();

  const playButton = await screen.findByRole("button", { name: /trailer unavailable/i });
  expect(playButton).toBeDisabled();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
```

Add one booking regression test that freezes the clock before the first show and asserts the real consumer-visible result:

```jsx
test("preserves showtime booking data and seat navigation", async () => {
  jest.useFakeTimers().setSystemTime(new Date("2026-07-28T00:00:00.000Z"));
  renderPage();

  await userEvent.click(await screen.findByRole("button", { name: "10:30 AM" }));
  expect(await screen.findByText("Seat selection destination")).toBeInTheDocument();

  const selectedMovie = JSON.parse(localStorage.getItem("selectedMovie"));
  expect(selectedMovie).toMatchObject({
    movieId: "movie-1",
    movieTitle: "Dune: Part Two",
    theaterName: "CineWorld - Downtown",
    showTime: "10:30 AM",
  });
  jest.useRealTimers();
});
```

- [ ] **Step 2: Run the page tests and verify RED**

Run: `npm test -- --watchAll=false src/Component/MovieDetailPage.test.jsx`

Expected: FAIL because the hero play control, trailer modal integration, unavailable state, and cinematic structure do not exist.

- [ ] **Step 3: Integrate trailer state without touching booking functions**

Add imports and state:

```jsx
import { CalendarDays, Clock3, MapPin, Play, Star } from "lucide-react";
import TrailerModal from "./TrailerModal";
import { getYouTubeEmbedUrl } from "./trailerUrl";

const [isTrailerOpen, setIsTrailerOpen] = useState(false);
const trailerEmbedUrl = getYouTubeEmbedUrl(movie?.trailerUrl);
```

Render `TrailerModal` once at page level:

```jsx
<TrailerModal
  isOpen={isTrailerOpen}
  title={movie.title}
  embedUrl={trailerEmbedUrl}
  onClose={() => setIsTrailerOpen(false)}
/>
```

The hero play button must use:

```jsx
<button
  type="button"
  onClick={() => setIsTrailerOpen(true)}
  disabled={!trailerEmbedUrl}
  aria-label={trailerEmbedUrl ? `Play ${movie.title} trailer` : "Trailer unavailable"}
>
  <Play aria-hidden="true" />
</button>
```

- [ ] **Step 4: Restyle the hero and metadata**

Replace only the returned JSX presentation from the post-loading `return`:

- Keep `<Navbar />` and `<Footer />`.
- Use a black page background and a `min-h-[34rem]` responsive hero.
- Use `movie.image || movie.banner` for the wide backdrop and `movie.banner || movie.image` for the poster.
- Add black opacity layers with CSS colors, not gradients.
- Center the play button in the media area.
- Overlay the poster and text near the hero bottom on desktop; stack them below the backdrop on mobile.
- Render title, rating, duration, certificate, genres, description, director, release date, and cast from the unchanged normalized movie object.
- Remove the `<a href={movie.trailerUrl}>Watch Trailer</a>` block completely.
- Use `max-w-7xl`, consistent responsive horizontal padding, restrained 8–12px radii, and the existing accent.

- [ ] **Step 5: Restyle showtimes without changing their handlers**

Keep the current `dates.map`, `theaters.map`, `getAvailableShowtimes`, and `handleBooking(time, theater.id)` calls. Change only classes and surrounding semantic markup:

- use a dark `Showtimes & Tickets` section with a bordered neutral surface
- use compact date buttons with `#5c6ac4` selected state
- show theater address with `MapPin`
- retain screen and available-count text
- keep passed times disabled
- keep selected and keyboard-focus states distinct
- preserve the existing 500ms theater loading transition

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `npm test -- --watchAll=false src/Component/trailerUrl.test.js src/Component/TrailerModal.test.jsx src/Component/MovieDetailPage.test.jsx`

Expected: PASS for URL handling, trailer window behavior, cinematic page integration, unavailable trailers, and booking navigation.

- [ ] **Step 7: Commit the page integration**

```bash
git add src/Component/MovieDetailPage.jsx src/Component/MovieDetailPage.test.jsx
git commit -m "feat: redesign movie detail experience"
```

---

### Task 4: Frontend Regression And Production Verification

**Files:**
- Modify only files from Tasks 1–3 if verification exposes a defect.

**Interfaces:**
- Consumes: the complete frontend implementation.
- Produces: fresh test, build, and responsive-inspection evidence.

- [ ] **Step 1: Run the complete frontend test suite**

Run: `npm test -- --watchAll=false`

Expected: all frontend suites pass with zero failures.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: exit code 0 and a production bundle in `build/`.

- [ ] **Step 3: Inspect the implementation diff**

Run: `git diff HEAD~3 --check && git diff HEAD~3 --stat && git status --short`

Expected: no whitespace errors, no backend paths, and only the planned frontend files plus documentation.

- [ ] **Step 4: Inspect responsive behavior**

Run the app and inspect the movie detail page at approximately 390px, 768px, and 1440px widths. Confirm:

- no horizontal overflow
- hero play control stays visible
- poster and metadata do not overlap
- modal fits the viewport and closes by mouse and keyboard
- showtime buttons wrap cleanly
- unavailable trailer control cannot open a broken iframe

- [ ] **Step 5: Commit any verification-only correction**

If verification required a code correction, first add a focused failing regression test, confirm RED, apply the minimal fix, confirm GREEN, then commit:

```bash
git add src/Component
git commit -m "fix: harden movie detail presentation"
```

If no correction was required, do not create an empty commit.
