import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import axios from "axios";
import {
  CalendarDays,
  MapPin,
  Play,
  Ticket,
} from "lucide-react";
import { API_URL } from "../config/api";
import { normalizeMovie } from "../api/movieApi";
import TrailerModal from "./TrailerModal";
import { getYouTubeEmbedUrl } from "./trailerUrl";

const MovieDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedTheater, setSelectedTheater] = useState(0);
  const [selectedTime, setSelectedTime] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [theatersLoading, setTheatersLoading] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  const fetchMovie = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/movies/${id}`);
      const nextMovie = normalizeMovie(response.data);

      if (nextMovie) {
        setMovie(nextMovie);

        // Check if there's saved selection in localStorage for this movie
        const savedSelection = JSON.parse(
          localStorage.getItem("movieSelection")
        );
        if (savedSelection && savedSelection.movieId === id) {
          setSelectedDate(savedSelection.dateIndex || 0);
          setSelectedTheater(savedSelection.theaterIndex || 0);
        }
      } else {
        navigate("/not-found");
      }
    } catch (error) {
      console.error("Error fetching movie:", error);
      setMovie(null);
      if (error.response?.status === 404) {
        navigate("/not-found");
      } else {
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchMovie();
  }, [fetchMovie]);

  useEffect(() => {
    const updateCurrentDateTime = () => {
      const options = {
        timeZone: "Asia/Kolkata",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };

      const dateTimeIST = new Date().toLocaleString("en-IN", options);
      setCurrentDateTime(dateTimeIST);
    };

    updateCurrentDateTime();
    const timer = setInterval(updateCurrentDateTime, 60000);

    return () => clearInterval(timer);
  }, []);

  // Handle date selection with loading animation
  const handleDateSelection = (dateId) => {
    if (dateId !== selectedDate) {
      setTheatersLoading(true);
      setSelectedTime(null); // Reset selected time when date changes

      // Simulate loading delay for theater data
      setTimeout(() => {
        setSelectedDate(dateId);
        setTheatersLoading(false);
      }, 500); // 800ms loading animation
    }
  };

  // Generate dates dynamically based on current date
  const generateDates = () => {
    const dates = [];
    const today = new Date();

    // Set to IST timezone
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours and 30 minutes in milliseconds
    const utcTime = today.getTime() + today.getTimezoneOffset() * 60 * 1000;
    const istTime = new Date(utcTime + istOffset);

    // Get current year
    const currentYear = istTime.getFullYear();

    for (let i = 0; i < 6; i++) {
      const date = new Date(istTime);
      date.setDate(date.getDate() + i);

      const day =
        i === 0
          ? "Today"
          : date.toLocaleDateString("en-IN", { weekday: "short" });
      const dateStr = date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      });

      dates.push({
        id: i,
        day: day,
        date: dateStr,
        fullDate: date,
        isoDate: date.toISOString().slice(0, 10),
        year: currentYear,
      });
    }

    return dates;
  };

  const dates = generateDates();

  // Sample theaters with IST show times
  const theaters = [
    {
      id: 0,
      name: "CineWorld - Downtown",
      address: "123 Main St, Downtown",
      showTimes: ["10:30 AM", "01:15 PM", "04:00 PM", "07:30 PM", "10:15 PM"],
      screen: "Screen 1",
    },
    {
      id: 1,
      name: "Starlight Cinema",
      address: "456 Park Ave, Westside",
      showTimes: ["11:00 AM", "02:30 PM", "06:00 PM", "09:30 PM"],
      screen: "Screen 2",
    },
    {
      id: 2,
      name: "Silver Screen Multiplex",
      address: "789 Broadway, Northside",
      showTimes: ["12:15 PM", "03:30 PM", "07:00 PM", "10:00 PM"],
      screen: "Screen 3",
    },
  ];

  // Function to handle booking
  const handleBooking = (time, theaterId) => {
    setSelectedTime(time);
    setSelectedTheater(theaterId);

    // Get the correct theater data based on the theater where the time was selected
    const theaterData = theaters.find((theater) => theater.id === theaterId);
    const selectedDateData = dates[selectedDate];

    // Prepare the complete booking data
    const bookingData = {
      movieId: movie._id,
      movieTitle: movie.title,
      movieImage: movie.image,
      movieBanner: movie.banner,
      movieRating: movie.rating,
      movieDuration: movie.duration,
      movieGenres: movie.genres,
      movieCertificate: movie.certificate,

      // Date information
      dateIndex: selectedDate,
      dateDisplay: selectedDateData.date,
      dateFull: selectedDateData.fullDate,
      dateISO: selectedDateData.isoDate,
      dayName: selectedDateData.day,

      // Theater information
      theaterIndex: theaterId,
      theaterName: theaterData.name,
      theaterAddress: theaterData.address,
      theaterScreen: theaterData.screen,

      // Time information
      showTime: time,
      showTimeFormatted: formatTimeForBooking(time),

      // Timestamp when this selection was made
      selectedAt: new Date().toISOString(),
    };

    // Save to localStorage in two formats for different use cases
    localStorage.setItem(
      "movieSelection",
      JSON.stringify({
        movieId: movie._id,
        dateIndex: selectedDate,
        theaterIndex: theaterId,
        showTime: time,
      })
    );

    localStorage.setItem("selectedMovie", JSON.stringify(bookingData));

    // Navigate to seats page with all necessary parameters
    navigate(
      `/seats?movie=${movie._id}&date=${selectedDateData.date}&theater=${
        theaterData.id
      }&time=${formatTimeForBooking(time)}`
    );
  };

  // Helper function to format time for URL
  const formatTimeForBooking = (timeStr) => {
    return encodeURIComponent(timeStr);
  };

  // Check if a showtime is past current time
  const isShowtimePassed = (timeStr) => {
    if (selectedDate > 0) return false; // Future dates are always valid

    const now = new Date();
    // Convert to IST
    const istOffset = 5.5 * 60 * 60 * 1000;
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
    const istTime = new Date(utcTime + istOffset);

    const [time, period] = timeStr.split(" ");
    const [hours, minutes] = time.split(":").map(Number);

    let showHours = hours;
    if (period === "PM" && hours !== 12) {
      showHours += 12;
    } else if (period === "AM" && hours === 12) {
      showHours = 0;
    }

    if (istTime.getHours() > showHours) {
      return true;
    } else if (
      istTime.getHours() === showHours &&
      istTime.getMinutes() >= minutes
    ) {
      return true;
    }

    return false;
  };

  // Filter available showtimes (remove passed times)
  const getAvailableShowtimes = (showTimes) => {
    return showTimes.filter((time) => !isShowtimePassed(time));
  };

  const closeTrailer = useCallback(() => {
    setIsTrailerOpen(false);
  }, []);

  const trailerEmbedUrl = getYouTubeEmbedUrl(movie?.trailerUrl);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080808]">
        <div
          className="h-14 w-14 animate-spin rounded-full border-2 border-white/15 border-t-[#8f9af0]"
          aria-label="Loading movie"
        />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080808] text-white">
        <div className="text-xl">Movie not found</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-white">
      <Navbar />

      <header className="relative bg-black">
        <div className="relative h-[25rem] overflow-hidden bg-black sm:h-[31rem] lg:h-[38rem]">
          {movie.image && (
            <img
              src={movie.image}
              alt={`${movie.title} backdrop`}
              className="h-full w-full object-cover"
            />
          )}
          <div
            data-testid="hero-fade"
            className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#080808] via-[#080808]/70 to-transparent"
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={() => setIsTrailerOpen(true)}
            disabled={!trailerEmbedUrl}
            aria-label={
              trailerEmbedUrl
                ? `Play ${movie.title} trailer`
                : "Trailer unavailable"
            }
            className="absolute left-1/2 top-[42%] flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-black/60 text-white shadow-2xl backdrop-blur-sm transition duration-200 hover:scale-105 hover:bg-[#5c6ac4] focus:outline-none focus:ring-2 focus:ring-[#8f9af0] focus:ring-offset-4 focus:ring-offset-black disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100 disabled:hover:bg-black/60 sm:h-20 sm:w-20"
          >
            <Play
              className="ml-1 h-7 w-7 fill-current sm:h-9 sm:w-9"
              aria-hidden="true"
            />
          </button>
        </div>
      </header>

      <main className="flex-grow">
        <div className="relative z-10 mx-auto -mt-24 max-w-7xl px-4 pb-12 sm:px-6 lg:-mt-32 lg:px-8">
          <div className="mb-5 text-right text-xs text-white/45">
            All showtimes in IST · {currentDateTime}
          </div>

          <section className="mb-14" aria-labelledby="movie-title">
            <div className="grid gap-7 md:grid-cols-[13rem_1fr] md:items-end lg:grid-cols-[15rem_1fr] lg:gap-10">
              <div className="mx-auto w-44 sm:w-52 md:mx-0 md:w-full">
                <div className="aspect-[2/3] overflow-hidden rounded-xl border border-white/15 bg-[#151515] shadow-2xl shadow-black/70">
                  <img
                    src={movie.banner || movie.image}
                    alt={`${movie.title} poster`}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              <div className="min-w-0 pb-1 text-center md:text-left">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#aeb5ff]">
                  Now showing at CineTix
                </p>
                <h1
                  id="movie-title"
                  className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
                >
                  {movie.title}
                </h1>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 text-sm md:justify-start">
                  <div className="flex items-center rounded-md bg-[#5c6ac4] px-3 py-1.5 font-semibold text-white">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>{movie.rating}/5</span>
                  </div>

                  <div className="flex items-center rounded-md border border-white/15 bg-black/40 px-3 py-1.5 text-white/85">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
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
                    <span>{movie.duration}</span>
                  </div>

                  <div className="rounded-md border border-white/15 bg-black/40 px-3 py-1.5 text-white/85">
                    {movie.certificate}
                  </div>

                  {movie.genres.map((genre, index) => (
                    <span
                      key={index}
                      className="rounded-md border border-white/15 bg-black/40 px-3 py-1.5 text-white/75"
                    >
                      {genre}
                    </span>
                  ))}
                </div>

                <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-white/70 md:mx-0 sm:text-base">
                  {movie.description}
                </p>

                <div className="mt-6 grid gap-5 border-t border-white/10 pt-5 sm:grid-cols-2">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45">Director</h3>
                    <p className="mt-1 text-sm font-medium text-white">{movie.director}</p>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45">
                      Release Date
                    </h3>
                    <p className="mt-1 text-sm font-medium text-white">{movie.releaseDate}</p>
                  </div>
                </div>

                <div className="mt-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45">Cast</h3>
                  <div className="mt-2 flex flex-wrap justify-center gap-2 md:justify-start">
                    {movie.cast.map((actor, index) => (
                      <span
                        key={index}
                        className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-sm text-white/75"
                      >
                        {actor}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-4 border-t border-white/10 pt-10" aria-labelledby="showtimes-heading">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#aeb5ff]">
              <Ticket className="h-4 w-4" aria-hidden="true" />
              Reserve your seats
            </p>
            <h2 id="showtimes-heading" className="mb-8 text-2xl font-bold sm:text-3xl">
              Showtimes & Tickets
            </h2>

            {/* Date Selection */}
            <div className="mb-9">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/80">
                <CalendarDays className="h-5 w-5 text-[#8f9af0]" aria-hidden="true" />
                Select Date
              </h3>

              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
                {dates.map((date) => (
                  <button
                    key={date.id}
                    type="button"
                    className={`rounded-lg border px-2 py-3 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#8f9af0] ${
                      selectedDate === date.id
                        ? "border-[#5c6ac4] bg-[#5c6ac4] text-white"
                        : "border-white/10 bg-white/[0.04] text-white/75 hover:border-[#5c6ac4] hover:bg-white/[0.07]"
                    }`}
                    onClick={() => handleDateSelection(date.id)}
                  >
                    <div className="font-medium">{date.day}</div>
                    <div
                      className={`text-sm ${
                        selectedDate === date.id
                          ? "text-white"
                          : "text-white/40"
                      }`}
                    >
                      {date.date}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/80">
                <MapPin className="h-5 w-5 text-[#8f9af0]" aria-hidden="true" />
                Select Theater
                {theatersLoading && (
                  <div className="ml-1 h-4 w-4 animate-spin rounded-full border-2 border-[#8f9af0] border-t-transparent" />
                )}
              </h3>

              {theatersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((index) => (
                    <div
                      key={index}
                      className="animate-pulse rounded-xl border border-white/10 bg-white/[0.04] p-5"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="mb-2 h-5 w-48 rounded bg-white/15"></div>
                          <div className="h-4 w-64 rounded bg-white/10"></div>
                        </div>
                        <div className="h-4 w-32 rounded bg-white/10"></div>
                      </div>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4].map((timeIndex) => (
                          <div
                            key={timeIndex}
                            className="h-8 w-20 rounded bg-white/10"
                          ></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {theaters.map((theater) => {
                    const availableShowtimes = getAvailableShowtimes(
                      theater.showTimes
                    );

                    return (
                      <div
                        key={theater.id}
                        className={`rounded-xl border p-5 transition-colors ${
                          selectedTheater === theater.id
                            ? "border-[#5c6ac4] bg-[#5c6ac4]/10"
                            : "border-white/10 bg-white/[0.035] hover:border-white/25"
                        }`}
                        onClick={() => setSelectedTheater(theater.id)}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-semibold text-white">
                              {theater.name}
                            </h4>
                            <p className="mt-1 text-sm text-white/45">
                              {theater.address}
                            </p>
                            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-white/35">
                              {theater.screen}
                            </p>
                          </div>

                          <div
                            className={`mt-2 sm:mt-0 ${
                              selectedTheater === theater.id
                                ? "text-[#aeb5ff]"
                                : "text-white/45"
                            }`}
                          >
                            <span className="text-sm font-medium">
                              {availableShowtimes.length} showtimes available
                              (IST)
                            </span>
                          </div>
                        </div>

                        {availableShowtimes.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {availableShowtimes.map((time, index) => (
                              <button
                                key={index}
                                type="button"
                                className={`rounded-md border px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#8f9af0] ${
                                  selectedTheater === theater.id &&
                                  selectedTime === time
                                    ? "border-[#5c6ac4] bg-[#5c6ac4] text-white"
                                    : "border-white/10 bg-black/30 text-white/80 hover:border-[#5c6ac4] hover:text-white"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBooking(time, theater.id);
                                }}
                              >
                                {time}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-white/40">
                            No showtimes available for today
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
      <TrailerModal
        isOpen={isTrailerOpen}
        title={movie.title}
        embedUrl={trailerEmbedUrl}
        onClose={closeTrailer}
      />
    </div>
  );
};

export default MovieDetailPage;
