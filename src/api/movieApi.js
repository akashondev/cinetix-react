export function normalizeMovies(data) {
  const movies = Array.isArray(data) ? data : data?.movies;
  return Array.isArray(movies)
    ? movies.filter((movie) => movie && typeof movie === "object").map(withDisplayImages)
    : [];
}

function withDisplayImages(movie) {
  const normalized = { ...movie };
  const image = movie.heroImageUrl || movie.image;
  const banner = movie.posterUrl || movie.banner || movie.image;
  if (image) normalized.image = image;
  if (banner) normalized.banner = banner;
  return normalized;
}

export function formatMovieRating(movie) {
  const rating = Number(movie?.rating);
  if (!Number.isFinite(rating) || rating <= 0) return "Not rated";
  return movie?.source === "tmdb"
    ? `${(Math.round(rating * 10) / 10).toFixed(1)}`
    : `${rating}/5`;
}

const MONTHS = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function buildDateKey(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function validDateKey(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
  if (isoMatch) {
    return buildDateKey(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  const humanMatch = raw.match(/^(\d{1,2})\s+([A-Za-z]+),?\s+(\d{2}|\d{4})$/);
  if (!humanMatch) return null;

  const day = Number(humanMatch[1]);
  const month = MONTHS[humanMatch[2].toLowerCase()];
  if (!month) return null;

  const year = humanMatch[3].length === 2
    ? Number(humanMatch[3]) + (Number(humanMatch[3]) >= 70 ? 1900 : 2000)
    : Number(humanMatch[3]);

  return buildDateKey(year, month, day);
}

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function classifyMoviesByReleaseDate(movies, today = new Date()) {
  const result = { nowShowing: [], comingSoon: [] };
  if (!Array.isArray(movies)) return result;

  const todayKey = localDateKey(today);
  movies.forEach((movie) => {
    const releaseKey = validDateKey(movie?.releaseDate);
    if (!releaseKey) return;
    result[releaseKey > todayKey ? "comingSoon" : "nowShowing"].push(movie);
  });
  return result;
}

export function normalizeMovie(data) {
  const movie = data?.movie || data;
  if (!movie || Array.isArray(movie) || typeof movie !== "object") return null;

  return {
    ...withDisplayImages(movie),
    genres: Array.isArray(movie.genres) ? movie.genres : [],
    cast: Array.isArray(movie.cast) ? movie.cast : [],
  };
}
