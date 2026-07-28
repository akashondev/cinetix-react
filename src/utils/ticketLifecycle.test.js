import {
  hasShowPassed,
  sortTicketsNewestFirst,
} from "./ticketLifecycle";

test("sorts a copy of tickets by purchase date newest first", () => {
  const tickets = [
    { _id: "older", createdAt: "2026-07-27T10:00:00.000Z" },
    { _id: "newer", createdAt: "2026-07-28T10:00:00.000Z" },
  ];

  expect(sortTicketsNewestFirst(tickets).map(({ _id }) => _id)).toEqual([
    "newer",
    "older",
  ]);
  expect(tickets.map(({ _id }) => _id)).toEqual(["older", "newer"]);
});

test("recognizes supported 12-hour showtimes only after they pass", () => {
  const ticket = {
    date: "2026-07-28T00:00:00.000Z",
    time: "7:30 PM",
  };

  expect(hasShowPassed(ticket, new Date("2026-07-28T19:31:00.000Z"))).toBe(
    true
  );
  expect(hasShowPassed(ticket, new Date("2026-07-28T19:29:00.000Z"))).toBe(
    false
  );
});
