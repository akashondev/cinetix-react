import React from "react";
import { Link } from "react-router-dom";

const MovieCard = ({
  _id,
  title = "Interstellar",
  banner = "/api/placeholder/260/360?text=Movie",
  rating = 4.5,
  duration = "2h 49m",
  genres = ["Sci-Fi", "Adventure"],
  certificate = "PG-13",
  category = "now-showing", // default category
  releaseDate, // Added releaseDate prop
}) => {
  // Format release date to 'Month Day, Year'
  const formattedReleaseDate = releaseDate
    ? new Date(releaseDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "TBD";

  return (
    <div className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 w-64 h-110">
      {/* Movie Poster */}
      <div className="relative h-80">
        <img src={banner} alt={title} className="w-full h-full object-cover" />
        <div className="absolute top-0 left-0 bg-black bg-opacity-50 text-white px-2 py-1 text-xs">
          {certificate}
        </div>
        <div className="absolute top-0 right-0 bg-[#5c6ac4] text-white flex items-center px-2 py-1 text-xs">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          {rating}
        </div>
      </div>

      {/* Movie Info */}
      <div className="p-3 bg-white h-30">
        {/* Title - Display full title with a maximum of 2 lines */}
        <h3 className="font-bold text-base mb-1 line-clamp-2">{title}</h3>

        <div className="flex text-gray-600 text-xs mb-1">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {duration}
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-2">
          {genres.map((genre, index) => (
            <span
              key={index}
              className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
            >
              {genre}
            </span>
          ))}
        </div>

        {/* Show release date for coming soon movies */}
        {category === "coming-soon" && (
          <div className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
            Release Date: {formattedReleaseDate}
          </div>
        )}

        {/* Show Book Button only if category is now-showing */}
        {category === "now-showing" && (
          <Link
            to={`/movie/${_id}`}
            className="block text-center w-full py-1 rounded-md bg-[#5c6ac4] text-white text-sm font-medium hover:bg-opacity-90 transition-all"
          >
            Book Tickets
          </Link>
        )}
      </div>
    </div>
  );
};

export default MovieCard;
