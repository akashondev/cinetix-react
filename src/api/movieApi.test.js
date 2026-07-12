import { classifyMoviesByReleaseDate, normalizeMovie, normalizeMovies } from "./movieApi";

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

test("classifies movies by release date instead of stale category", () => {
  const past = { ...movie, _id: "past", releaseDate: "2026-07-11", category: "comingSoon" };
  const today = { ...movie, _id: "today", releaseDate: "2026-07-12T23:30:00.000Z", category: "comingSoon" };
  const future = { ...movie, _id: "future", releaseDate: "2026-07-13", category: "nowShowing" };

  expect(classifyMoviesByReleaseDate([past, today, future], new Date(2026, 6, 12))).toEqual({
    nowShowing: [past, today],
    comingSoon: [future],
  });
});

test("parses the release date formats returned by the movies API", () => {
  const nowShowingOne = { ...movie, _id: "now-1", releaseDate: "16 May 2019" };
  const nowShowingTwo = { ...movie, _id: "now-2", releaseDate: "4 July 2025" };
  const nowShowingThree = { ...movie, _id: "now-3", releaseDate: "18 Apr, 20" };
  const nowShowingFour = { ...movie, _id: "now-4", releaseDate: "17 May, 2025" };
  const nowShowingFive = { ...movie, _id: "now-5", releaseDate: " 29 May 2026" };
  const comingSoon = { ...movie, _id: "soon", releaseDate: "13 July 2026" };
  const caseInsensitive = { ...movie, _id: "case", releaseDate: "13 jUl 2026" };
  const impossible = { ...movie, _id: "impossible", releaseDate: "31 Feb 2026" };

  expect(
    classifyMoviesByReleaseDate(
      [nowShowingOne, nowShowingTwo, nowShowingThree, nowShowingFour, nowShowingFive, comingSoon, caseInsensitive, impossible],
      new Date(2026, 6, 12)
    )
  ).toEqual({
    nowShowing: [nowShowingOne, nowShowingTwo, nowShowingThree, nowShowingFour, nowShowingFive],
    comingSoon: [comingSoon, caseInsensitive],
  });
});

test("excludes movies with missing or invalid release dates", () => {
  const missing = { ...movie, _id: "missing" };
  const malformed = { ...movie, _id: "malformed", releaseDate: "soon" };
  const impossible = { ...movie, _id: "impossible", releaseDate: "2026-02-31" };

  expect(classifyMoviesByReleaseDate([missing, malformed, impossible], new Date(2026, 6, 12))).toEqual({
    nowShowing: [],
    comingSoon: [],
  });
});
