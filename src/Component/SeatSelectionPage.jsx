import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Armchair,
  CalendarDays,
  Clock3,
  MapPin,
  Monitor,
  RefreshCw,
  Ticket,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Seat from "./Seat";
import useSeatAvailability from "../hooks/useSeatAvailability";
import { normalizeCalendarDate } from "../api/bookingApi";

const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const SEAT_NUMBERS = [1, 2, 3, 5, 6, 7, 8, 10, 11, 12];
const SEATS = ROWS.flatMap((row) =>
  SEAT_NUMBERS.map((number) => `${row}${number}`)
);
const MAX_SEATS = 10;
const TICKET_PRICE = 180;
const STATE_LEGEND = [
  { label: "Available", className: "border-gray-300 bg-white" },
  { label: "Selected", className: "border-[#5c6ac4] bg-[#5c6ac4]" },
  { label: "Booked", className: "border-gray-300 bg-gray-200" },
];

function readBookingData() {
  try {
    return JSON.parse(localStorage.getItem("selectedMovie")) || {};
  } catch {
    return {};
  }
}

function Detail({ icon: Icon, children }) {
  if (!children) return null;

  return (
    <span className="inline-flex items-center gap-2 text-sm text-gray-600">
      <Icon className="h-4 w-4 text-[#5c6ac4]" aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
}

function SeatLegend() {
  return (
    <div
      aria-label="Seat status"
      role="region"
      className="flex flex-wrap items-center gap-x-5 gap-y-2"
    >
      {STATE_LEGEND.map(({ label, className }) => (
        <span
          key={label}
          className="inline-flex items-center gap-2 text-xs font-medium text-gray-600"
        >
          <span
            className={`h-4 w-4 rounded border ${className}`}
            aria-hidden="true"
          />
          {label}
        </span>
      ))}
    </div>
  );
}

export default function SeatSelectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const bookingData = useMemo(readBookingData, []);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [message, setMessage] = useState(
    location.state?.bookingError || ""
  );
  const identity = useMemo(
    () => ({
      movieId: bookingData.movieId,
      cinema: bookingData.theaterName,
      screen: bookingData.theaterScreen || "Screen 1",
      date: normalizeCalendarDate(bookingData.dateISO),
      time: bookingData.showTime,
    }),
    [bookingData]
  );
  const {
    availability,
    bookedSeats,
    loading,
    refreshing,
    error,
    refetch,
  } = useSeatAvailability(identity);
  const booked = useMemo(() => new Set(bookedSeats), [bookedSeats]);

  useEffect(() => {
    setSelectedSeats((current) => {
      const next = current.filter((seat) => !booked.has(seat));
      if (next.length !== current.length) {
        setMessage(
          "Some selected seats were just booked by another customer."
        );
      }
      return next;
    });
  }, [booked]);

  useEffect(() => {
    if (
      !bookingData.movieId ||
      !bookingData.dateISO ||
      !bookingData.showTime
    ) {
      navigate("/");
    }
  }, [bookingData, navigate]);

  const toggleSeat = useCallback((seat) => {
    setMessage("");
    setSelectedSeats((current) => {
      if (current.includes(seat)) {
        return current.filter((item) => item !== seat);
      }
      if (current.length >= MAX_SEATS) {
        setMessage(`You can select a maximum of ${MAX_SEATS} seats.`);
        return current;
      }
      return [...current, seat];
    });
  }, []);

  const proceed = async () => {
    if (!localStorage.getItem("token")) {
      navigate("/login", { state: { from: "/seats" } });
      return;
    }

    let latest;
    try {
      latest = await refetch();
    } catch {
      return;
    }

    const latestBooked = new Set(latest?.bookedSeats || []);
    const conflicts = selectedSeats.filter((seat) => latestBooked.has(seat));
    if (conflicts.length) {
      setMessage("Some selected seats are no longer available.");
      return;
    }

    const updated = {
      ...bookingData,
      selectedSeats,
      totalPrice: selectedSeats.length * TICKET_PRICE,
      ticketPrice: TICKET_PRICE,
    };
    localStorage.setItem("selectedMovie", JSON.stringify(updated));
    navigate("/payment", {
      state: {
        movie: {
          id: bookingData.movieId,
          title: bookingData.movieTitle,
          image: bookingData.movieImage,
        },
        theater: {
          name: bookingData.theaterName,
          address: bookingData.theaterAddress,
          screen: bookingData.theaterScreen || "Screen 1",
        },
        selectedDate: normalizeCalendarDate(bookingData.dateISO),
        selectedTime: bookingData.showTime,
        selectedSeats,
      },
    });
  };

  const soldOut = availability?.soldOut === true;
  const disabled =
    loading || Boolean(error) || soldOut || selectedSeats.length === 0;
  const total = selectedSeats.length * TICKET_PRICE;
  const availableLabel = Number.isFinite(availability?.availableCount)
    ? `${availability.availableCount} ${
        availability.availableCount === 1 ? "seat" : "seats"
      } available`
    : null;
  const reveal = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: "easeOut" },
      };
  const rowVariants = reduceMotion
    ? {}
    : {
        hidden: { opacity: 0, y: 8 },
        visible: (index) => ({
          opacity: 1,
          y: 0,
          transition: { delay: index * 0.035, duration: 0.25 },
        }),
      };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-950">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <motion.header {...reveal} className="mb-7 sm:mb-9">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-px w-8 bg-[#5c6ac4]" aria-hidden="true" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5c6ac4]">
              Choose your seats
            </p>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
            {bookingData.movieTitle || "Select seats"}
          </h1>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3">
            <Detail icon={MapPin}>{bookingData.theaterName}</Detail>
            <Detail icon={Monitor}>
              {bookingData.theaterScreen || "Screen 1"}
            </Detail>
            <Detail icon={CalendarDays}>
              {bookingData.dateDisplay ||
                normalizeCalendarDate(bookingData.dateISO)}
            </Detail>
            <Detail icon={Clock3}>{bookingData.showTime}</Detail>
          </div>
        </motion.header>

        <AnimatePresence initial={false}>
          {soldOut && !loading && !error && (
            <motion.div
              key="sold-out"
              role="status"
              aria-label="Booking status"
              initial={reduceMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 font-semibold text-red-800"
            >
              All tickets for this show are sold out.
            </motion.div>
          )}
          {message && !loading && !error && (
            <motion.div
              key="message"
              role="status"
              aria-label="Selection message"
              initial={reduceMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
          <motion.section
            {...reveal}
            aria-label="Loading seat availability"
            className="rounded-2xl border border-gray-200 bg-white px-6 py-20 text-center shadow-sm"
          >
            <div
              className={`mx-auto h-11 w-11 rounded-full border-2 border-gray-200 border-t-[#5c6ac4] ${
                reduceMotion ? "" : "animate-spin"
              }`}
              aria-hidden="true"
            />
            <p className="mt-5 text-sm font-medium text-gray-600">
              Loading current seat availability...
            </p>
          </motion.section>
        )}

        {!loading && error && (
          <motion.div
            {...reveal}
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm"
          >
            <p className="font-semibold">{error}</p>
            <button
              type="button"
              onClick={refetch}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-red-300 bg-white px-4 text-sm font-semibold transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </button>
          </motion.div>
        )}

        {!loading && !error && (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <motion.section
              {...reveal}
              aria-label="Seat map"
              className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-7">
                <SeatLegend />
                {availableLabel && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#eef0ff] px-3 py-1.5 text-xs font-semibold text-[#4d5ab5]">
                    <Armchair className="h-4 w-4" aria-hidden="true" />
                    {availableLabel}
                  </span>
                )}
              </div>

              <div className="px-4 pb-7 pt-8 sm:px-7 sm:pb-9">
                <div className="mx-auto mb-10 max-w-2xl">
                  <div
                    className="h-2 rounded-[50%] bg-gradient-to-r from-transparent via-[#5c6ac4] to-transparent shadow-[0_12px_28px_rgba(92,106,196,0.35)]"
                    aria-hidden="true"
                  />
                  <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-[0.35em] text-gray-400">
                    Screen
                  </p>
                </div>

                <div className="overflow-x-auto pb-3">
                  <div className="mx-auto grid w-max gap-2.5 px-1 sm:gap-3">
                    {ROWS.map((row, rowIndex) => (
                      <motion.div
                        key={row}
                        custom={rowIndex}
                        variants={rowVariants}
                        initial={reduceMotion ? undefined : "hidden"}
                        animate={reduceMotion ? undefined : "visible"}
                        className="flex items-center gap-1.5 sm:gap-2"
                      >
                        <span className="sticky left-0 z-10 flex h-8 w-6 items-center justify-center bg-white text-xs font-bold text-gray-400 sm:h-10">
                          {row}
                        </span>
                        {SEATS.filter((seat) => seat.startsWith(row)).map(
                          (seat, index) => (
                            <React.Fragment key={seat}>
                              {(index === 3 || index === 7) && (
                                <span
                                  className="w-3 sm:w-5"
                                  aria-hidden="true"
                                />
                              )}
                              <Seat
                                id={seat}
                                booked={booked.has(seat)}
                                selected={selectedSeats.includes(seat)}
                                onClick={toggleSeat}
                                reduceMotion={reduceMotion}
                              />
                            </React.Fragment>
                          )
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.section>

            <motion.aside
              {...reveal}
              aria-label="Booking summary"
              className="rounded-2xl border border-gray-200 bg-white shadow-sm lg:sticky lg:top-24"
            >
              <div className="border-b border-gray-100 p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef0ff] text-[#5c6ac4]">
                    <Ticket className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Your booking
                    </p>
                    <h2 className="text-lg font-bold text-gray-950">
                      Booking summary
                    </h2>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800">
                    Selected seats
                  </p>
                  <span className="text-xs font-medium text-gray-500">
                    {selectedSeats.length}{" "}
                    {selectedSeats.length === 1 ? "seat" : "seats"}
                  </span>
                </div>

                <div className="mt-3 min-h-14">
                  <AnimatePresence initial={false}>
                    {selectedSeats.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedSeats.map((seat) => (
                          <motion.span
                            layout={!reduceMotion}
                            key={seat}
                            initial={
                              reduceMotion ? false : { opacity: 0, scale: 0.8 }
                            }
                            animate={{ opacity: 1, scale: 1 }}
                            exit={
                              reduceMotion
                                ? undefined
                                : { opacity: 0, scale: 0.8 }
                            }
                            className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#5c6ac4] px-2 text-xs font-bold text-white"
                          >
                            {seat}
                          </motion.span>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-500">
                        Pick your preferred seats from the map.
                      </p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-6 space-y-3 border-t border-dashed border-gray-200 pt-5">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                      Tickets ({selectedSeats.length} × ₹{TICKET_PRICE})
                    </span>
                    <span>₹{total}</span>
                  </div>
                  <div className="flex items-end justify-between border-t border-gray-100 pt-4">
                    <span className="font-semibold text-gray-900">Total</span>
                    <motion.span
                      key={total}
                      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-2xl font-bold text-gray-950"
                    >
                      ₹{total}
                    </motion.span>
                  </div>
                </div>

                {refreshing && (
                  <p
                    role="status"
                    aria-label="Availability refresh"
                    className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-gray-500"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${
                        reduceMotion ? "" : "animate-spin"
                      }`}
                      aria-hidden="true"
                    />
                    Refreshing availability...
                  </p>
                )}

                <motion.button
                  type="button"
                  disabled={disabled}
                  onClick={proceed}
                  whileHover={
                    reduceMotion || disabled ? undefined : { y: -2 }
                  }
                  whileTap={
                    reduceMotion || disabled ? undefined : { scale: 0.98 }
                  }
                  className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#5c6ac4] px-5 text-sm font-bold text-white shadow-lg shadow-[#5c6ac4]/20 transition-colors hover:bg-[#4d5ab5] focus:outline-none focus:ring-2 focus:ring-[#5c6ac4] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
                >
                  Proceed to payment
                </motion.button>
                <p className="mt-3 text-center text-xs text-gray-400">
                  You can select up to {MAX_SEATS} seats.
                </p>
              </div>
            </motion.aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
