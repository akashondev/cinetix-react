import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Seat from "./Seat";
import useSeatAvailability from "../hooks/useSeatAvailability";

const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const SEAT_NUMBERS = [1, 2, 3, 5, 6, 7, 8, 10, 11, 12];
const SEATS = ROWS.flatMap((row) => SEAT_NUMBERS.map((number) => `${row}${number}`));
const MAX_SEATS = 10;
const TICKET_PRICE = 180;

function readBookingData() {
  try { return JSON.parse(localStorage.getItem("selectedMovie")) || {}; }
  catch { return {}; }
}

export default function SeatSelectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = useMemo(readBookingData, []);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [message, setMessage] = useState(location.state?.bookingError || "");
  const identity = useMemo(() => ({
    movieId: bookingData.movieId,
    cinema: bookingData.theaterName,
    screen: bookingData.theaterScreen || "Screen 1",
    date: bookingData.dateISO,
    time: bookingData.showTime,
  }), [bookingData]);
  const { availability, bookedSeats, loading, refreshing, error, refetch } = useSeatAvailability(identity);
  const booked = useMemo(() => new Set(bookedSeats), [bookedSeats]);

  useEffect(() => {
    setSelectedSeats((current) => {
      const next = current.filter((seat) => !booked.has(seat));
      if (next.length !== current.length) setMessage("Some selected seats were just booked by another customer.");
      return next;
    });
  }, [booked]);

  useEffect(() => {
    if (!bookingData.movieId || !bookingData.dateISO || !bookingData.showTime) navigate("/");
  }, [bookingData, navigate]);

  const toggleSeat = useCallback((seat) => {
    setMessage("");
    setSelectedSeats((current) => {
      if (current.includes(seat)) return current.filter((item) => item !== seat);
      if (current.length >= MAX_SEATS) { setMessage(`You can select a maximum of ${MAX_SEATS} seats.`); return current; }
      return [...current, seat];
    });
  }, []);

  const proceed = async () => {
    if (!localStorage.getItem("token")) {
      navigate("/login", { state: { from: "/seats" } });
      return;
    }
    let latest;
    try { latest = await refetch(); }
    catch { return; }
    const latestBooked = new Set(latest?.bookedSeats || []);
    const conflicts = selectedSeats.filter((seat) => latestBooked.has(seat));
    if (conflicts.length) { setMessage("Some selected seats are no longer available."); return; }
    const updated = { ...bookingData, selectedSeats, totalPrice: selectedSeats.length * TICKET_PRICE, ticketPrice: TICKET_PRICE };
    localStorage.setItem("selectedMovie", JSON.stringify(updated));
    navigate("/payment", {
      state: {
        movie: { id: bookingData.movieId, title: bookingData.movieTitle, image: bookingData.movieImage },
        theater: { name: bookingData.theaterName, address: bookingData.theaterAddress, screen: bookingData.theaterScreen || "Screen 1" },
        selectedDate: bookingData.dateISO,
        selectedTime: bookingData.showTime,
        selectedSeats,
      },
    });
  };

  const soldOut = availability?.soldOut === true;
  const disabled = loading || Boolean(error) || soldOut || selectedSeats.length === 0;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-grow px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{bookingData.movieTitle || "Select seats"}</h1>
          <p className="mt-1 text-sm text-gray-600">{bookingData.theaterName} · {bookingData.dateDisplay} · {bookingData.showTime}</p>
        </header>

        {loading && <div className="py-20 text-center text-gray-600">Loading current seat availability...</div>}
        {!loading && error && (
          <div className="border border-red-200 bg-red-50 p-4 text-red-800">
            <p>{error}</p><button type="button" onClick={refetch} className="mt-3 font-semibold underline">Retry</button>
          </div>
        )}
        {!loading && !error && (
          <>
            {soldOut && <div className="mb-5 border border-red-200 bg-red-50 p-4 font-semibold text-red-800">All tickets for this show are sold out.</div>}
            {message && <div className="mb-5 border border-amber-200 bg-amber-50 p-3 text-amber-900">{message}</div>}
            <section aria-label="Seat map" className="overflow-x-auto bg-white p-5 shadow-sm">
              <div className="mx-auto mb-8 h-2 max-w-2xl bg-gray-800" aria-hidden="true" />
              <p className="mb-7 text-center text-xs uppercase text-gray-500">Screen</p>
              <div className="mx-auto grid w-max gap-3">
                {ROWS.map((row) => (
                  <div key={row} className="flex items-center gap-2">
                    <span className="w-5 text-sm font-semibold text-gray-500">{row}</span>
                    {SEATS.filter((seat) => seat.startsWith(row)).map((seat, index) => (
                      <React.Fragment key={seat}>
                        {(index === 3 || index === 7) && <span className="w-4" aria-hidden="true" />}
                        <Seat id={seat} booked={booked.has(seat)} selected={selectedSeats.includes(seat)} onClick={toggleSeat} />
                      </React.Fragment>
                    ))}
                  </div>
                ))}
              </div>
            </section>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 bg-white p-4 shadow-sm">
              <div><strong>{selectedSeats.length}</strong> selected · ₹{selectedSeats.length * TICKET_PRICE}{refreshing && <span className="ml-2 text-xs text-gray-500">Refreshing...</span>}</div>
              <button type="button" disabled={disabled} onClick={proceed} className="bg-black px-5 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300">Proceed to payment</button>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
