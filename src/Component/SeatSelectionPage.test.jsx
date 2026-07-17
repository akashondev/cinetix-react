import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SeatSelectionPage from "./SeatSelectionPage";

const mockNavigate = jest.fn();
const mockRefetch = jest.fn();
const mockUseReducedMotion = jest.fn();
let mockAvailabilityState;

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

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
      ) =>
        React.createElement(tag, {
          ...props,
          ref,
          "data-layout":
            layout === undefined ? undefined : String(layout),
        })
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
jest.mock("../hooks/useSeatAvailability", () => () => mockAvailabilityState);

const bookingData = {
  movieId: "movie-1",
  movieTitle: "Interstellar",
  movieImage: "/poster.jpg",
  theaterName: "CineTix Downtown",
  theaterAddress: "Main Street",
  theaterScreen: "Screen 3",
  dateISO: "2026-07-18",
  dateDisplay: "18 Jul 2026",
  showTime: "7:30 PM",
};

function renderPage() {
  localStorage.setItem("selectedMovie", JSON.stringify(bookingData));
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <SeatSelectionPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  mockNavigate.mockClear();
  mockRefetch.mockReset();
  mockUseReducedMotion.mockReturnValue(false);
  mockAvailabilityState = {
    availability: {
      bookedSeats: ["A2"],
      availableCount: 79,
      soldOut: false,
    },
    bookedSeats: ["A2"],
    loading: false,
    refreshing: false,
    error: null,
    refetch: mockRefetch,
  };
});

test("renders accessible available, selected, and booked seat states", () => {
  renderPage();
  const available = screen.getByRole("button", { name: "Seat A1" });
  const booked = screen.getByRole("button", { name: "Seat A2, booked" });

  expect(available).toHaveAttribute("data-seat-state", "available");
  expect(available).toHaveAttribute("aria-pressed", "false");
  expect(booked).toHaveAttribute("data-seat-state", "booked");
  expect(booked).toBeDisabled();

  fireEvent.click(available);

  expect(screen.getByRole("button", { name: "Seat A1, selected" })).toHaveAttribute(
    "data-seat-state",
    "selected"
  );
});

test("shows premium show details, legend, availability, and booking summary", () => {
  renderPage();

  expect(
    screen.getByRole("heading", { name: "Interstellar" })
  ).toBeInTheDocument();
  expect(screen.getByText("CineTix Downtown")).toBeInTheDocument();
  expect(screen.getByText("Screen 3")).toBeInTheDocument();
  expect(screen.getByText("18 Jul 2026")).toBeInTheDocument();
  expect(screen.getByText("7:30 PM")).toBeInTheDocument();

  const legend = screen.getByRole("region", { name: "Seat status" });
  expect(legend).toHaveTextContent("Available");
  expect(legend).toHaveTextContent("Selected");
  expect(legend).toHaveTextContent("Booked");
  expect(screen.getByText("79 seats available")).toBeInTheDocument();
  expect(
    screen.getByRole("complementary", { name: "Booking summary" })
  ).toHaveTextContent("₹0");
});

test("updates selected chips, ticket total, and payment action", () => {
  renderPage();
  const proceed = screen.getByRole("button", {
    name: /proceed to payment/i,
  });
  expect(proceed).toBeDisabled();

  fireEvent.click(screen.getByRole("button", { name: "Seat A1" }));
  fireEvent.click(screen.getByRole("button", { name: "Seat A3" }));

  const summary = screen.getByRole("complementary", {
    name: "Booking summary",
  });
  expect(summary).toHaveTextContent("A1");
  expect(summary).toHaveTextContent("A3");
  expect(summary).toHaveTextContent("2 seats");
  expect(summary).toHaveTextContent("₹360");
  expect(proceed).toBeEnabled();
});

test("deselecting removes the chip and resets the total and action", () => {
  renderPage();
  const proceed = screen.getByRole("button", {
    name: /proceed to payment/i,
  });
  fireEvent.click(screen.getByRole("button", { name: "Seat A1" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Seat A1, selected" })
  );

  const summary = screen.getByRole("complementary", {
    name: "Booking summary",
  });
  expect(summary).not.toHaveTextContent("A1");
  expect(summary).toHaveTextContent("0 seats");
  expect(summary).toHaveTextContent("₹0");
  expect(proceed).toBeDisabled();
});

test("enforces the ten-seat maximum with an announced warning", () => {
  renderPage();

  [
    "A1",
    "A3",
    "A5",
    "A6",
    "A7",
    "A8",
    "A10",
    "A11",
    "A12",
    "B1",
    "B2",
  ].forEach((id) =>
    fireEvent.click(screen.getByRole("button", { name: `Seat ${id}` }))
  );

  expect(
    screen.getByRole("status", { name: "Selection message" })
  ).toHaveTextContent("You can select a maximum of 10 seats.");
  expect(
    screen.getByRole("complementary", { name: "Booking summary" })
  ).toHaveTextContent("10 seats");
});

test("shows an availability error and retries", () => {
  mockAvailabilityState = {
    ...mockAvailabilityState,
    availability: null,
    bookedSeats: [],
    error: "Unable to load seat availability",
  };
  renderPage();

  expect(screen.getByRole("alert")).toHaveTextContent(
    "Unable to load seat availability"
  );
  fireEvent.click(screen.getByRole("button", { name: /retry/i }));
  expect(mockRefetch).toHaveBeenCalledTimes(1);
});

test("redirects logged-out users to login without refetching", () => {
  renderPage();
  fireEvent.click(screen.getByRole("button", { name: "Seat A1" }));
  fireEvent.click(
    screen.getByRole("button", { name: /proceed to payment/i })
  );

  expect(mockNavigate).toHaveBeenCalledWith("/login", {
    state: { from: "/seats" },
  });
  expect(mockRefetch).not.toHaveBeenCalled();
});

test("preserves payment navigation state for logged-in users", async () => {
  localStorage.setItem("token", "token");
  mockRefetch.mockResolvedValue({ bookedSeats: [] });
  renderPage();
  fireEvent.click(screen.getByRole("button", { name: "Seat A1" }));
  fireEvent.click(
    screen.getByRole("button", { name: /proceed to payment/i })
  );

  await waitFor(() =>
    expect(mockNavigate).toHaveBeenCalledWith("/payment", {
      state: expect.objectContaining({
        selectedDate: "2026-07-18",
        selectedTime: "7:30 PM",
        selectedSeats: ["A1"],
      }),
    })
  );
  expect(mockRefetch).toHaveBeenCalledTimes(1);
  expect(
    JSON.parse(localStorage.getItem("selectedMovie"))
  ).toEqual(
    expect.objectContaining({
      selectedSeats: ["A1"],
      totalPrice: 180,
      ticketPrice: 180,
    })
  );
});

test("stops payment and announces a final availability conflict", async () => {
  localStorage.setItem("token", "token");
  mockRefetch.mockResolvedValue({ bookedSeats: ["A1"] });
  renderPage();
  fireEvent.click(screen.getByRole("button", { name: "Seat A1" }));
  fireEvent.click(
    screen.getByRole("button", { name: /proceed to payment/i })
  );

  expect(
    await screen.findByRole("status", { name: "Selection message" })
  ).toHaveTextContent("Some selected seats are no longer available.");
  expect(mockNavigate).not.toHaveBeenCalledWith(
    "/payment",
    expect.anything()
  );
});

test("stays on the seat page when the final availability check fails", async () => {
  localStorage.setItem("token", "token");
  mockRefetch.mockRejectedValue(new Error("Network unavailable"));
  renderPage();
  fireEvent.click(screen.getByRole("button", { name: "Seat A1" }));
  fireEvent.click(
    screen.getByRole("button", { name: /proceed to payment/i })
  );

  await waitFor(() => expect(mockRefetch).toHaveBeenCalledTimes(1));
  expect(mockNavigate).not.toHaveBeenCalledWith(
    "/payment",
    expect.anything()
  );
});

test("keeps loading, sold-out, and refresh states clear and usable", () => {
  mockAvailabilityState = {
    ...mockAvailabilityState,
    loading: true,
  };
  const { rerender } = renderPage();
  expect(
    screen.getByRole("region", { name: "Loading seat availability" })
  ).toHaveTextContent("Loading current seat availability...");

  mockAvailabilityState = {
    ...mockAvailabilityState,
    loading: false,
    refreshing: true,
    availability: {
      bookedSeats: ["A2"],
      availableCount: 0,
      soldOut: true,
    },
  };
  rerender(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <SeatSelectionPage />
    </MemoryRouter>
  );

  expect(
    screen.getByRole("status", { name: "Booking status" })
  ).toHaveTextContent("All tickets for this show are sold out.");
  expect(
    screen.getByRole("status", { name: "Availability refresh" })
  ).toHaveTextContent("Refreshing availability...");
  expect(
    screen.getByRole("button", { name: /proceed to payment/i })
  ).toBeDisabled();
});

test("renders the complete interface when reduced motion is preferred", () => {
  mockUseReducedMotion.mockReturnValue(true);
  mockAvailabilityState = {
    ...mockAvailabilityState,
    refreshing: true,
  };
  renderPage();
  fireEvent.click(screen.getByRole("button", { name: "Seat A1" }));

  expect(mockUseReducedMotion).toHaveBeenCalled();
  expect(screen.getByRole("region", { name: "Seat map" })).toBeInTheDocument();
  const summary = screen.getByRole("complementary", {
    name: "Booking summary",
  });
  expect(summary).toBeInTheDocument();
  expect(screen.getByText("A1", { selector: "[data-layout]" })).toHaveAttribute(
    "data-layout",
    "false"
  );
  expect(document.querySelectorAll(".animate-spin")).toHaveLength(0);
});
