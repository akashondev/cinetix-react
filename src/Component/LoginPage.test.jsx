import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "./LoginPage";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});
jest.mock("./Navbar", () => () => (
  <nav aria-label="Primary navigation">CineTix</nav>
));
jest.mock("./Footer", () => () => <footer>CineTix footer</footer>);

function renderLogin() {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <LoginPage />
    </MemoryRouter>
  );
}

function submitLogin() {
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "user@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "password123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Log in" }));
}

beforeEach(() => {
  localStorage.clear();
  mockNavigate.mockClear();
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      token: "access-token",
      refreshToken: "refresh-token",
      name: "User",
    }),
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test("renders a minimal accessible login card", () => {
  renderLogin();

  expect(screen.getByRole("navigation")).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Welcome back" })
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Email address")).toBeInTheDocument();
  expect(screen.getByLabelText("Password")).toBeInTheDocument();
  expect(screen.queryByText("Or continue with")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Google" })
  ).not.toBeInTheDocument();
  expect(document.querySelector('[class*="spin_4s"]')).not.toBeInTheDocument();
});

test("keeps registration available in the same card", () => {
  renderLogin();

  fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

  expect(screen.getByLabelText("Full name")).toBeInTheDocument();
  expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Create account" })
  ).toBeInTheDocument();
});

test("stores the persistent session and announces successful login", async () => {
  const loginListener = jest.fn();
  window.addEventListener("user-login", loginListener);
  renderLogin();

  submitLogin();

  await waitFor(() => {
    expect(localStorage.getItem("refreshToken")).toBe("refresh-token");
  });
  expect(loginListener).toHaveBeenCalledTimes(1);
  window.removeEventListener("user-login", loginListener);
});

test("clears the redirect timer when the page unmounts", async () => {
  jest.useFakeTimers();
  const clearTimer = jest.spyOn(window, "clearTimeout");
  const { unmount } = renderLogin();

  submitLogin();
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(screen.getByText(/successfully logged in/i)).toBeInTheDocument();
  unmount();

  expect(clearTimer).toHaveBeenCalled();
});
