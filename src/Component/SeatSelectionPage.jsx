import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import moment from "moment";

const SeatSelectionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // State management
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [blockProceed, setBlockProceed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [movie, setMovie] = useState(null);
  const [theater, setTheater] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const backendUrl = process.env.BACKEND_URL;


  // Constants
  const REFRESH_INTERVAL_TIME = 30000; // Increased to 30 seconds to reduce server load
  const MAX_SEATS = 10;
  const TICKET_PRICE = 180;

  // Refs
  const refreshInterval = useRef(null);
  const selectedSeatsRef = useRef([]); // Track selected seats to prevent deselection

  // Get booking data once
  const bookingData = useMemo(() => {
    return JSON.parse(localStorage.getItem("selectedMovie")) || {};
  }, []);

  const {
    movieId,
    movieTitle,
    movieImage,
    movieBanner,
    movieRating,
    movieDuration,
    movieGenres,
    movieCertificate,
    theaterName,
    theaterAddress,
    theaterScreen,
    dateDisplay: selectedDate,
    showTime: selectedTime,
  } = bookingData;

  // Seat layout configuration
  const rows = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const seatsPerRow = 12;

  // Memoized format functions
  const formatDateForComparison = useCallback((dateStr) => {
    const [day, month] = dateStr.split(" ");
    const monthMap = {
      Jan: "01",
      Feb: "02",
      Mar: "03",
      Apr: "04",
      May: "05",
      Jun: "06",
      Jul: "07",
      Aug: "08",
      Sep: "09",
      Oct: "10",
      Nov: "11",
      Dec: "12",
    };
    const year = new Date().getFullYear();
    return `${year}-${monthMap[month]}-${day.padStart(2, "0")}`;
  }, []);

  const formatTimeForComparison = useCallback((timeStr) => {
    const [time, period] = timeStr.split(" ");
    let [hours, minutes] = time.split(":");
    if (period === "PM" && hours !== "12") hours = String(parseInt(hours) + 12);
    if (period === "AM" && hours === "12") hours = "00";
    return `${hours.padStart(2, "0")}:${minutes}`;
  }, []);

  // Generate seats with memoization
  const generateSeats = useCallback(
    (bookedSeats = [], currentSelectedSeats = []) => {
      const seatsArray = [];
      rows.forEach((row) => {
        for (let i = 1; i <= seatsPerRow; i++) {
          if (i === 4 || i === 9) continue; // Skip aisle seats
          const seatId = `${row}${i}`;
          seatsArray.push({
            id: seatId,
            row,
            number: i,
            status: bookedSeats.includes(seatId)
              ? "unavailable"
              : currentSelectedSeats.includes(seatId)
              ? "selected"
              : "available",
          });
        }
      });
      return seatsArray;
    },
    []
  );

  // Fetch booked seats with optimization
  const fetchBookedSeats = useCallback(async () => {
    try {
      setError(null);

      if (!movieId || !selectedDate || !selectedTime || !theaterName) {
        throw new Error("Missing booking information");
      }

      const token = localStorage.getItem("token");
      let response;

      try {
        response = await fetch(`${backendUrl}/api/tickets`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.data && data.data.length > 0) {
          const formattedDate = moment(selectedDate).format("YYYY-MM-DD");

          const relevantTickets = data.data.filter((ticket) => {
            return (
              ticket.movie_id === movieId &&
              ticket.theater_name === theaterName &&
              ticket.screen === theaterScreen
            );
          });

          if (relevantTickets.length > 0) {
            const allBookedSeats = relevantTickets.flatMap(
              (ticket) => ticket.seats
            );
            const uniqueBookedSeats = [...new Set(allBookedSeats)];

            setBookedSeats(uniqueBookedSeats);
            setLastUpdated(new Date());

            // Update seats while preserving selected seats
            setSeats(
              generateSeats(uniqueBookedSeats, selectedSeatsRef.current)
            );

            // Only remove selected seats if they've been booked by someone else
            const conflictingSeats = selectedSeatsRef.current.filter((seat) =>
              uniqueBookedSeats.includes(seat)
            );

            if (conflictingSeats.length > 0) {
              setSelectedSeats((prev) => {
                const newSelection = prev.filter(
                  (seat) => !uniqueBookedSeats.includes(seat)
                );
                selectedSeatsRef.current = newSelection;
                return newSelection;
              });
              setError(
                "Some of your selected seats have been booked by others. Please select different seats."
              );
            }

            return;
          }
        }
      } catch (tokenError) {
        console.log("Token-based fetch failed, falling back to localStorage");
      }

      // Fallback to localStorage
      const allBookings = JSON.parse(localStorage.getItem("allBookings")) || [];
      const formattedDate = formatDateForComparison(selectedDate);
      const formattedTime = formatTimeForComparison(selectedTime);

      const relevantBookings = allBookings.filter((booking) => {
        return (
          booking.movieId === movieId &&
          booking.date === formattedDate &&
          booking.time === formattedTime &&
          booking.theaterName === theaterName &&
          booking.theaterScreen === theaterScreen
        );
      });

      const allBookedSeats = relevantBookings.flatMap(
        (booking) => booking.selectedSeats || []
      );

      const uniqueBookedSeats = [...new Set(allBookedSeats)];
      setBookedSeats(uniqueBookedSeats);
      setLastUpdated(new Date());
      setSeats(generateSeats(uniqueBookedSeats, selectedSeatsRef.current));
    } catch (err) {
      console.error("Error fetching booked seats:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [
    movieId,
    selectedDate,
    selectedTime,
    theaterName,
    theaterScreen,
    formatDateForComparison,
    formatTimeForComparison,
    generateSeats,
  ]);

  // Handle seat selection with limit
  const handleSeatClick = useCallback(
    (seatId) => {
      const seat = seats.find((s) => s.id === seatId);
      if (!seat || seat.status === "unavailable") return;

      setSelectedSeats((prev) => {
        let newSelection;

        if (prev.includes(seatId)) {
          // Deselect seat
          newSelection = prev.filter((id) => id !== seatId);
        } else {
          // Select seat (check limit)
          if (prev.length >= MAX_SEATS) {
            setError(
              `You can select a maximum of ${MAX_SEATS} seats per booking.`
            );
            setTimeout(() => setError(null), 3000);
            return prev;
          }
          newSelection = [...prev, seatId];
        }

        // Update ref to track current selection
        selectedSeatsRef.current = newSelection;

        // Update seats display
        setSeats((currentSeats) =>
          currentSeats.map((s) => ({
            ...s,
            status:
              s.status === "unavailable"
                ? "unavailable"
                : newSelection.includes(s.id)
                ? "selected"
                : "available",
          }))
        );

        return newSelection;
      });
    },
    [seats]
  );

  // Initialize component
  useEffect(() => {
    if (!bookingData || !movieId) {
      navigate("/");
      return;
    }

    setMovie({
      id: movieId,
      title: movieTitle,
      image: movieImage,
      banner: movieBanner,
      rating: movieRating,
      duration: movieDuration,
      genres: movieGenres,
      certificate: movieCertificate,
    });

    setTheater({
      name: theaterName || "",
      address: theaterAddress || "",
      screen: theaterScreen || "Screen 1",
    });

    setSeats(generateSeats([]));
  }, [
    bookingData,
    movieId,
    navigate,
    generateSeats,
    movieTitle,
    movieImage,
    movieBanner,
    movieRating,
    movieDuration,
    movieGenres,
    movieCertificate,
    theaterName,
    theaterAddress,
    theaterScreen,
  ]);

  // Set up periodic refresh
  useEffect(() => {
    fetchBookedSeats();

    refreshInterval.current = setInterval(() => {
      fetchBookedSeats();
    }, REFRESH_INTERVAL_TIME);

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [fetchBookedSeats]);

  // Calculate total price
  const totalPrice = useMemo(
    () => selectedSeats.length * TICKET_PRICE,
    [selectedSeats]
  );

  // Proceed to payment
  const handleProceed = useCallback(() => {
    if (selectedSeats.length === 0) return;

    if (localStorage.getItem("isLoggedIn") !== "true") {
      setShowLoginAlert(true);
      setBlockProceed(true);
      return;
    }

    const unavailableSelected = selectedSeats.some((seatId) =>
      bookedSeats.includes(seatId)
    );

    if (unavailableSelected) {
      setError(
        "Some of your selected seats have been booked by others. Please select different seats."
      );
      return;
    }

    const updatedBookingData = {
      ...bookingData,
      selectedSeats,
      totalPrice,
      ticketPrice: TICKET_PRICE,
      bookingTime: new Date().toISOString(),
    };

    localStorage.setItem("selectedMovie", JSON.stringify(updatedBookingData));

    const allBookings = JSON.parse(localStorage.getItem("allBookings")) || [];
    const formattedDate = formatDateForComparison(selectedDate);
    const formattedTime = formatTimeForComparison(selectedTime);

    allBookings.push({
      movieId,
      movieTitle,
      theaterName,
      theaterScreen,
      date: formattedDate,
      time: formattedTime,
      selectedSeats,
      bookingTime: new Date().toISOString(),
    });

    localStorage.setItem("allBookings", JSON.stringify(allBookings));

    navigate("/payment", {
      state: {
        movie,
        theater,
        selectedDate,
        selectedTime,
        selectedSeats,
      },
      replace: true,
    });
  }, [
    selectedSeats,
    bookedSeats,
    bookingData,
    movie,
    theater,
    selectedDate,
    selectedTime,
    navigate,
    formatDateForComparison,
    formatTimeForComparison,
    movieId,
    movieTitle,
    theaterName,
    theaterScreen,
    totalPrice,
  ]);

  // Loading state
  if (loading && seats.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#5c6ac4] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading seat availability...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!movie || !theater) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#5c6ac4]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow bg-gray-50 py-8">
        <div className="container mx-auto px-6">
          {/* Back button */}
          <button
            onClick={() => (window.location.href = `/movie/${movie.id}`)}
            className="inline-flex items-center text-[#5c6ac4] hover:underline mb-6"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <h1>Back to movie</h1>
          </button>

          {/* Last updated time */}
          {lastUpdated && (
            <div className="text-sm text-gray-500 mb-2">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-red-400 mr-2 flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1                    1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-red-700">{error}</p>
                  {error.includes("Loading") && (
                    <button
                      onClick={() => fetchBookedSeats()}
                      className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Try again
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Login Alert Popup */}
          {showLoginAlert && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    Login Required
                  </h3>
                </div>
                <div className="mb-6">
                  <p className="text-gray-600">
                    You need to login to complete your booking. Please login or
                    create an account to proceed.
                  </p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowLoginAlert(false);
                      setBlockProceed(false);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowLoginAlert(false);
                      setBlockProceed(false);
                      navigate("/login", {
                        state: { from: location.pathname },
                      });
                    }}
                    className="px-4 py-2 bg-[#5c6ac4] text-white rounded-md hover:bg-opacity-90"
                  >
                    Go to Login
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Seat selection header */}
          <section className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Select Your Seats</h1>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <div>
                  <h2 className="font-bold text-lg">{movie?.title}</h2>
                  <p className="text-gray-600">
                    {theater?.name} - {theater?.screen}
                  </p>
                  {theater?.address && (
                    <p className="text-gray-500 text-sm">{theater?.address}</p>
                  )}
                </div>
                <div className="mt-2 md:mt-0">
                  <p className="text-gray-600">
                    {selectedDate} | {selectedTime}
                  </p>
                  <p className="text-sm text-gray-500">
                    Max {MAX_SEATS} seats per booking
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Seat layout */}
          <section className="mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* Screen */}
              <div className="mb-8">
                <div className="w-full h-8 bg-gray-300 rounded-t-3xl mx-auto flex items-center justify-center text-gray-500 text-sm">
                  SCREEN
                </div>
                <div className="w-4/5 h-1 bg-gray-400 rounded-b-3xl mx-auto mb-12"></div>
              </div>

              {/* Seats Grid */}
              <div className="overflow-x-auto">
                <div className="min-w-max">
                  <div className="grid grid-cols-1 gap-6 justify-items-center mb-6">
                    {rows.map((row) => (
                      <div key={row} className="flex items-center">
                        <div className="w-6 font-medium text-gray-500 mr-3">
                          {row}
                        </div>
                        <div className="flex space-x-2">
                          {seats
                            .filter((seat) => seat.row === row)
                            .map((seat) => (
                              <button
                                key={seat.id}
                                className={`w-8 h-8 rounded-t-md flex items-center justify-center text-xs font-medium transition-all duration-200 ${
                                  seat.status === "unavailable"
                                    ? "bg-red-300 text-red-700 cursor-not-allowed"
                                    : seat.status === "selected"
                                    ? "bg-[#5c6ac4] text-white transform scale-110"
                                    : "bg-gray-100 hover:bg-gray-200 text-gray-700 hover:scale-105"
                                }`}
                                onClick={() => handleSeatClick(seat.id)}
                                disabled={seat.status === "unavailable"}
                                title={
                                  seat.status === "unavailable"
                                    ? "This seat is already booked"
                                    : seat.status === "selected"
                                    ? "Click to deselect"
                                    : "Click to select"
                                }
                              >
                                {seat.number}
                              </button>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-6 mt-8 border-t pt-6">
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-t-md bg-gray-100 mr-2"></div>
                  <span className="text-sm text-gray-600">Available</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-t-md bg-[#5c6ac4] mr-2"></div>
                  <span className="text-sm text-gray-600">Selected</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-t-md bg-red-300 mr-2"></div>
                  <span className="text-sm text-gray-600">Booked</span>
                </div>
              </div>
            </div>
          </section>

          {/* Seat info and checkout */}
          <section className="mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-4 md:mb-0">
                  <h3 className="font-medium mb-2">Your Selection</h3>
                  {selectedSeats.length > 0 ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        {selectedSeats.length} seat
                        {selectedSeats.length !== 1 ? "s" : ""} selected
                        {selectedSeats.length === MAX_SEATS && (
                          <span className="text-orange-600 ml-2">
                            (Maximum reached)
                          </span>
                        )}
                      </p>
                      <p className="font-medium">
                        {selectedSeats.sort().join(", ")}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No seats selected yet
                    </p>
                  )}
                </div>

                <div className="md:text-right">
                  <div className="bg-gray-50 p-4 rounded-md mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">
                        Tickets ({selectedSeats.length})
                      </span>
                      <span>
                        ₹{(selectedSeats.length * TICKET_PRICE).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>₹{totalPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    className={`w-full md:w-auto px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                      selectedSeats.length > 0
                        ? "bg-[#5c6ac4] text-white hover:bg-opacity-90 transform hover:scale-105"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                    disabled={selectedSeats.length === 0 || blockProceed}
                    onClick={handleProceed}
                  >
                    {selectedSeats.length > 0
                      ? "Proceed to Payment"
                      : "Select seats to continue"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4 flex">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-sm text-blue-700">
                <p className="mb-1">
                  • You can select up to {MAX_SEATS} seats per booking
                </p>
                <p className="mb-1">
                  • Red seats are already booked by other customers
                </p>
                <p>
                  • Once you proceed to payment, your seats will be reserved for
                  10 minutes
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SeatSelectionPage;
