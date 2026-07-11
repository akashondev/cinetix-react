import { render, screen } from "@testing-library/react";
import App from "./App";

jest.mock("./Component/HomePage", () => () => <div>CineTix home</div>);
jest.mock("./Component/MovieDetailPage", () => () => <div>Movie</div>);
jest.mock("./Component/SeatSelectionPage", () => () => <div>Seats</div>);
jest.mock("./Component/PaymentPage", () => () => <div>Payment</div>);
jest.mock("./Component/TicketPage", () => () => <div>Tickets</div>);
jest.mock("./Component/LoginPage", () => () => <div>Login</div>);
jest.mock("./Component/AdminLogin", () => () => <div>Admin login</div>);
jest.mock("./Component/AdminPage", () => () => <div>Admin</div>);

test("renders the application home route", async () => {
  render(<App />);
  expect(await screen.findByText("CineTix home")).toBeInTheDocument();
});
