import { fetchAvailability, BookingApiError } from "./bookingApi";

beforeEach(() => { global.fetch = jest.fn(); });

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
