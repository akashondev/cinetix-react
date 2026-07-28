import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TicketPage from "./TicketPage";

jest.mock("./Navbar", () => () => <nav>Navigation</nav>);
jest.mock("./Footer", () => () => <footer>Footer</footer>);
jest.mock("html2canvas", () => jest.fn());
jest.mock("jspdf", () => jest.fn());
jest.mock("qrcode.react", () => ({ QRCodeSVG: () => <svg aria-label="QR code" /> }));
jest.mock("../config/api", () => ({ API_URL: "https://api.example/api" }));

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("token", "token");
  global.fetch = jest.fn(() => new Promise(() => {}));
});

test("shows the ticket page structure and skeletons while tickets load", () => {
  render(
    <MemoryRouter>
      <TicketPage />
    </MemoryRouter>
  );

  expect(screen.getByText("Your Tickets")).toBeInTheDocument();
  expect(
    screen.getByRole("status", { name: "Loading your tickets" })
  ).toBeInTheDocument();
  expect(document.querySelector(".animate-spin")).not.toBeInTheDocument();
});
