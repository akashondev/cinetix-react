function parseTime(value) {
  const match = String(value || "")
    .trim()
    .toUpperCase()
    .match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (
    minute > 59 ||
    (match[3] && (hour < 1 || hour > 12)) ||
    (!match[3] && hour > 23)
  ) {
    return null;
  }
  if (match[3] === "AM" && hour === 12) hour = 0;
  if (match[3] === "PM" && hour !== 12) hour += 12;
  return { hour, minute };
}

export function sortTicketsNewestFirst(tickets = []) {
  return [...tickets].sort((left, right) => {
    const rightTime = new Date(right?.createdAt || 0).getTime() || 0;
    const leftTime = new Date(left?.createdAt || 0).getTime() || 0;
    return rightTime - leftTime;
  });
}

export function hasShowPassed(ticket, now = new Date()) {
  const date = new Date(ticket?.date);
  const time = parseTime(ticket?.time);
  if (Number.isNaN(date.getTime()) || !time) return false;

  const show = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      time.hour,
      time.minute
    )
  );
  return show.getTime() < now.getTime();
}
