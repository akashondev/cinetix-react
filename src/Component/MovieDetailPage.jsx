import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import axios from "axios";

const MovieDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedTheater, setSelectedTheater] = useState(0);
  const [selectedTime, setSelectedTime] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [theatersLoading, setTheatersLoading] = useState(false);

  const fetchMovie = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:3000/api/movies/${id}`
      );

      if (response.data) {
        setMovie(response.data);

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

      // Set current date and time in IST
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
    } catch (error) {
      console.error("Error fetching movie:", error);
      if (error.response?.status === 404) {
        navigate("/not-found");
      } else {
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovie();
  }, [id]);

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
        isoDate: date.toISOString(),
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#5c6ac4]"></div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Movie not found</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Movie Banner */}
      <div className="relative h-80 bg-black">
        <img
          src={movie.image}
          alt={`${movie.title} banner`}
          className="w-full h-full object-cover opacity-50"
        />
      </div>

      {/* Main Content */}
      <main className="flex-grow bg-gray-50 py-8">
        <div className="container mx-auto px-6">
          {/* Current IST Time Display */}
          <div className="mb-6 text-right text-sm text-gray-500">
            Current IST Time: {currentDateTime}
          </div>

          {/* Movie Info Section */}
          <section className="mb-12">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Movie Poster */}
              <div className="md:w-1/3 lg:w-1/4">
                <div className="rounded-lg overflow-hidden shadow-lg w-80">
                  <img
                    src={movie.banner}
                    alt={`${movie.title}`}
                    className="w-full"
                  />
                </div>

                <div className="mt-6">
                  <a
                    href={movie.trailerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-80 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Watch Trailer
                  </a>
                </div>
              </div>

              {/* Movie Details */}
              <div className="md:w-2/3 lg:w-3/4">
                <h1 className="text-3xl font-bold mb-2">{movie.title}</h1>

                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="flex items-center bg-[#5c6ac4] text-white px-2 py-1 rounded">
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

                  <div className="flex items-center text-gray-600">
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

                  <div className="bg-gray-200 text-gray-700 px-2 py-1 rounded">
                    {movie.certificate}
                  </div>

                  {movie.genres.map((genre, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 px-2 py-1 rounded"
                    >
                      {genre}
                    </span>
                  ))}
                </div>

                <p className="text-gray-700 mb-6">{movie.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <h3 className="font-semibold text-gray-900">Director</h3>
                    <p className="text-gray-600">{movie.director}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Release Date
                    </h3>
                    <p className="text-gray-600">{movie.releaseDate}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Cast</h3>
                  <div className="flex flex-wrap gap-2">
                    {movie.cast.map((actor, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
                      >
                        {actor}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Showtimes Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Showtimes & Tickets</h2>

            {/* Date Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-[#5c6ac4]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Select Date
              </h3>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {dates.map((date) => (
                  <button
                    key={date.id}
                    className={`p-3 rounded-lg text-center transition-colors ${
                      selectedDate === date.id
                        ? "bg-[#5c6ac4] text-white"
                        : "bg-white border border-gray-200 hover:border-[#5c6ac4]"
                    }`}
                    onClick={() => handleDateSelection(date.id)}
                  >
                    <div className="font-medium">{date.day}</div>
                    <div
                      className={`text-sm ${
                        selectedDate === date.id
                          ? "text-white"
                          : "text-gray-500"
                      }`}
                    >
                      {date.date}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Theater Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-[#5c6ac4]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Select Theater
                {theatersLoading && (
                  <div className="ml-2 animate-spin h-4 w-4 border-2 border-[#5c6ac4] border-t-transparent rounded-full"></div>
                )}
              </h3>

              {theatersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="h-5 bg-gray-300 rounded w-48 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-64"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </div>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4].map((timeIndex) => (
                          <div
                            key={timeIndex}
                            className="h-8 bg-gray-200 rounded w-20"
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
                        className={`p-4 rounded-lg transition-all ${
                          selectedTheater === theater.id
                            ? "bg-white border-2 border-[#5c6ac4] shadow-md"
                            : "bg-white border border-gray-200 hover:border-[#5c6ac4]"
                        }`}
                        onClick={() => setSelectedTheater(theater.id)}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-lg">
                              {theater.name}
                            </h4>
                            <p className="text-gray-500 text-sm">
                              {theater.address}
                            </p>
                          </div>

                          <div
                            className={`mt-2 sm:mt-0 ${
                              selectedTheater === theater.id
                                ? "text-[#5c6ac4]"
                                : "text-gray-500"
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
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                  selectedTheater === theater.id &&
                                  selectedTime === time
                                    ? "bg-[#5c6ac4] text-white"
                                    : "bg-gray-100 hover:bg-gray-200"
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
                          <div className="text-gray-500 text-sm">
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
    </div>
  );
};

export default MovieDetailPage;
