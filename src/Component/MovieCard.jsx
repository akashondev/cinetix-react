import React from "react";
import { Link } from "react-router-dom";
import { Clock3, Star } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

function formatCardRating(value) {
  const rating = Number(value);
  return Number.isFinite(rating) && rating > 0
    ? `${Math.round(rating * 10) / 10}`
    : "N/A";
}

export default function MovieCard({
  _id,
  title = "Interstellar",
  image,
  banner,
  rating,
  duration = "2h 49m",
  genres = ["Sci-Fi", "Adventure"],
  category = "now-showing",
  releaseDate,
}) {
  const reduceMotion = useReducedMotion();
  const ratingLabel = formatCardRating(rating);
  const hasRating = ratingLabel !== "N/A";
  const poster = banner || image || "/api/placeholder/260/360?text=Movie";

  const formattedReleaseDate = releaseDate
    ? new Date(releaseDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "TBD";

  const visibleGenres = Array.isArray(genres) ? genres.slice(0, 2) : [];
  const remainingGenres = Math.max(
    (Array.isArray(genres) ? genres.length : 0) - visibleGenres.length,
    0,
  );

  return (
    <motion.article
      data-testid="movie-card"
      whileHover={reduceMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="group flex h-[27rem] w-full min-w-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-xl"
    >
      <div className="relative h-[18rem] flex-none overflow-hidden bg-gray-200">
        <img
          src={poster}
          alt={`${title} poster`}
          loading="lazy"
          className="h-full w-full object-cover"
        />

        <span className="absolute right-0 top-0 flex items-center gap-1 rounded bg-[#5c6ac4] px-2 py-1 text-xs font-semibold text-white shadow-sm">
          {hasRating && (
            <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
          )}
          {ratingLabel}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4">
        <h3
          className="truncate text-base font-bold text-gray-950"
          title={title}
        >
          {title}
        </h3>

        <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-gray-500">
          <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{duration}</span>
        </div>

        <div className="mt-3 flex h-6 items-center gap-1.5 overflow-hidden">
          {visibleGenres.map((genre) => (
            <span
              key={genre}
              title={genre}
              className="max-w-[6rem] truncate rounded bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600"
            >
              {genre}
            </span>
          ))}

          {remainingGenres > 0 && (
            <span className="text-[11px] font-semibold text-gray-400">
              +{remainingGenres}
            </span>
          )}
        </div>

        {category === "now-showing" ? (
          <Link
            to={`/movie/${_id}`}
            className="mt-auto flex h-9 items-center justify-center rounded-md bg-[#5c6ac4] px-3 text-sm font-semibold text-white transition-colors hover:bg-[#4d5ab5] focus:outline-none focus:ring-2 focus:ring-[#5c6ac4] focus:ring-offset-2"
          >
            Book Tickets
          </Link>
        ) : (
          <div className="mt-auto border-t border-gray-100 pt-3 text-xs text-gray-500">
            <span className="font-medium text-gray-700">Release Date:</span>{" "}
            {formattedReleaseDate}
          </div>
        )}
      </div>
    </motion.article>
  );
}
