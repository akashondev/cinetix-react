import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TrailerModal from "./TrailerModal";

const embedUrl =
  "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0";

test("renders the movie trailer inside a named modal dialog", () => {
  render(
    <TrailerModal
      isOpen
      title="Dune: Part Two"
      embedUrl={embedUrl}
      onClose={() => {}}
    />
  );

  expect(
    screen.getByRole("dialog", { name: /dune: part two trailer/i })
  ).toBeInTheDocument();
  expect(screen.getByTitle("Dune: Part Two trailer")).toHaveAttribute(
    "src",
    embedUrl
  );
  expect(document.body).toHaveStyle({ overflow: "hidden" });
});

test("closes from the button, Escape key, and backdrop", async () => {
  const onClose = jest.fn();
  render(
    <TrailerModal
      isOpen
      title="Dune: Part Two"
      embedUrl={embedUrl}
      onClose={onClose}
    />
  );

  await userEvent.click(
    screen.getByRole("button", { name: /close trailer/i })
  );
  expect(onClose).toHaveBeenCalledTimes(1);

  fireEvent.keyDown(document, { key: "Escape" });
  expect(onClose).toHaveBeenCalledTimes(2);

  fireEvent.mouseDown(screen.getByTestId("trailer-backdrop"));
  expect(onClose).toHaveBeenCalledTimes(3);
});

test("does not close when the player surface is clicked", () => {
  const onClose = jest.fn();
  render(
    <TrailerModal
      isOpen
      title="Dune: Part Two"
      embedUrl={embedUrl}
      onClose={onClose}
    />
  );

  fireEvent.mouseDown(
    screen.getByRole("dialog", { name: /dune: part two trailer/i })
  );
  expect(onClose).not.toHaveBeenCalled();
});

test("restores body scrolling and focus after closing", () => {
  const trigger = document.createElement("button");
  document.body.appendChild(trigger);
  trigger.focus();

  const { rerender } = render(
    <TrailerModal
      isOpen={false}
      title="Dune: Part Two"
      embedUrl={embedUrl}
      onClose={() => {}}
    />
  );

  rerender(
    <TrailerModal
      isOpen
      title="Dune: Part Two"
      embedUrl={embedUrl}
      onClose={() => {}}
    />
  );
  expect(document.body).toHaveStyle({ overflow: "hidden" });

  rerender(
    <TrailerModal
      isOpen={false}
      title="Dune: Part Two"
      embedUrl={embedUrl}
      onClose={() => {}}
    />
  );

  expect(document.body).not.toHaveStyle({ overflow: "hidden" });
  expect(trigger).toHaveFocus();
  trigger.remove();
});
