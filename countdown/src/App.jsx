import { useEffect, useState } from 'react';
import { getStatus } from './schedule.js';

// `image` is optional: a URL or a path under public/ (e.g. '/christmas.jpg').
// Add `endMonth` and `endDay` to make an event a date range, or use `nthWeekday`
// for dates like "2nd Sunday of March". Daylight saving rules below are the US ones.
// `theme` is optional: a class name (see styles.css) that recolors the row while the event is
// happening, instead of the default green.
const EVENTS = [
  { name: "New Year's Day", month: 1, day: 1, image: '/new-years-day.svg' },
  { name: "Valentine's Day", month: 2, day: 14, image: '/valentines-day.svg' },
  { name: 'Independence Day', month: 7, day: 4, image: '/independence-day.svg' },
  { name: 'Halloween', month: 10, day: 31, image: '/halloween.svg' },
  { name: 'Christmas', month: 12, day: 25, image: '/christmas.svg' },
  {
    name: 'Thanksgiving',
    nthWeekday: { month: 11, weekday: 4, nth: 4 },
    image: '/thanksgiving.svg',
  },
  {
    name: 'Daylight Saving Time Starts',
    nthWeekday: { month: 3, weekday: 0, nth: 2, hour: 2 },
    image: '/dst-starts.svg',
  },
  {
    name: 'Daylight Saving Time Ends',
    nthWeekday: { month: 11, weekday: 0, nth: 1, hour: 2 },
    image: '/dst-ends.svg',
  },
  {
    name: 'Scarborough Renaissance Festival',
    month: 4,
    day: 10,
    endMonth: 5,
    endDay: 31,
    image:
      'https://www.srfestival.com/wp-content/uploads/2025/08/SRF2022-FINAL-SHIELD-COLOR-REV25_022825-658w-png.png',
  },
  // 2026 dates (30th anniversary, Aug 6-9). Update when the next dates are announced.
  {
    name: 'QuakeCon',
    month: 8,
    day: 6,
    endMonth: 8,
    endDay: 9,
    image: 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Quake_Q_logo.png',
    theme: 'theme-quake',
  },
];

function formatDate({ month, day, endMonth, endDay, nthWeekday, start }) {
  if (nthWeekday) {
    const date = start.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'numeric',
      day: 'numeric',
    });
    const { hour } = nthWeekday;
    // Only show a time for events that happen at a specific hour.
    return hour === undefined ? date : `${date}, ${hour % 12 || 12}:00 ${hour < 12 ? 'AM' : 'PM'}`;
  }
  return endMonth === undefined ? `${month}/${day}` : `${month}/${day} – ${endMonth}/${endDay}`;
}

function timerLabel(row) {
  if (row.active) return 'Ends in';
  return row.endMonth === undefined ? 'Happens in' : 'Starts in';
}

function splitRemaining(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

const pad = (n) => String(n).padStart(2, '0');

export default function App() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Events happening now come first, then the rest by time until they start.
  const rows = EVENTS.map((event) => ({ ...event, ...getStatus(event, now) })).sort(
    (a, b) => b.active - a.active || a.remaining - b.remaining
  );

  return (
    <main className="container">
      <h1>Event Countdown</h1>
      <ul className="event-list">
        {rows.map((row) => {
          const { days, hours, minutes, seconds } = splitRemaining(row.remaining);
          return (
            <li
              key={row.name}
              className={row.active ? `event active ${row.theme ?? ''}`.trim() : 'event'}
            >
              {row.image && <img className="event-image" src={row.image} alt={row.name} />}
              <div className="event-info">
                <span className="event-name">{row.name}</span>
                <span className="event-date">{formatDate(row)}</span>
              </div>
              <div className="event-timer">
                <span className="event-label">{timerLabel(row)}</span>
                <span className="event-countdown">
                  {`${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
