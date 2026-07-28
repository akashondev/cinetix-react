import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { BookingApiError, createBooking } from "../api/bookingApi";
import PaymentPage from "./PaymentPage";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});
jest.mock("../api/bookingApi", () => {
  const actual = jest.requireActual("../api/bookingApi");
  return { ...actual, createBooking: jest.fn() };
});
jest.mock("./Navbar", () => () => <nav>Navigation</nav>);
jest.mock("./Footer", () => () => <footer>Footer</footer>);

const routeState = {
  movie: {
    id: "507f1f77bcf86cd799439011",
    title: "Interstellar",
    image: "/interstellar.jpg",
  },
  theater: {
    name: "CineTix Downtown",
    address: "MG Road",
    screen: "Screen 3",
  },
  selectedDate: "2026-07-28",
  selectedTime: "7:30 PM",
  selectedSeats: ["A1", "A2"],
};

function TicketDestination() {
  const location = useLocation();
  return <div>Tickets destination {String(location.state?.justCompleted)}</div>;
}

function renderPage(state = routeState) {
  return render(
    <MemoryRouter
      initialEntries={[{ pathname: "/payment", state }]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/ticket" element={<TicketDestination />} />
      </Routes>
    </MemoryRouter>
  );
}

function fillPaymentForm() {
  fireEvent.change(screen.getByLabelText("Card Number"), {
    target: { value: "4242424242424242" },
  });
  fireEvent.change(screen.getByLabelText("Cardholder Name"), {
    target: { value: "Akash Kumar" },
  });
  fireEvent.change(screen.getByLabelText("Expiry Date"), {
    target: { value: "12/30" },
  });
  fireEvent.change(screen.getByLabelText("CVV"), {
    target: { value: "123" },
  });
  fireEvent.change(screen.getByLabelText("Email (for receipt)"), {
    target: { value: "akash@example.com" },
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  localStorage.clear();
  localStorage.setItem("token", "token");
  localStorage.setItem(
    "selectedMovie",
    JSON.stringify({
      movieId: routeState.movie.id,
      movieTitle: routeState.movie.title,
      theaterName: routeState.theater.name,
      theaterAddress: routeState.theater.address,
      theaterScreen: routeState.theater.screen,
      dateISO: routeState.selectedDate,
      showTime: routeState.selectedTime,
    })
  );
  createBooking.mockResolvedValue({ _id: "ticket-1" });
});

afterEach(() => {
  jest.useRealTimers();
});

test("keeps the payment form visible and redirects after a 1.5 second success popup", async () => {
  renderPage();
  fillPaymentForm();

  const main = screen.getByRole("main");
  expect(main).toHaveClass("max-w-7xl");
  const form = screen.getByRole("button", { name: /pay ₹/i }).closest("form");
  await act(async () => {
    fireEvent.submit(form);
    fireEvent.submit(form);
    await Promise.resolve();
  });

  await waitFor(() => expect(createBooking).toHaveBeenCalledTimes(1));
  expect(
    await screen.findByRole("dialog", { name: "Payment Successful" })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Payment Details" })
  ).toBeInTheDocument();

  act(() => jest.advanceTimersByTime(1499));
  expect(mockNavigate).not.toHaveBeenCalledWith("/ticket", expect.anything());
  act(() => jest.advanceTimersByTime(1));
  expect(mockNavigate).toHaveBeenCalledWith("/ticket", {
    state: expect.objectContaining({ justCompleted: true }),
  });
});

test("shows a booking-context error instead of a loading circle", () => {
  localStorage.removeItem("selectedMovie");
  renderPage({});

  expect(screen.getByRole("alert")).toHaveTextContent(
    "Booking details are unavailable"
  );
  expect(document.querySelector(".animate-spin")).not.toBeInTheDocument();
});

test("returns seat conflicts to selection without showing success", async () => {
  createBooking.mockRejectedValue(
    new BookingApiError(409, {
      message: "Seat A1 is no longer available",
      conflictingSeats: ["A1"],
    })
  );
  renderPage();
  fillPaymentForm();

  await act(async () => {
    fireEvent.submit(
      screen.getByRole("button", { name: /pay ₹/i }).closest("form")
    );
    await Promise.resolve();
  });

  expect(mockNavigate).toHaveBeenCalledWith("/seats", {
    state: {
      bookingError: "Seat A1 is no longer available",
      conflictingSeats: ["A1"],
    },
  });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("clears the ticket redirect timer when payment unmounts", async () => {
  const view = renderPage();
  fillPaymentForm();
  await act(async () => {
    fireEvent.submit(
      screen.getByRole("button", { name: /pay ₹/i }).closest("form")
    );
    await Promise.resolve();
  });
  expect(
    await screen.findByRole("dialog", { name: "Payment Successful" })
  ).toBeInTheDocument();

  mockNavigate.mockClear();
  view.unmount();
  act(() => jest.advanceTimersByTime(1500));
  expect(mockNavigate).not.toHaveBeenCalled();
});
