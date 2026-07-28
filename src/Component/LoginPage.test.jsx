import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

test("stores the persistent refresh credential after login", async () => {
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );

  fireEvent.change(screen.getByPlaceholderText("your@email.com"), {
    target: { value: "user@example.com" },
  });
  fireEvent.change(document.querySelector('input[type="password"]'), {
    target: { value: "password123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Log In" }));

  await waitFor(() => {
    expect(localStorage.getItem("refreshToken")).toBe("refresh-token");
  });
});
