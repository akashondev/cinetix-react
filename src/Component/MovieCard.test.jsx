import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MovieCard from "./MovieCard";

const movie = {
  _id: "movie-1",
  title: "An Exceptionally Long Movie Title That Must Never Resize Its Card",
  banner: "/poster.jpg",
  rating: 4.8,
  duration: "2h 20m",
  genres: ["Drama", "Thriller", "Mystery"],
  certificate: "UA",
  releaseDate: "2030-07-11",
};

test("now showing card keeps stable geometry and route", () => {
  render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><MovieCard {...movie} category="now-showing" /></MemoryRouter>);
  const card = screen.getByTestId("movie-card");
  expect(card).toHaveClass("h-[30rem]", "w-full", "min-w-0");
  expect(screen.getByRole("heading", { name: movie.title })).toHaveClass("truncate");
  expect(screen.getByRole("heading", { name: movie.title })).toHaveAttribute("title", movie.title);
  expect(screen.getByRole("link", { name: /book tickets/i })).toHaveAttribute("href", "/movie/movie-1");
});

test("coming soon card keeps release information without booking action", () => {
  render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><MovieCard {...movie} category="coming-soon" /></MemoryRouter>);
  expect(screen.getByText(/release date:/i)).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /book tickets/i })).not.toBeInTheDocument();
});
