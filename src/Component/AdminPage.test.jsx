import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminPage from "./AdminPage";

const movie = {
  _id: "movie-1",
  id: 1,
  title: "Dune: Part Two",
  image: "/backdrop.jpg",
  banner: "/poster.jpg",
  rating: 4.8,
  duration: "2h 46m",
  genres: ["Sci-Fi"],
  certificate: "PG-13",
  releaseDate: "2035-03-01",
  director: "Denis Villeneuve",
  cast: ["Timothée Chalamet"],
  description: "Paul Atreides returns.",
  trailerUrl: "#",
  category: "comingSoon",
};

beforeEach(() => {
  localStorage.setItem("adminToken", "admin-token");
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => [movie],
  });
});

afterEach(() => {
  localStorage.clear();
  jest.restoreAllMocks();
});

test("keeps certificate data out of movie management", async () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AdminPage />
    </MemoryRouter>
  );

  expect(await screen.findAllByText(movie.title)).toHaveLength(2);
  expect(screen.queryByText(movie.certificate, { exact: false })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Movies" }));
  fireEvent.click(screen.getByRole("button", { name: "Add Movie" }));

  expect(screen.queryByText("Certificate")).not.toBeInTheDocument();
});

test("refreshes the movie list after admin deletion completes", async () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AdminPage />
    </MemoryRouter>
  );

  expect(await screen.findAllByText(movie.title)).toHaveLength(2);
  fireEvent.click(screen.getByRole("button", { name: "Movies" }));
  expect(await screen.findByRole("button", { name: "Delete" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Delete" }));

  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(3));
  expect(global.fetch.mock.calls[1][1]).toMatchObject({ method: "DELETE" });
  expect(global.fetch.mock.calls[2][0]).toContain("/movies?includeInactive=true");
});
