const API_URL = process.env.REACT_APP_BACKEND_URL;

export class BookingApiError extends Error {
  constructor(status, payload) {
    super(payload?.message || "Booking request failed");
    this.name = "BookingApiError";
    this.status = status;
    this.code = payload?.code;
    this.payload = payload;
  }
}

export function normalizeCalendarDate(value) {
  const match = String(value || "").match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : value;
}

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new BookingApiError(response.status, payload);
  return payload.data;
}

export function fetchAvailability(identity, { signal } = {}) {
  const query = new URLSearchParams({ ...identity, date: normalizeCalendarDate(identity?.date) }).toString();
  return request(`${API_URL}/shows/availability?${query}`, { signal, cache: "no-store" });
}

export function createBooking(payload, token, { signal } = {}) {
  return request(`${API_URL}/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ...payload, date: normalizeCalendarDate(payload?.date) }),
    signal,
  });
}
