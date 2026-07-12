import { normalizeMovie, normalizeMovies } from "./movieApi";

const movie = { _id: "movie-1", title: "Movie" };

test("normalizes direct and wrapped movie arrays", () => {
  expect(normalizeMovies([movie])).toEqual([movie]);
  expect(normalizeMovies({ movies: [movie] })).toEqual([movie]);
});

test("defaults malformed movie collections to an empty array", () => {
  expect(normalizeMovies(null)).toEqual([]);
  expect(normalizeMovies({ movies: {} })).toEqual([]);
});

test("normalizes a single movie and its array fields", () => {
  expect(normalizeMovie({ movie: { ...movie, genres: null, cast: "Actor" } })).toEqual({
    ...movie,
    genres: [],
    cast: [],
  });
  expect(normalizeMovie(null)).toBeNull();
});
