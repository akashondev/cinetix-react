import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import HomePage from "./HomePage";

jest.mock("axios", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("framer-motion", () => {
  const React = require("react");
  const element = (tag) => React.forwardRef(({ initial, animate, whileInView, viewport, transition, whileHover, ...props }, ref) => React.createElement(tag, { ...props, ref }));
  return { motion: { div: element("div"), img: element("img"), article: element("article") }, useReducedMotion: () => false };
});
jest.mock("./Navbar", () => () => <nav>Navigation</nav>);
jest.mock("./Footer", () => () => <footer>Footer</footer>);
jest.mock("./MovieCard", () => ({ title, category }) => <div>{category}:{title}</div>);

test("keeps movie fetching and uses the first now-showing banner in the hero", async () => {
  axios.get.mockResolvedValue({ data: [
    { _id: "released", title: "Released", banner: "/released.jpg", releaseDate: "2020-01-01" },
    { _id: "future", title: "Future", banner: "/future.jpg", releaseDate: "2035-01-01" },
  ] });
  render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><HomePage /></MemoryRouter>);
  await waitFor(() => expect(axios.get).toHaveBeenCalledWith(expect.stringMatching(/\/movies$/)));
  expect(await screen.findByRole("img", { name: /featured now showing: released/i })).toHaveAttribute("src", "/released.jpg");
  expect(screen.getByRole("heading", { name: "Now Showing" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Coming Soon" })).toBeInTheDocument();
  expect(screen.getAllByRole("link", { name: /view all/i }).map((link) => link.getAttribute("href"))).toEqual(expect.arrayContaining(["/movies", "/coming-soon"]));
});
