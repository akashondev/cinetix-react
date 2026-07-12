export const isInvalidSessionStatus = (status) => status === 401 || status === 403;

export function clearUserSession() {
  ["token", "isLoggedIn", "userName", "userEmail"].forEach((key) => {
    localStorage.removeItem(key);
  });
  window.dispatchEvent(new Event("user-logout"));
}
