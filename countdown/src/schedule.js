// Events are one of:
//  - a single date: { month, day }
//  - a yearly range: { month, day, endMonth, endDay }
//  - a floating date: { nthWeekday: { month, weekday, nth, hour } }, e.g. the 2nd Sunday
//    of March at 2 AM (weekday 0 = Sunday).
// Returns { active, remaining, start } where remaining is ms until the start (upcoming)
// or until the end (active, ranges only) and start is when the event begins.
export function getStatus(event, now) {
  const { month, day, endMonth, endDay } = event;

  if (endMonth === undefined) {
    let target = occurrence(event, now.getFullYear());
    // Once the date's start has passed (including today), count to next year's occurrence.
    if (target <= now) {
      target = occurrence(event, now.getFullYear() + 1);
    }
    return { active: false, remaining: target - now, start: target };
  }

  const wrapsYear = endMonth < month || (endMonth === month && endDay < day);
  // Start from last year so ranges spanning New Year are still active in January.
  for (let year = now.getFullYear() - 1; ; year++) {
    const start = new Date(year, month - 1, day);
    // The end day is inclusive, so the range runs until the following midnight.
    const end = new Date(year + (wrapsYear ? 1 : 0), endMonth - 1, endDay + 1);
    if (now < end) {
      return start <= now
        ? { active: true, remaining: end - now, start }
        : { active: false, remaining: start - now, start };
    }
  }
}

function occurrence({ month, day, nthWeekday }, year) {
  if (!nthWeekday) {
    return new Date(year, month - 1, day);
  }
  const { month: m, weekday, nth, hour = 0 } = nthWeekday;
  const firstOfMonth = new Date(year, m - 1, 1);
  const offset = (weekday - firstOfMonth.getDay() + 7) % 7;
  const midnight = new Date(year, m - 1, 1 + offset + (nth - 1) * 7);
  // Add elapsed hours rather than setting the local hour, so clock changes at 2 AM
  // (a skipped or repeated hour) still land on the real transition moment.
  return new Date(midnight.getTime() + hour * 3600000);
}
