import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TicketPage from "./TicketPage";

jest.mock("./Navbar", () => () => <nav>Navigation</nav>);
jest.mock("./Footer", () => () => <footer>Footer</footer>);
jest.mock("html2canvas", () => jest.fn());
jest.mock("jspdf", () => jest.fn());
jest.mock("qrcode.react", () => ({ QRCodeSVG: () => <svg aria-label="QR code" /> }));
jest.mock("../config/api", () => ({ API_URL: "https://api.example/api" }));

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("token", "token");
  localStorage.setItem("refreshToken", "refresh-token");
  global.fetch = jest.fn(() => new Promise(() => {}));
});

test("shows the ticket page structure and skeletons while tickets load", () => {
  render(
    <MemoryRouter>
      <TicketPage />
    </MemoryRouter>
  );

  expect(screen.getByText("Your Tickets")).toBeInTheDocument();
  expect(
    screen.getByRole("status", { name: "Loading your tickets" })
  ).toBeInTheDocument();
  expect(document.querySelector(".animate-spin")).not.toBeInTheDocument();
});

function ticket(overrides = {}) {
  return {
    _id: "ticket-1",
    movie_id: "507f1f77bcf86cd799439011",
    movie_title: "Movie",
    seats: ["A1"],
    cinema: "Cinema",
    screen: "Screen 1",
    time: "19:30",
    date: "2099-07-28T00:00:00.000Z",
    day: "Tuesday",
    price: 200,
    location: "City",
    session_id: "session-1",
    createdAt: "2026-07-28T10:00:00.000Z",
    ...overrides,
  };
}

test("renders the most recently purchased booking first", async () => {
  fetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      data: [
        ticket({
          _id: "old-ticket",
          session_id: "old-session",
          movie_title: "Older Purchase",
          createdAt: "2026-07-27T10:00:00.000Z",
        }),
        ticket({
          _id: "new-ticket",
          session_id: "new-session",
          movie_id: "507f1f77bcf86cd799439012",
          movie_title: "Newest Purchase",
          createdAt: "2026-07-28T10:00:00.000Z",
        }),
      ],
    }),
  });

  render(
    <MemoryRouter>
      <TicketPage />
    </MemoryRouter>
  );

  const movieHeadings = await screen.findAllByRole("heading", { level: 2 });
  expect(movieHeadings.map((heading) => heading.textContent)).toEqual([
    "Newest Purchase",
    "Older Purchase",
  ]);
});

test("lets the user remove an expired ticket from history", async () => {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  fetch
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: [
          ticket({
            movie_title: "Expired Movie",
            date: yesterday.toISOString(),
            time: "00:00",
          }),
        ],
      }),
    })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

  render(
    <MemoryRouter>
      <TicketPage />
    </MemoryRouter>
  );

  fireEvent.click(
    await screen.findByRole("button", {
      name: "Delete expired ticket Expired Movie",
    })
  );

  await waitFor(() => {
    expect(screen.queryByText("Expired Movie")).not.toBeInTheDocument();
  });
  expect(fetch).toHaveBeenLastCalledWith(
    expect.stringContaining("/tickets/ticket-1/history"),
    expect.objectContaining({ method: "DELETE" })
  );
});

test("does not offer deletion before the showtime", async () => {
  fetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      data: [ticket({ movie_title: "Future Movie" })],
    }),
  });

  render(
    <MemoryRouter>
      <TicketPage />
    </MemoryRouter>
  );

  expect(await screen.findByText("Future Movie")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /delete expired ticket/i })
  ).not.toBeInTheDocument();
});

test("keeps an expired ticket visible when deletion fails", async () => {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  fetch
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: [
          ticket({
            movie_title: "Keep This Ticket",
            date: yesterday.toISOString(),
            time: "00:00",
          }),
        ],
      }),
    })
    .mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: "Could not remove ticket" }),
    });

  render(
    <MemoryRouter>
      <TicketPage />
    </MemoryRouter>
  );
  fireEvent.click(
    await screen.findByRole("button", {
      name: "Delete expired ticket Keep This Ticket",
    })
  );

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Could not remove ticket"
  );
  expect(screen.getByText("Keep This Ticket")).toBeInTheDocument();
});
