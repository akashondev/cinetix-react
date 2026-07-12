import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import HomePage from "./HomePage";

jest.mock("axios", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("../config/api", () => ({
  API_URL: "https://cinetix-api-rcv5.onrender.com/api",
}));
jest.mock("framer-motion", () => {
  const React = require("react");
  const element = (tag) => React.forwardRef(({ initial, animate, whileInView, viewport, transition, whileHover, ...props }, ref) => React.createElement(tag, { ...props, ref }));
  return { motion: { div: element("div"), img: element("img"), article: element("article") }, useReducedMotion: () => false };
});
jest.mock("./Navbar", () => () => <nav>Navigation</nav>);
jest.mock("./Footer", () => () => <footer>Footer</footer>);
jest.mock("./MovieCard", () => ({ title, category }) => <div>{category}:{title}</div>);

test("fetches the production movies URL and groups movies by release date", async () => {
  axios.get.mockResolvedValue({ data: [
    { _id: "showing", title: "Showing", category: "comingSoon", releaseDate: "2020-01-01", banner: "/showing.jpg" },
    { _id: "soon", title: "Soon", category: "nowShowing", releaseDate: "2035-01-01", banner: "/soon.jpg" },
    { _id: "hidden", title: "Hidden", category: "nowShowing", releaseDate: "invalid", banner: "/hidden.jpg" },
  ] });
  render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><HomePage /></MemoryRouter>);
  await waitFor(() => expect(axios.get).toHaveBeenCalledWith("https://cinetix-api-rcv5.onrender.com/api/movies"));
  expect(await screen.findByText("now-showing:Showing")).toBeInTheDocument();
  expect(screen.getByText("coming-soon:Soon")).toBeInTheDocument();
  expect(screen.queryByText(/Hidden/)).not.toBeInTheDocument();
  expect(screen.getByRole("img", { name: /cinema audience watching a movie/i })).toBeInTheDocument();
  expect(screen.getByRole("img", { name: /premium movie theater seats/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Now Showing" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Coming Soon" })).toBeInTheDocument();
  expect(screen.getAllByRole("link", { name: /view all/i }).map((link) => link.getAttribute("href"))).toEqual(expect.arrayContaining(["/movies", "/coming-soon"]));
});

test("shows empty states for a malformed movie collection", async () => {
  axios.get.mockResolvedValue({ data: { movies: {} } });

  render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><HomePage /></MemoryRouter>);

  expect(await screen.findByText("No movies currently showing. Check back soon!")).toBeInTheDocument();
  expect(screen.getByText("No upcoming movies announced yet. Stay tuned!")).toBeInTheDocument();
});
