import { API_URL } from "../config/api";

export const isInvalidSessionStatus = (status) => status === 401 || status === 403;

export function clearUserSession() {
  [
    "token",
    "refreshToken",
    "isLoggedIn",
    "userName",
    "userEmail",
    "currentUser",
  ].forEach((key) => {
    localStorage.removeItem(key);
  });
  window.dispatchEvent(new Event("user-logout"));
}

export async function revokeAndClearUserSession() {
  const refreshToken = localStorage.getItem("refreshToken");
  clearUserSession();
  if (!refreshToken) return;

  try {
    await fetch(`${API_URL}/users/session/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } catch (error) {
    // Local logout must still succeed when the API is unavailable.
  }
}
