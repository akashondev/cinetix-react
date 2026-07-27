import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";
import MovieDetailPage from "./MovieDetailPage";
import { API_URL } from "../config/api";

jest.mock("axios", () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

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
    <MemoryRouter
      initialEntries={["/movie/movie-1"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/movie/:id" element={<MovieDetailPage />} />
        <Route
          path="/seats"
          element={<div>Seat selection destination</div>}
        />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  axios.get.mockResolvedValue({ data: movie });
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

test("renders cinematic movie information with one trailer control", async () => {
  renderPage();

  expect(
    await screen.findByRole("heading", {
      name: "Dune: Part Two",
      level: 1,
    })
  ).toBeInTheDocument();
  expect(axios.get).toHaveBeenCalledWith(`${API_URL}/movies/movie-1`);
  expect(
    screen.getByRole("button", {
      name: /play dune: part two trailer/i,
    })
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: /watch trailer/i })
  ).not.toBeInTheDocument();
  expect(screen.getByText("Denis Villeneuve")).toBeInTheDocument();
  expect(screen.getByText("Timothée Chalamet")).toBeInTheDocument();
});

test("opens and closes the trailer window from the hero", async () => {
  renderPage();

  const playButton = await screen.findByRole("button", {
    name: /play dune: part two trailer/i,
  });
  await userEvent.click(playButton);

  expect(
    screen.getByRole("dialog", { name: /dune: part two trailer/i })
  ).toBeInTheDocument();
  expect(screen.getByTitle("Dune: Part Two trailer")).toHaveAttribute(
    "src",
    "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"
  );

  await userEvent.click(
    screen.getByRole("button", { name: /close trailer/i })
  );
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  );
  expect(playButton).toHaveFocus();
});

test("keeps an invalid trailer from opening a broken player", async () => {
  axios.get.mockResolvedValue({ data: { ...movie, trailerUrl: "#" } });
  renderPage();

  const playButton = await screen.findByRole("button", {
    name: /trailer unavailable/i,
  });
  expect(playButton).toBeDisabled();
  fireEvent.click(playButton);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("preserves showtime booking data and seat navigation", async () => {
  jest.useFakeTimers().setSystemTime(new Date("2026-07-28T00:00:00.000Z"));
  renderPage();

  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

  fireEvent.click(screen.getByRole("button", { name: "10:30 AM" }));

  expect(screen.getByText("Seat selection destination")).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("selectedMovie"))).toMatchObject({
    movieId: "movie-1",
    movieTitle: "Dune: Part Two",
    theaterName: "CineWorld - Downtown",
    showTime: "10:30 AM",
  });
});
