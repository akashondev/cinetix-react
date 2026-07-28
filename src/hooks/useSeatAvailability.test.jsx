import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { io } from "socket.io-client";
import { fetchAvailability } from "../api/bookingApi";
import useSeatAvailability from "./useSeatAvailability";

const socketHandlers = {};
const managerHandlers = {};
const mockSocket = {
  connected: true,
  emit: jest.fn(),
  on: jest.fn((event, handler) => {
    socketHandlers[event] = handler;
  }),
  off: jest.fn(),
  disconnect: jest.fn(),
  io: {
    on: jest.fn((event, handler) => {
      managerHandlers[event] = handler;
    }),
    off: jest.fn(),
  },
};

jest.mock("../api/bookingApi", () => ({
  fetchAvailability: jest.fn(),
}));
jest.mock("../config/api", () => ({ SOCKET_URL: "https://socket.example" }));
jest.mock("socket.io-client", () => ({
  io: jest.fn(() => mockSocket),
}));

const identity = {
  movieId: "507f1f77bcf86cd799439011",
  cinema: "CineTix Downtown",
  screen: "Screen 1",
  date: "2026-07-28",
  time: "7:30 PM",
};
const availability = {
  show: { showKey: "movie|cinema|screen|2026-07-28|7:30 PM" },
  bookedSeats: ["A2"],
  availableCount: 79,
  soldOut: false,
};

function Harness({ show = identity }) {
  const state = useSeatAvailability(show);
  return (
    <>
      <output data-testid="loading">{String(state.loading)}</output>
      <output data-testid="refreshing">{String(state.refreshing)}</output>
      <output data-testid="seats">{state.bookedSeats.join(",")}</output>
      <output data-testid="error">{state.error || ""}</output>
      <button type="button" onClick={() => state.refetch().catch(() => {})}>
        Retry
      </button>
    </>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  io.mockReturnValue(mockSocket);
  Object.keys(socketHandlers).forEach((key) => delete socketHandlers[key]);
  Object.keys(managerHandlers).forEach((key) => delete managerHandlers[key]);
  mockSocket.on.mockImplementation((event, handler) => {
    socketHandlers[event] = handler;
  });
  mockSocket.io.on.mockImplementation((event, handler) => {
    managerHandlers[event] = handler;
  });
  fetchAvailability.mockResolvedValue(availability);
});

test("fetches once when an equivalent show identity is rerendered", async () => {
  const { rerender } = render(<Harness />);

  expect(await screen.findByText("A2")).toBeInTheDocument();
  rerender(<Harness show={{ ...identity }} />);

  await waitFor(() => expect(fetchAvailability).toHaveBeenCalledTimes(1));
});

test("refreshes after a socket reconnect without duplicating the initial request", async () => {
  render(<Harness />);

  expect(await screen.findByText("A2")).toBeInTheDocument();
  expect(fetchAvailability).toHaveBeenCalledTimes(1);
  await waitFor(() =>
    expect(managerHandlers.reconnect).toEqual(expect.any(Function))
  );

  await act(async () => {
    managerHandlers.reconnect();
  });

  await waitFor(() => expect(fetchAvailability).toHaveBeenCalledTimes(2));
});

test("shows an error and clears it after a successful retry", async () => {
  fetchAvailability
    .mockRejectedValueOnce(new Error("Network unavailable"))
    .mockResolvedValueOnce(availability);
  render(<Harness />);

  expect(await screen.findByText("Network unavailable")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));

  expect(await screen.findByText("A2")).toBeInTheDocument();
  expect(screen.getByTestId("error")).toBeEmptyDOMElement();
});
