import { createBooking, fetchAvailability, BookingApiError } from "./bookingApi";

beforeEach(() => {
  global.fetch = jest.fn();
  localStorage.clear();
});

test("fetches show availability without cache", async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, data: { bookedSeats: ["A1"] } }) });
  const result = await fetchAvailability({ movieId: "movie", cinema: "Cinema", screen: "Screen 1", date: "2026-07-11T18:30:00.000Z", time: "19:30" });
  expect(result.bookedSeats).toEqual(["A1"]);
  expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/shows/availability?"), expect.objectContaining({ cache: "no-store" }));
  expect(fetch.mock.calls[0][0]).toContain("date=2026-07-11");
  expect(fetch.mock.calls[0][0]).not.toContain("18%3A30");
});

test("preserves structured API errors", async () => {
  fetch.mockResolvedValue({ ok: false, status: 409, json: async () => ({ code: "SEAT_CONFLICT", message: "Taken", conflictingSeats: ["A1"] }) });
  await expect(fetchAvailability({})).rejects.toMatchObject({ constructor: BookingApiError, status: 409, code: "SEAT_CONFLICT" });
});

test("creates one normalized booking request", async () => {
  fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, data: { _id: "ticket-1" } }),
  });

  await createBooking(
    {
      movie_id: "507f1f77bcf86cd799439011",
      date: "2026-07-28T00:00:00.000Z",
      seats: ["A1"],
    },
    "token"
  );

  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining("/tickets"),
    expect.objectContaining({
      method: "POST",
      body: expect.stringContaining('"date":"2026-07-28"'),
    })
  );
});

test("refreshes an expired access token and retries payment once", async () => {
  localStorage.setItem("token", "expired-token");
  localStorage.setItem("refreshToken", "persistent-refresh-token");
  fetch
    .mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ message: "Invalid token" }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "fresh-token" }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { _id: "ticket-1" },
      }),
    });

  await expect(
    createBooking(
      {
        movie_id: "507f1f77bcf86cd799439011",
        date: "2026-07-28",
        seats: ["A1"],
      },
      "expired-token"
    )
  ).resolves.toEqual({ _id: "ticket-1" });

  expect(fetch).toHaveBeenNthCalledWith(
    2,
    expect.stringContaining("/users/session/refresh"),
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        refreshToken: "persistent-refresh-token",
      }),
    })
  );
  expect(fetch).toHaveBeenNthCalledWith(
    3,
    expect.stringContaining("/tickets"),
    expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: "Bearer fresh-token",
      }),
    })
  );
  expect(localStorage.getItem("token")).toBe("fresh-token");
});
