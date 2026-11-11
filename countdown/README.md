# Event Countdown

A small single-page app that shows a live countdown to a hardcoded list of dates. The clock starts when the page loads and ticks every second, and the list reorders itself so the event happening soonest is always on top.

- Single dates, yearly date ranges, and "nth weekday of a month" dates (like Thanksgiving) are supported.
- Once a date has passed, the countdown rolls over to next year's occurrence.
- When a date-range event is happening, its row turns green, moves to the top, and counts down to the end of the range instead.
- Each event can have an optional image.
- Events can have an optional `theme` so a row uses its own color (like QuakeCon's orange) instead of green while it's happening.

## Tracked dates

| Event | Date | Notes |
| --- | --- | --- |
| New Year's Day | 1/1 | |
| Valentine's Day | 2/14 | |
| Independence Day | 7/4 | |
| Halloween | 10/31 | |
| Thanksgiving | 4th Thursday of November | |
| Christmas | 12/25 | |
| Daylight Saving Time Starts | 2nd Sunday of March, 2:00 AM | US rules |
| Daylight Saving Time Ends | 1st Sunday of November, 2:00 AM | US rules |
| Scarborough Renaissance Festival | 4/10 – 5/31 | Date range. Turns green while it's on. |
| QuakeCon | 8/6 – 8/9 | Date range. Turns Quake orange while it's on. Currently the 2026 dates. |

Notes:

- All countdowns use the viewer's local time zone, and single dates start at local midnight.
- A range includes its whole last day.
- The Scarborough dates match the 2027 season listed on the [festival's site](https://www.srfestival.com/) (open Saturdays, Sundays and Memorial Day Monday). The app repeats the range every year, so update it when new dates are announced. Its logo is loaded from the festival's site, so it needs internet access to show.
- The QuakeCon dates are from 2026 (the 30th anniversary, August 6–9). The countdown repeats them every year, so update them once the next dates are announced. Its logo is loaded from Wikimedia Commons, so it needs internet access to show.

## Tech stack

- [React](https://react.dev/) 19
- [Vite](https://vite.dev/) 8 for the dev server and build
- [Vitest](https://vitest.dev/), [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) and jsdom for tests
- [nginx](https://nginx.org/) (alpine) to serve the built files, in a multi-stage Docker build (`node:20-alpine` to build)

## Running it

From the repo root, as part of the self-hosted stack (served at <http://localhost:8082>):

```bash
docker compose up --build -d countdown
```

For local development, from this folder:

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # production build into dist/
npm test         # run the tests once
```

## Adding or changing events

Events live in the `EVENTS` array in [src/App.jsx](./src/App.jsx). Each event has a `name`, a date, and an optional `image` (a URL, or a path to a file in [public/](./public)).

```js
{ name: 'Halloween', month: 10, day: 31, image: '/halloween.svg' }                    // single date
{ name: 'Some Fair', month: 4, day: 10, endMonth: 5, endDay: 31 }                     // date range
{ name: 'Thanksgiving', nthWeekday: { month: 11, weekday: 4, nth: 4 } }              // 4th Thursday of November
{ name: 'DST Ends', nthWeekday: { month: 11, weekday: 0, nth: 1, hour: 2 } }         // add `hour` for a time of day
```

`weekday` is 0 for Sunday through 6 for Saturday. The date math lives in [src/schedule.js](./src/schedule.js), with tests in `src/*.test.js` and `src/*.test.jsx`.
