import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

beforeEach(() => {
  jest.clearAllMocks();
});

test("shows movie card skeletons instead of loading circles", () => {
  axios.get.mockReturnValue(new Promise(() => {}));

  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <HomePage />
    </MemoryRouter>
  );

  expect(
    screen.getByRole("status", { name: "Loading Now Showing" })
  ).toBeInTheDocument();
  expect(screen.getAllByTestId("movie-card-skeleton")).toHaveLength(10);
  expect(document.querySelector(".animate-spin")).not.toBeInTheDocument();
});

test("hides the hero and shows every movie group on the movies route", async () => {
  axios.get.mockResolvedValue({
    data: [
      { _id: "showing", title: "Showing", releaseDate: "2020-01-01", banner: "/showing.jpg" },
      { _id: "upcoming", title: "Upcoming", releaseDate: "2035-01-01", banner: "/upcoming.jpg" },
    ],
  });

  render(
    <MemoryRouter
      initialEntries={["/movies"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <HomePage />
    </MemoryRouter>
  );

  expect(
    screen.queryByRole("heading", { name: "Experience the Magic of Cinema" })
  ).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Now Showing" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Coming Soon" })).toBeInTheDocument();
  expect(await screen.findByText("now-showing:Showing")).toBeInTheDocument();
  expect(screen.getByText("coming-soon:Upcoming")).toBeInTheDocument();
});

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
  expect(screen.getAllByRole("button", { name: "View All" })).toHaveLength(2);
});

test("shows empty states for a malformed movie collection", async () => {
  axios.get.mockResolvedValue({ data: { movies: {} } });

  render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><HomePage /></MemoryRouter>);

  expect(await screen.findByText("No movies currently showing. Check back soon!")).toBeInTheDocument();
  expect(screen.getByText("No upcoming movies announced yet. Stay tuned!")).toBeInTheDocument();
});

test("shows ten now showing movies first and expands to all fifteen in place", async () => {
  axios.get.mockResolvedValue({
    data: Array.from({ length: 15 }, (_, index) => ({
      _id: `now-${index}`,
      title: `Now ${index}`,
      releaseDate: "2020-01-01",
      banner: `/now-${index}.jpg`,
    })),
  });

  render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><HomePage /></MemoryRouter>);

  await screen.findByText("now-showing:Now 0");
  expect(screen.getAllByText(/^now-showing:/)).toHaveLength(10);
  const viewAllButtons = screen.getAllByRole("button", { name: "View All" });
  fireEvent.click(viewAllButtons[0]);
  expect(screen.getAllByText(/^now-showing:/)).toHaveLength(15);
  expect(screen.getByRole("button", { name: "Show Less" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Show Less" }));
  expect(screen.getAllByText(/^now-showing:/)).toHaveLength(10);
});

test("keeps the Now Showing section at fifteen when the API includes extra records", async () => {
  axios.get.mockResolvedValue({
    data: Array.from({ length: 17 }, (_, index) => ({
      _id: `now-${index}`,
      title: `Now ${index}`,
      source: index === 16 ? "manual" : "tmdb",
      releaseDate: "2020-01-01",
      banner: `/now-${index}.jpg`,
    })),
  });

  render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><HomePage /></MemoryRouter>);

  await screen.findByText("now-showing:Now 0");
  expect(screen.getAllByText(/^now-showing:/)).toHaveLength(10);
  fireEvent.click(screen.getAllByRole("button", { name: "View All" })[0]);
  expect(screen.getAllByText(/^now-showing:/)).toHaveLength(15);
});

test("shows five coming soon movies with Indian movies prioritized and expands to ten", async () => {
  axios.get.mockResolvedValue({
    data: [
      ...Array.from({ length: 5 }, (_, index) => ({
        _id: `intl-${index}`,
        title: `International ${index}`,
        originGroup: "international",
        releaseDate: "2035-01-01",
        banner: `/intl-${index}.jpg`,
      })),
      ...Array.from({ length: 5 }, (_, index) => ({
        _id: `ind-${index}`,
        title: `Indian ${index}`,
        originGroup: "indian",
        releaseDate: "2035-01-01",
        banner: `/ind-${index}.jpg`,
      })),
    ],
  });

  render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><HomePage /></MemoryRouter>);

  await screen.findByText("coming-soon:Indian 0");
  expect(screen.getAllByText(/^coming-soon:/)).toHaveLength(5);
  expect(screen.getAllByText(/^coming-soon:/).filter((node) => node.textContent.includes("Indian")).length).toBeGreaterThanOrEqual(3);
  fireEvent.click(screen.getAllByRole("button", { name: "View All" })[0]);
  expect(screen.getAllByText(/^coming-soon:/)).toHaveLength(10);
  expect(screen.getByRole("button", { name: "Show Less" })).toBeInTheDocument();
});
