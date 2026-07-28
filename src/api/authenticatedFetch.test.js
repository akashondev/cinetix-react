import { authenticatedFetch } from "./authenticatedFetch";

const expiredResponse = {
  ok: false,
  status: 403,
  json: async () => ({ message: "Invalid token" }),
};

beforeEach(() => {
  global.fetch = jest.fn();
  localStorage.clear();
  localStorage.setItem("token", "expired-token");
  localStorage.setItem("refreshToken", "persistent-refresh-token");
});

test("concurrent expired requests share one refresh exchange", async () => {
  fetch
    .mockResolvedValueOnce(expiredResponse)
    .mockResolvedValueOnce(expiredResponse)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "fresh-token" }),
    })
    .mockResolvedValueOnce({ ok: true, status: 200 })
    .mockResolvedValueOnce({ ok: true, status: 200 });

  const [first, second] = await Promise.all([
    authenticatedFetch("/first", {
      headers: { Authorization: "Bearer expired-token" },
    }),
    authenticatedFetch("/second", {
      headers: { Authorization: "Bearer expired-token" },
    }),
  ]);

  expect(first.status).toBe(200);
  expect(second.status).toBe(200);
  expect(
    fetch.mock.calls.filter(([url]) =>
      String(url).includes("/users/session/refresh")
    )
  ).toHaveLength(1);
});

test("failed refresh clears the persistent browser session", async () => {
  localStorage.setItem("isLoggedIn", "true");
  fetch
    .mockResolvedValueOnce(expiredResponse)
    .mockResolvedValueOnce({ ok: false, status: 401 });

  const response = await authenticatedFetch("/tickets", {
    headers: { Authorization: "Bearer expired-token" },
  });

  expect(response).toBe(expiredResponse);
  expect(localStorage.getItem("token")).toBeNull();
  expect(localStorage.getItem("refreshToken")).toBeNull();
  expect(localStorage.getItem("isLoggedIn")).toBeNull();
});
