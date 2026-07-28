import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import App from "../App";

function MockPage() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <main>
      <p>{location.pathname}</p>
      <Link to="/movies">Open movies</Link>
      <button type="button" onClick={() => navigate(-1)}>
        Back
      </button>
    </main>
  );
}

jest.mock("./HomePage", () => () => <MockPage />);
jest.mock("./MovieDetailPage", () => () => <div>Movie</div>);
jest.mock("./SeatSelectionPage", () => () => <div>Seats</div>);
jest.mock("./PaymentPage", () => () => <div>Payment</div>);
jest.mock("./TicketPage", () => () => <div>Tickets</div>);
jest.mock("./LoginPage", () => () => <div>Login</div>);
jest.mock("./AdminLogin", () => () => <div>Admin login</div>);
jest.mock("./AdminPage", () => () => <div>Admin</div>);

beforeEach(() => {
  window.history.replaceState({}, "", "/");
  window.scrollTo = jest.fn();
});

test("opens forward and back route navigation at the top", async () => {
  render(<App />);

  await waitFor(() => {
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  });

  window.scrollTo.mockClear();
  fireEvent.click(screen.getByRole("link", { name: "Open movies" }));
  await screen.findByText("/movies");
  expect(window.scrollTo).toHaveBeenCalledTimes(1);

  window.scrollTo.mockClear();
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  await screen.findByText("/");
  expect(window.scrollTo).toHaveBeenCalledTimes(1);
});
