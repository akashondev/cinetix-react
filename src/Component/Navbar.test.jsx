import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "./Navbar";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Navbar account menu", () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  test("routes logged-out users to sign in from the account control", () => {
    render(
      <MemoryRouter
        initialEntries={["/movies"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute(
      "href",
      "/login"
    );
    expect(screen.getByRole("link", { name: "Movies" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(
      screen.queryByRole("button", { name: /sign in/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /my bookings/i })
    ).not.toBeInTheDocument();
  });

  test("opens the account menu and logs the user out", () => {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userName", "Ava");
    localStorage.setItem("userEmail", "ava@example.com");
    localStorage.setItem("token", "access-token");
    localStorage.setItem("refreshToken", "refresh-token");

    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Navbar />
      </MemoryRouter>
    );

    const avatar = screen.getByRole("button", {
      name: /open account menu/i,
    });
    expect(avatar).toHaveTextContent("A");
    fireEvent.click(avatar);

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /my bookings/i })
    ).toHaveAttribute("href", "/ticket");
    expect(
      screen.queryByRole("menuitem", { name: /profile|settings/i })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /logout/i }));

    expect(localStorage.getItem("isLoggedIn")).toBeNull();
    expect(localStorage.getItem("userName")).toBeNull();
    expect(localStorage.getItem("userEmail")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/users/session/logout"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ refreshToken: "refresh-token" }),
      })
    );
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  test("updates to the avatar state when login completes", () => {
    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Navbar />
      </MemoryRouter>
    );

    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userName", "Riya Kapoor");
    localStorage.setItem("userEmail", "riya@example.com");
    act(() => {
      window.dispatchEvent(new Event("user-login"));
    });

    expect(
      screen.getByRole("button", { name: "Open account menu" })
    ).toHaveTextContent("RK");
  });
});
