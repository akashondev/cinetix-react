export function normalizeMovies(data) {
  const movies = Array.isArray(data) ? data : data?.movies;
  return Array.isArray(movies) ? movies : [];
}

export function normalizeMovie(data) {
  const movie = data?.movie || data;
  if (!movie || Array.isArray(movie) || typeof movie !== "object") return null;

  return {
    ...movie,
    genres: Array.isArray(movie.genres) ? movie.genres : [],
    cast: Array.isArray(movie.cast) ? movie.cast : [],
  };
}
