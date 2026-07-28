import { API_URL } from "../config/api";
import {
  clearUserSession,
  isInvalidSessionStatus,
} from "./authSession";

let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  const response = await fetch(`${API_URL}/users/session/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) return null;

  const payload = await response.json();
  if (!payload.token) return null;
  localStorage.setItem("token", payload.token);
  return payload.token;
}

function getFreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function authenticatedFetch(url, options = {}) {
  const response = await fetch(url, options);
  if (!isInvalidSessionStatus(response.status)) return response;

  let token = null;
  try {
    token = await getFreshAccessToken();
  } catch (error) {
    token = null;
  }
  if (!token) {
    clearUserSession();
    return response;
  }

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
}
