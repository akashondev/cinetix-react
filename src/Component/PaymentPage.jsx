import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

const PaymentPage = () => {
  const [cardNumberError, setCardNumberError] = useState("");
  const [cardNameError, setCardNameError] = useState("");
  const [expiryDateError, setExpiryDateError] = useState("");
  const [cvvError, setCvvError] = useState("");
  const [emailError, setEmailError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  // Get data from location state first, then fallback to localStorage
  const {
    movie: locationMovie,
    theater: locationTheater,
    selectedDate,
    selectedTime,
    selectedSeats: locationSelectedSeats,
  } = location.state || {};

  const bookingData = JSON.parse(localStorage.getItem("selectedMovie")) || {};
  const localStorageSelectedSeats =
    JSON.parse(localStorage.getItem("selectedSeats")) || [];

  // Combine data sources - prefer location state over localStorage
  const movie = locationMovie || {
    id: bookingData.movieId,
    title: bookingData.movieTitle,
    image: bookingData.movieImage,
    banner: bookingData.movieBanner,
    rating: bookingData.movieRating,
    duration: bookingData.movieDuration,
    genres: bookingData.movieGenres,
    certificate: bookingData.movieCertificate,
  };

  const theater = locationTheater || {
    name: bookingData.theaterName || "",
    address: bookingData.theaterAddress || "",
    screen: bookingData.theaterScreen || "Screen 1",
  };

  const selectedSeats = locationSelectedSeats || localStorageSelectedSeats;

  // State variables
  const [ticketPrice] = useState(180);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [email, setEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    // const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    console.log(token);

    if (!token) {
      // Redirect to login if not authenticated
      navigate("/login", {
        state: {
          from: location.pathname,
          message: "Please login to complete your booking",
        },
      });
      return;
    }

    // Pre-fill email if user is logged in
    // if (currentUser.email && !email) {
    //   setEmail(currentUser.email);
    // }
  }, [navigate, location.pathname, email]);

  // Validate movie ID format (should be MongoDB ObjectId)
  const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  // Format card number with spaces
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    }
    return value;
  };

  // Calculate totals
  const subtotal = selectedSeats.length * ticketPrice;
  const serviceFee = selectedSeats.length * 1.5;
  const total = subtotal + serviceFee;

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cardNumber || !cardName || !expiryDate || !cvv || !email) {
      alert("Please fill in all fields");
      return;
    }

    // Validate movie ID
    if (!movie.id || !isValidObjectId(movie.id)) {
      alert("Invalid movie ID. Please restart your booking process.");
      navigate("/");
      return;
    }

    setIsProcessing(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login to complete your booking");
        navigate("/login");
        return;
      }

      // Generate booking confirmation
      const bookingConfirmation = {
        id: `booking_${Date.now()}`,
        movie,
        theater,
        selectedSeats,
        selectedDate: selectedDate || bookingData.dateDisplay,
        selectedTime: selectedTime || bookingData.showTime,
        paymentInfo: {
          method: paymentMethod,
          amount: total,
          transactionId: `TXN${Date.now()}`,
          email: email,
        },
        bookingTime: new Date().toISOString(),
        // userId: currentUser._id,
        // userEmail: currentUser.email || email,
        status: "confirmed",
      };

      // Prepare ticket data for API
      const ticketData = {
        movie_id: movie.id, // This should be a valid MongoDB ObjectId
        movie_title: movie.title,
        seats: selectedSeats,
        cinema: theater.name,
        time: selectedTime || bookingData.showTime,
        date: new Date(selectedDate || bookingData.dateDisplay).toISOString(),
        day: new Date(
          selectedDate || bookingData.dateDisplay
        ).toLocaleDateString("en-US", {
          weekday: "long",
        }),
        price: total,
        location: theater.address,
        session_id: bookingConfirmation.id,
      };

      console.log("Submitting ticket data:", ticketData);
      console.log("User token:", token ? "Present" : "Missing");

      // Save to backend API
      try {
        const response = await fetch(`${backendUrl}/tickets`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(ticketData),
        });

        let responseData;
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          responseData = await response.json();
        } else {
          const responseText = await response.text();
          console.error("Non-JSON response:", responseText);
          throw new Error("Server returned invalid response format");
        }

        if (!response.ok) {
          console.error("API Error response:", responseData);

          if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("currentUser");
            alert("Your session has expired. Please login again.");
            navigate("/login", { state: { from: location.pathname } });
            return;
          }

          throw new Error(
            responseData.message || `Server error: ${response.status}`
          );
        }

        console.log("Ticket saved successfully:", responseData);

        // Save booking confirmation locally with server ticket ID
        const finalBookingConfirmation = {
          ...bookingConfirmation,
          ticketId: responseData.data._id,
        };

        localStorage.setItem(
          "bookingConfirmation",
          JSON.stringify(finalBookingConfirmation)
        );

        // Save to all bookings array
        const allBookings =
          JSON.parse(localStorage.getItem("allBookings")) || [];
        allBookings.push(finalBookingConfirmation);
        localStorage.setItem("allBookings", JSON.stringify(allBookings));

        // Clear temporary booking data
        localStorage.removeItem("selectedMovie");
        localStorage.removeItem("selectedSeats");

        setIsProcessing(false);
        setIsComplete(true);

        // Redirect to tickets page
        setTimeout(() => {
          navigate("/ticket", {
            state: {
              bookingConfirmation: finalBookingConfirmation,
              justCompleted: true,
            },
          });
        }, 2000);
      } catch (apiError) {
        console.error("API call failed:", apiError);
        setIsProcessing(false);

        // Show more specific error message
        if (apiError.message.includes("Invalid movie ID")) {
          alert(
            "There was an issue with the movie selection. Please restart your booking."
          );
          navigate("/");
        } else if (apiError.message.includes("Missing required fields")) {
          alert(
            "Some booking information is missing. Please restart your booking."
          );
          navigate("/");
        } else {
          alert(`Booking failed: ${apiError.message}. Please try again.`);
        }
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      setIsProcessing(false);
      alert(`Payment failed: ${error.message}. Please try again.`);
    }
  };

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
          {!isComplete ? (
            <>
              {/* Back button */}
              <button
                onClick={() => navigate(-1)}
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
                <span>Back to seat selection</span>
              </button>

              {/* Page header */}
              <section className="mb-8">
                <h1 className="text-2xl font-bold mb-2">Payment Details</h1>
                <p className="text-gray-600">
                  Complete your booking by providing payment information
                </p>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Payment Form */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    {/* Payment method tabs */}
                    <div className="mb-6">
                      <div className="flex border-b">
                        <button
                          className={`py-2 px-4 font-medium ${
                            paymentMethod === "card"
                              ? "border-b-2 border-[#5c6ac4] text-[#5c6ac4]"
                              : "text-gray-500"
                          }`}
                          onClick={() => setPaymentMethod("card")}
                        >
                          Credit / Debit Card
                        </button>
                      </div>
                    </div>

                    {/* Card payment form */}
                    {paymentMethod === "card" && (
                      <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                          {/* Card Number */}
                          <div>
                            <label className="block text-gray-700 text-sm font-medium mb-2">
                              Card Number
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                className={`w-full px-4 py-2 border ${
                                  cardNumberError
                                    ? "border-red-500"
                                    : "border-gray-300"
                                } rounded-md focus:outline-none focus:ring-2 focus:ring-[#5c6ac4] focus:border-transparent`}
                                placeholder="1234 5678 9012 3456"
                                value={cardNumber}
                                onChange={(e) => {
                                  const formatted = formatCardNumber(
                                    e.target.value
                                  );
                                  setCardNumber(formatted);
                                  // Basic numeric validation only (13 to 16 digits)
                                  const cleaned = formatted.replace(/\s+/g, "");
                                  const isValid = /^[0-9]{13,16}$/.test(
                                    cleaned
                                  );
                                  setCardNumberError(
                                    !isValid && cleaned.length > 0
                                      ? "Invalid card number"
                                      : ""
                                  );
                                }}
                                maxLength={19}
                                required
                              />
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 text-gray-400"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                  />
                                </svg>
                              </div>
                            </div>
                            {cardNumberError && (
                              <p className="text-red-500 text-xs mt-1">
                                {cardNumberError}
                              </p>
                            )}
                          </div>

                          {/* Cardholder Name */}
                          <div>
                            <label className="block text-gray-700 text-sm font-medium mb-2">
                              Cardholder Name
                            </label>
                            <input
                              type="text"
                              className={`w-full px-4 py-2 border ${
                                cardNameError
                                  ? "border-red-500"
                                  : "border-gray-300"
                              } rounded-md focus:outline-none focus:ring-2 focus:ring-[#5c6ac4] focus:border-transparent`}
                              placeholder="John Smith"
                              value={cardName}
                              onChange={(e) => {
                                setCardName(e.target.value);
                                // Validate name (at least 2 characters, only letters and spaces)
                                const isValid = /^[a-zA-Z\s]{2,}$/.test(
                                  e.target.value.trim()
                                );
                                setCardNameError(
                                  !isValid && e.target.value.length > 0
                                    ? "Please enter a valid name"
                                    : ""
                                );
                              }}
                              required
                            />
                            {cardNameError && (
                              <p className="text-red-500 text-xs mt-1">
                                {cardNameError}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            {/* Expiry Date */}
                            <div>
                              <label className="block text-gray-700 text-sm font-medium mb-2">
                                Expiry Date
                              </label>
                              <input
                                type="text"
                                className={`w-full px-4 py-2 border ${
                                  expiryDateError
                                    ? "border-red-500"
                                    : "border-gray-300"
                                } rounded-md focus:outline-none focus:ring-2 focus:ring-[#5c6ac4] focus:border-transparent`}
                                placeholder="MM/YY"
                                value={expiryDate}
                                onChange={(e) => {
                                  let value = e.target.value;
                                  // Auto-insert slash after 2 digits
                                  if (
                                    value.length === 2 &&
                                    !value.includes("/")
                                  ) {
                                    value = value + "/";
                                  }
                                  setExpiryDate(value);

                                  // Validate expiry date
                                  if (value.length === 5) {
                                    const [month, year] = value.split("/");
                                    const currentYear =
                                      new Date().getFullYear() % 100;
                                    const currentMonth =
                                      new Date().getMonth() + 1;

                                    const isValid =
                                      /^\d{2}$/.test(month) &&
                                      /^\d{2}$/.test(year) &&
                                      parseInt(month) >= 1 &&
                                      parseInt(month) <= 12 &&
                                      (parseInt(year) > currentYear ||
                                        (parseInt(year) === currentYear &&
                                          parseInt(month) >= currentMonth));

                                    setExpiryDateError(
                                      !isValid ? "Invalid expiry date" : ""
                                    );
                                  } else {
                                    setExpiryDateError(
                                      value.length > 0 ? "Invalid format" : ""
                                    );
                                  }
                                }}
                                maxLength={5}
                                required
                              />
                              {expiryDateError && (
                                <p className="text-red-500 text-xs mt-1">
                                  {expiryDateError}
                                </p>
                              )}
                            </div>

                            {/* CVV */}
                            <div>
                              <label className="block text-gray-700 text-sm font-medium mb-2">
                                CVV
                              </label>
                              <input
                                type="text"
                                className={`w-full px-4 py-2 border ${
                                  cvvError
                                    ? "border-red-500"
                                    : "border-gray-300"
                                } rounded-md focus:outline-none focus:ring-2 focus:ring-[#5c6ac4] focus:border-transparent`}
                                placeholder="123"
                                value={cvv}
                                onChange={(e) => {
                                  // Only allow numbers
                                  const value = e.target.value.replace(
                                    /\D/g,
                                    ""
                                  );
                                  setCvv(value);
                                  // Validate CVV (3 or 4 digits)
                                  const isValid = /^[0-9]{3,4}$/.test(value);
                                  setCvvError(
                                    !isValid && value.length > 0
                                      ? "Invalid CVV"
                                      : ""
                                  );
                                }}
                                maxLength={4}
                                required
                              />
                              {cvvError && (
                                <p className="text-red-500 text-xs mt-1">
                                  {cvvError}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Email */}
                          <div>
                            <label className="block text-gray-700 text-sm font-medium mb-2">
                              Email (for receipt)
                            </label>
                            <input
                              type="email"
                              className={`w-full px-4 py-2 border ${
                                emailError
                                  ? "border-red-500"
                                  : "border-gray-300"
                              } rounded-md focus:outline-none focus:ring-2 focus:ring-[#5c6ac4] focus:border-transparent`}
                              placeholder="your@email.com"
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value);
                                // Basic email validation
                                const isValid =
                                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                                    e.target.value
                                  );
                                setEmailError(
                                  !isValid && e.target.value.length > 0
                                    ? "Invalid email address"
                                    : ""
                                );
                              }}
                              required
                            />
                            {emailError && (
                              <p className="text-red-500 text-xs mt-1">
                                {emailError}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-8">
                          <button
                            type="submit"
                            className={`w-full py-3 font-medium rounded-md transition-colors ${
                              isProcessing
                                ? "bg-gray-400 text-white cursor-not-allowed"
                                : "bg-[#5c6ac4] text-white hover:bg-opacity-90"
                            }`}
                            disabled={isProcessing}
                          >
                            {isProcessing
                              ? "Processing..."
                              : `Pay ₹${total.toFixed(2)}`}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-lg font-semibold mb-4">
                      Order Summary
                    </h2>

                    <div className="border-b pb-4 mb-4">
                      <h3 className="font-medium mb-2">{movie.title}</h3>
                      <p className="text-sm text-gray-600 mb-1">
                        {theater.name} - {theater.screen}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        {selectedDate || bookingData.dateDisplay} |{" "}
                        {selectedTime || bookingData.showTime}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedSeats.length} seat
                        {selectedSeats.length !== 1 ? "s" : ""}:{" "}
                        {selectedSeats.join(", ")}
                      </p>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Tickets ({selectedSeats.length} × ₹
                          {ticketPrice.toFixed(2)})
                        </span>
                        <span>₹{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Service Fee</span>
                        <span>₹{serviceFee.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>₹{total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Payment Success
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-green-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-6">
                Your booking is confirmed. Redirecting to your tickets...
              </p>

              <div className="flex justify-center">
                <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#5c6ac4] animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentPage;
