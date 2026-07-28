import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { createBooking } from "../api/bookingApi";
import PaymentPage from "./PaymentPage";
import SeatSelectionPage from "./SeatSelectionPage";

const mockRefetch = jest.fn();
const mockUseReducedMotion = jest.fn(() => true);

jest.mock("../api/bookingApi", () => {
  const actual = jest.requireActual("../api/bookingApi");
  return { ...actual, createBooking: jest.fn() };
});
jest.mock("../hooks/useSeatAvailability", () => () => ({
  availability: {
    show: { showKey: "show-key" },
    bookedSeats: ["A2"],
    availableCount: 79,
    soldOut: false,
  },
  bookedSeats: ["A2"],
  loading: false,
  refreshing: false,
  error: null,
  refetch: mockRefetch,
}));
jest.mock("framer-motion", () => {
  const React = require("react");
  const element = (tag) =>
    React.forwardRef(
      (
        {
          initial,
          animate,
          exit,
          transition,
          whileHover,
          whileTap,
          layout,
          variants,
          ...props
        },
        ref
      ) => React.createElement(tag, { ...props, ref })
    );
  return {
    AnimatePresence: ({ children }) => children,
    motion: {
      aside: element("aside"),
      button: element("button"),
      div: element("div"),
      header: element("header"),
      section: element("section"),
      span: element("span"),
    },
    useReducedMotion: () => mockUseReducedMotion(),
  };
});
jest.mock("./Navbar", () => () => <nav>Navigation</nav>);
jest.mock("./Footer", () => () => <footer>Footer</footer>);

function TicketDestination() {
  const location = useLocation();
  return (
    <main>
      Tickets destination
      <output>{String(location.state?.justCompleted)}</output>
      <output>{location.state?.bookingConfirmation?.ticketId}</output>
    </main>
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
  localStorage.clear();
  localStorage.setItem("token", "token");
  localStorage.setItem(
    "selectedMovie",
    JSON.stringify({
      movieId: "507f1f77bcf86cd799439011",
      movieTitle: "Interstellar",
      movieImage: "/poster.jpg",
      theaterName: "CineTix Downtown",
      theaterAddress: "Main Street",
      theaterScreen: "Screen 3",
      dateISO: "2026-07-28",
      dateDisplay: "28 Jul 2026",
      showTime: "7:30 PM",
    })
  );
  mockRefetch.mockResolvedValue({ bookedSeats: ["A2"] });
  createBooking.mockResolvedValue({ _id: "ticket-1" });
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

test.skip("completes seat selection, payment, and ticket navigation once", async () => {
  render(
    <MemoryRouter
      initialEntries={["/seats"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/seats" element={<SeatSelectionPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/ticket" element={<TicketDestination />} />
      </Routes>
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole("button", { name: "Seat A1" }));
  await act(async () => {
    fireEvent.click(
      screen.getByRole("button", { name: /proceed to payment/i })
    );
    await Promise.resolve();
  });

  expect(
    await screen.findByRole("heading", { name: "Payment Details" })
  ).toBeInTheDocument();
  fillPaymentForm();
  await act(async () => {
    fireEvent.submit(
      screen.getByRole("button", { name: /pay ₹/i }).closest("form")
    );
    await Promise.resolve();
  });

  expect(createBooking).toHaveBeenCalledTimes(1);
  expect(createBooking).toHaveBeenCalledWith(
    expect.objectContaining({ seats: ["A1"] }),
    "token"
  );
  expect(
    screen.getByRole("dialog", { name: "Payment Successful" })
  ).toBeInTheDocument();

  act(() => jest.advanceTimersByTime(1500));
  expect(screen.getByText("Tickets destination")).toBeInTheDocument();
  expect(screen.getByText("true")).toBeInTheDocument();
  expect(screen.getByText("ticket-1")).toBeInTheDocument();
});
