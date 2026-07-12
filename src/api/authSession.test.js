import { clearUserSession, isInvalidSessionStatus } from "./authSession";

describe("authentication session recovery", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test.each([401, 403])("treats HTTP %s as an invalid session", (status) => {
    expect(isInvalidSessionStatus(status)).toBe(true);
  });

  test.each([400, 409, 500])("does not treat HTTP %s as an invalid session", (status) => {
    expect(isInvalidSessionStatus(status)).toBe(false);
  });

  test("clears user authentication and announces logout", () => {
    ["token", "isLoggedIn", "userName", "userEmail"].forEach((key) => {
      localStorage.setItem(key, "stored");
    });
    const listener = jest.fn();
    window.addEventListener("user-logout", listener);

    clearUserSession();

    ["token", "isLoggedIn", "userName", "userEmail"].forEach((key) => {
      expect(localStorage.getItem(key)).toBeNull();
    });
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener("user-logout", listener);
  });
});
