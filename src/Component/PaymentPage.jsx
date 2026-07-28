import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import {
  BookingApiError,
  createBooking,
  normalizeCalendarDate,
} from "../api/bookingApi";
import { clearUserSession, isInvalidSessionStatus } from "../api/authSession";

const TICKET_PRICE = 180;
const SERVICE_FEE = 1.5;

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function formatCardNumber(value) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

function FieldError({ children }) {
  if (!children) return null;
  return <p className="mt-1.5 text-xs font-medium text-red-600">{children}</p>;
}

function SummaryRow({ label, value, strong = false }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${
        strong ? "text-base font-bold text-gray-950" : "text-sm text-gray-600"
      }`}
    >
      <span>{label}</span>
      <span className="shrink-0">{value}</span>
    </div>
  );
}

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const processingRef = useRef(false);
  const bookingData = useMemo(() => readJson("selectedMovie", {}), []);
  const storedSeats = useMemo(() => readJson("selectedSeats", []), []);
  const routeState = location.state || {};
  const movie = routeState.movie || {
    id: bookingData.movieId,
    title: bookingData.movieTitle,
    image: bookingData.movieImage,
  };
  const theater = routeState.theater || {
    name: bookingData.theaterName || "",
    address: bookingData.theaterAddress || "",
    screen: bookingData.theaterScreen || "Screen 1",
  };
  const selectedDate =
    routeState.selectedDate ||
    normalizeCalendarDate(bookingData.dateISO || bookingData.dateDisplay);
  const selectedTime = routeState.selectedTime || bookingData.showTime;
  const selectedSeats =
    routeState.selectedSeats || bookingData.selectedSeats || storedSeats;

  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  const subtotal = selectedSeats.length * TICKET_PRICE;
  const serviceFee = selectedSeats.length * SERVICE_FEE;
  const total = subtotal + serviceFee;
  const hasBookingContext = Boolean(
    movie?.id &&
      movie?.title &&
      theater?.name &&
      selectedDate &&
      selectedTime &&
      selectedSeats.length
  );

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login", {
        state: {
          from: location.pathname,
          message: "Please login to complete your booking",
        },
      });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!confirmation) return undefined;
    const timer = window.setTimeout(() => {
      navigate("/ticket", {
        state: { bookingConfirmation: confirmation, justCompleted: true },
      });
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [confirmation, navigate]);

  const validateExpiry = (value) => {
    if (!/^\d{2}\/\d{2}$/.test(value)) return "Invalid format";
    const [month, year] = value.split("/").map(Number);
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    if (
      month < 1 ||
      month > 12 ||
      year < currentYear ||
      (year === currentYear && month < currentMonth)
    ) {
      return "Invalid expiry date";
    }
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (processingRef.current) return;
    if (!cardNumber || !cardName || !expiryDate || !cvv || !email) {
      window.alert("Please fill in all fields");
      return;
    }
    if (!/^[0-9a-fA-F]{24}$/.test(movie.id)) {
      window.alert("Invalid movie ID. Please restart your booking process.");
      navigate("/");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      window.alert("Please login to complete your booking");
      navigate("/login");
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);
    const sessionId = `booking_${Date.now()}`;
    const bookingConfirmation = {
      id: sessionId,
      movie,
      theater,
      selectedSeats,
      selectedDate,
      selectedTime,
      paymentInfo: {
        method: "card",
        amount: total,
        transactionId: `TXN${Date.now()}`,
        email,
      },
      bookingTime: new Date().toISOString(),
      status: "confirmed",
    };
    const ticketData = {
      movie_id: movie.id,
      movie_title: movie.title,
      seats: selectedSeats,
      cinema: theater.name,
      screen: theater.screen || bookingData.theaterScreen || "Screen 1",
      time: selectedTime,
      date: normalizeCalendarDate(selectedDate),
      day: new Date(selectedDate).toLocaleDateString("en-US", {
        weekday: "long",
      }),
      price: TICKET_PRICE,
      location: theater.address,
      session_id: sessionId,
    };

    try {
      const ticket = await createBooking(ticketData, token);
      const finalConfirmation = {
        ...bookingConfirmation,
        ticketId: ticket._id,
      };
      localStorage.setItem(
        "bookingConfirmation",
        JSON.stringify(finalConfirmation)
      );
      localStorage.removeItem("selectedMovie");
      localStorage.removeItem("selectedSeats");
      setIsProcessing(false);
      setConfirmation(finalConfirmation);
    } catch (error) {
      if (
        error instanceof BookingApiError &&
        isInvalidSessionStatus(error.status)
      ) {
        clearUserSession();
        window.alert("Your session has expired. Please login again.");
        navigate("/login", { state: { from: location.pathname } });
        return;
      }
      if (error instanceof BookingApiError && error.status === 409) {
        processingRef.current = false;
        setIsProcessing(false);
        navigate("/seats", {
          state: {
            bookingError: error.payload?.message || error.message,
            conflictingSeats: error.payload?.conflictingSeats || [],
          },
        });
        return;
      }
      processingRef.current = false;
      setIsProcessing(false);
      window.alert(`Booking failed: ${error.message}. Please try again.`);
    }
  };

  const inputClass = (error) =>
    `h-12 w-full rounded-xl border bg-white px-4 text-sm text-gray-950 outline-none transition-colors placeholder:text-gray-400 focus:ring-2 focus:ring-[#5c6ac4]/20 ${
      error
        ? "border-red-400 focus:border-red-500"
        : "border-gray-200 focus:border-[#5c6ac4]"
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-950">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-[#5c6ac4] transition-colors hover:text-[#4d5ab5] focus:outline-none focus:ring-2 focus:ring-[#5c6ac4]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to seat selection
        </button>

        {!hasBookingContext ? (
          <section
            role="alert"
            className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm"
          >
            <Ticket className="mx-auto h-10 w-10 text-amber-500" aria-hidden="true" />
            <h1 className="mt-4 text-2xl font-bold">Booking details are unavailable</h1>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Return to the movies page and choose a show and seats again.
            </p>
            <button
              type="button"
              onClick={() => navigate("/movies")}
              className="mt-6 h-11 rounded-xl bg-[#5c6ac4] px-5 text-sm font-semibold text-white hover:bg-[#4d5ab5]"
            >
              Back to movies
            </button>
          </section>
        ) : (
          <>
            <header className="mb-8">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-px w-8 bg-[#5c6ac4]" aria-hidden="true" />
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5c6ac4]">
                  Secure checkout
                </p>
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Payment Details
              </h1>
              <p className="mt-3 max-w-2xl text-gray-600">
                Complete your booking with secure payment information.
              </p>
            </header>

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
              <section
                aria-label="Payment information"
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-5 sm:px-7">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef0ff] text-[#5c6ac4]">
                    <CreditCard className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="font-bold">Credit / Debit Card</h2>
                    <p className="text-xs text-gray-500">Your details are encrypted</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-5 sm:p-7">
                  <fieldset disabled={isProcessing || Boolean(confirmation)}>
                    <div className="space-y-5">
                      <div>
                        <label htmlFor="card-number" className="mb-2 block text-sm font-semibold">
                          Card Number
                        </label>
                        <input
                          id="card-number"
                          type="text"
                          inputMode="numeric"
                          autoComplete="cc-number"
                          className={inputClass(errors.cardNumber)}
                          placeholder="1234 5678 9012 3456"
                          value={cardNumber}
                          onChange={(event) => {
                            const value = formatCardNumber(event.target.value);
                            setCardNumber(value);
                            const cleaned = value.replace(/\s/g, "");
                            setErrors((current) => ({
                              ...current,
                              cardNumber:
                                cleaned && !/^\d{13,16}$/.test(cleaned)
                                  ? "Invalid card number"
                                  : "",
                            }));
                          }}
                          maxLength={19}
                          required
                        />
                        <FieldError>{errors.cardNumber}</FieldError>
                      </div>

                      <div>
                        <label htmlFor="card-name" className="mb-2 block text-sm font-semibold">
                          Cardholder Name
                        </label>
                        <input
                          id="card-name"
                          type="text"
                          autoComplete="cc-name"
                          className={inputClass(errors.cardName)}
                          placeholder="John Smith"
                          value={cardName}
                          onChange={(event) => {
                            const value = event.target.value;
                            setCardName(value);
                            setErrors((current) => ({
                              ...current,
                              cardName:
                                value && !/^[a-zA-Z\s]{2,}$/.test(value.trim())
                                  ? "Please enter a valid name"
                                  : "",
                            }));
                          }}
                          required
                        />
                        <FieldError>{errors.cardName}</FieldError>
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label htmlFor="expiry-date" className="mb-2 block text-sm font-semibold">
                            Expiry Date
                          </label>
                          <input
                            id="expiry-date"
                            type="text"
                            inputMode="numeric"
                            autoComplete="cc-exp"
                            className={inputClass(errors.expiryDate)}
                            placeholder="MM/YY"
                            value={expiryDate}
                            onChange={(event) => {
                              let value = event.target.value
                                .replace(/[^\d/]/g, "")
                                .slice(0, 5);
                              if (value.length === 2 && !value.includes("/")) {
                                value += "/";
                              }
                              setExpiryDate(value);
                              setErrors((current) => ({
                                ...current,
                                expiryDate: value ? validateExpiry(value) : "",
                              }));
                            }}
                            maxLength={5}
                            required
                          />
                          <FieldError>{errors.expiryDate}</FieldError>
                        </div>

                        <div>
                          <label htmlFor="cvv" className="mb-2 block text-sm font-semibold">
                            CVV
                          </label>
                          <input
                            id="cvv"
                            type="password"
                            inputMode="numeric"
                            autoComplete="cc-csc"
                            className={inputClass(errors.cvv)}
                            placeholder="123"
                            value={cvv}
                            onChange={(event) => {
                              const value = event.target.value
                                .replace(/\D/g, "")
                                .slice(0, 4);
                              setCvv(value);
                              setErrors((current) => ({
                                ...current,
                                cvv:
                                  value && !/^\d{3,4}$/.test(value)
                                    ? "Invalid CVV"
                                    : "",
                              }));
                            }}
                            maxLength={4}
                            required
                          />
                          <FieldError>{errors.cvv}</FieldError>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="receipt-email" className="mb-2 block text-sm font-semibold">
                          Email (for receipt)
                        </label>
                        <input
                          id="receipt-email"
                          type="email"
                          autoComplete="email"
                          className={inputClass(errors.email)}
                          placeholder="your@email.com"
                          value={email}
                          onChange={(event) => {
                            const value = event.target.value;
                            setEmail(value);
                            setErrors((current) => ({
                              ...current,
                              email:
                                value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                                  ? "Invalid email address"
                                  : "",
                            }));
                          }}
                          required
                        />
                        <FieldError>{errors.email}</FieldError>
                      </div>
                    </div>
                  </fieldset>

                  <button
                    type="submit"
                    disabled={isProcessing || Boolean(confirmation)}
                    className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#5c6ac4] px-5 text-sm font-bold text-white shadow-lg shadow-[#5c6ac4]/20 transition-colors hover:bg-[#4d5ab5] focus:outline-none focus:ring-2 focus:ring-[#5c6ac4] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none"
                  >
                    <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                    {isProcessing ? "Processing payment…" : `Pay ₹${total.toFixed(2)}`}
                  </button>
                  <p className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                    <ShieldCheck className="h-4 w-4 text-green-600" aria-hidden="true" />
                    Secure checkout protected by CineTix
                  </p>
                </form>
              </section>

              <aside
                aria-label="Order summary"
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:sticky lg:top-24"
              >
                {movie.image && (
                  <img
                    src={movie.image}
                    alt=""
                    className="h-40 w-full object-cover"
                  />
                )}
                <div className="p-5 sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#5c6ac4]">
                    Your booking
                  </p>
                  <h2 className="mt-1 text-xl font-bold">{movie.title}</h2>
                  <div className="mt-5 space-y-3 border-b border-gray-100 pb-5 text-sm text-gray-600">
                    <p className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 text-[#5c6ac4]" aria-hidden="true" />
                      <span>{theater.name} · {theater.screen}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-[#5c6ac4]" aria-hidden="true" />
                      {selectedDate}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-[#5c6ac4]" aria-hidden="true" />
                      {selectedTime}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedSeats.map((seat) => (
                        <span
                          key={seat}
                          className="rounded-lg bg-[#eef0ff] px-2.5 py-1 text-xs font-bold text-[#4d5ab5]"
                        >
                          {seat}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    <SummaryRow
                      label={`Tickets (${selectedSeats.length} × ₹${TICKET_PRICE.toFixed(2)})`}
                      value={`₹${subtotal.toFixed(2)}`}
                    />
                    <SummaryRow
                      label="Service Fee"
                      value={`₹${serviceFee.toFixed(2)}`}
                    />
                    <div className="border-t border-dashed border-gray-200 pt-4">
                      <SummaryRow
                        label="Total"
                        value={`₹${total.toFixed(2)}`}
                        strong
                      />
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>
      <Footer />

      {confirmation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Payment Successful"
            className="w-full max-w-sm rounded-2xl border border-green-100 bg-white p-6 text-center shadow-2xl"
          >
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-8 w-8 text-green-600" aria-hidden="true" />
            </span>
            <p className="mt-4 text-lg font-bold text-gray-950">Payment Successful</p>
            <p className="mt-1 text-sm text-gray-600">Opening your tickets…</p>
          </div>
        </div>
      )}
    </div>
  );
}
