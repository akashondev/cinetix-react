import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
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
  });

  test("routes logged-out users to sign in from the account control", () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const accountButton = screen.getByRole("button", {
      name: /sign in/i,
    });

    expect(accountButton).toBeEnabled();

    fireEvent.click(accountButton);

    expect(mockNavigate).toHaveBeenCalledWith("/login");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /tickets/i })).not.toBeInTheDocument();
  });

  test("opens the account menu and logs the user out", () => {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userName", "Ava");
    localStorage.setItem("userEmail", "ava@example.com");

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /open account menu/i,
      })
    );

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /tickets/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /logout/i }));

    expect(localStorage.getItem("isLoggedIn")).toBeNull();
    expect(localStorage.getItem("userName")).toBeNull();
    expect(localStorage.getItem("userEmail")).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
