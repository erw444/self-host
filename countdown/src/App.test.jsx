import { act, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';

const FESTIVAL = 'Scarborough Renaissance Festival';

function renderAt(date) {
  vi.setSystemTime(date);
  render(<App />);
}

const row = (name) => screen.getByText(name).closest('li');
const rowNames = () =>
  screen.getAllByRole('listitem').map((li) => li.querySelector('.event-name').textContent);

describe('App', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the date range for range events and a single date for the rest', () => {
    renderAt(new Date(2026, 10, 11, 10));
    expect(within(row(FESTIVAL)).getByText('4/10 – 5/31')).toBeInTheDocument();
    expect(within(row('Christmas')).getByText('12/25')).toBeInTheDocument();
  });

  it('orders upcoming events by how soon they start', () => {
    renderAt(new Date(2026, 10, 11, 10));
    expect(rowNames()).toEqual([
      'Thanksgiving',
      'Christmas',
      "New Year's Day",
      "Valentine's Day",
      'Daylight Saving Time Starts',
      FESTIVAL,
      'Independence Day',
      'QuakeCon',
      'Halloween',
      'Daylight Saving Time Ends',
    ]);
  });

  it('shows the QuakeCon dates as a range', () => {
    renderAt(new Date(2026, 10, 11, 10));
    expect(within(row('QuakeCon')).getByText('8/6 – 8/9')).toBeInTheDocument();
  });

  it('turns QuakeCon orange, not green, while it is happening', () => {
    renderAt(new Date(2027, 7, 7, 12));
    const quakecon = row('QuakeCon');
    expect(quakecon).toHaveClass('active', 'theme-quake');
    expect(within(quakecon).getByText('Ends in')).toBeInTheDocument();
    expect(rowNames()[0]).toBe('QuakeCon');
  });

  it('keeps QuakeCon unthemed before and after it happens', () => {
    renderAt(new Date(2027, 7, 5, 12));
    expect(row('QuakeCon')).not.toHaveClass('active');
    expect(row('QuakeCon')).not.toHaveClass('theme-quake');
    expect(within(row('QuakeCon')).getByText('Starts in')).toBeInTheDocument();
  });

  it('uses the default green for active events without a theme', () => {
    renderAt(new Date(2027, 4, 1, 12));
    expect(row(FESTIVAL)).toHaveClass('active');
    expect(row(FESTIVAL)).not.toHaveClass('theme-quake');
  });

  it('shows the weekday, date and time for daylight saving changes', () => {
    renderAt(new Date(2026, 10, 11, 10));
    expect(within(row('Daylight Saving Time Starts')).getByText('Sun, 3/14, 2:00 AM')).toBeInTheDocument();
    expect(within(row('Daylight Saving Time Ends')).getByText('Sun, 11/7, 2:00 AM')).toBeInTheDocument();
  });

  it('shows the weekday and date, without a time, for floating holidays', () => {
    renderAt(new Date(2026, 10, 11, 10));
    expect(within(row('Thanksgiving')).getByText('Thu, 11/26')).toBeInTheDocument();
  });

  it('counts down to the daylight saving change on the day itself', () => {
    renderAt(new Date(2027, 10, 7, 0, 0, 0));
    const ends = row('Daylight Saving Time Ends');
    expect(ends).not.toHaveClass('active');
    expect(within(ends).getByText('0d 02:00:00')).toBeInTheDocument();
  });

  it('counts down to the start of a range event that has not begun', () => {
    renderAt(new Date(2027, 3, 9, 12));
    const festival = row(FESTIVAL);
    expect(festival).not.toHaveClass('active');
    expect(within(festival).getByText('Starts in')).toBeInTheDocument();
    expect(within(festival).getByText('0d 12:00:00')).toBeInTheDocument();
  });

  it('turns green, moves to the top and counts down to the end while happening', () => {
    renderAt(new Date(2027, 4, 1, 12));
    const festival = row(FESTIVAL);
    expect(festival).toHaveClass('active');
    expect(within(festival).getByText('Ends in')).toBeInTheDocument();
    expect(within(festival).getByText('30d 12:00:00')).toBeInTheDocument();
    expect(rowNames()[0]).toBe(FESTIVAL);
  });

  it('keeps single-date events inactive, even on the day itself', () => {
    renderAt(new Date(2026, 11, 25, 12));
    const christmas = row('Christmas');
    expect(christmas).not.toHaveClass('active');
    expect(within(christmas).getByText('Happens in')).toBeInTheDocument();
  });

  it('ticks the countdown every second', () => {
    renderAt(new Date(2027, 4, 1, 12));
    expect(within(row(FESTIVAL)).getByText('30d 12:00:00')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1000));
    expect(within(row(FESTIVAL)).getByText('30d 11:59:59')).toBeInTheDocument();
  });

  it('switches from "Starts in" to "Ends in" when the start time arrives', () => {
    renderAt(new Date(2027, 3, 9, 23, 59, 58));
    expect(row(FESTIVAL)).not.toHaveClass('active');

    act(() => vi.advanceTimersByTime(2000));
    const festival = row(FESTIVAL);
    expect(festival).toHaveClass('active');
    expect(within(festival).getByText('Ends in')).toBeInTheDocument();
    expect(rowNames()[0]).toBe(FESTIVAL);
  });

  it('stops being active after the end date has fully passed', () => {
    renderAt(new Date(2027, 4, 31, 23, 59, 58));
    expect(row(FESTIVAL)).toHaveClass('active');

    act(() => vi.advanceTimersByTime(2000));
    const festival = row(FESTIVAL);
    expect(festival).not.toHaveClass('active');
    expect(within(festival).getByText('Starts in')).toBeInTheDocument();
    expect(rowNames()[0]).not.toBe(FESTIVAL);
  });

  it('renders an image for events that have one, including remote URLs', () => {
    renderAt(new Date(2026, 10, 11, 10));
    expect(within(row('Christmas')).getByRole('img', { name: 'Christmas' })).toHaveAttribute(
      'src',
      '/christmas.svg'
    );
    expect(within(row(FESTIVAL)).getByRole('img', { name: FESTIVAL })).toHaveAttribute(
      'src',
      expect.stringMatching(/^https:\/\/www\.srfestival\.com\/.+\.png$/)
    );
  });
});
