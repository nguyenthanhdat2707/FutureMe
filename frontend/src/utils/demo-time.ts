export const DEMO_TIME_ZONE = 'Asia/Ho_Chi_Minh';
const DEMO_OFFSET_MS = 7 * 3_600_000;

/** Converts a datetime-local wall clock in the fixed demo timezone to UTC. */
export function demoLocalDateTimeToIso(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) throw new RangeError('Invalid demo date and time');

  const [, yearText, monthText, dayText, hourText, minuteText, secondText = '0'] = match;
  const [year, month, day, hour, minute, second] = [
    yearText,
    monthText,
    dayText,
    hourText,
    minuteText,
    secondText,
  ].map(Number);
  const wallClock = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const isValid = wallClock.getUTCFullYear() === year
    && wallClock.getUTCMonth() === month - 1
    && wallClock.getUTCDate() === day
    && wallClock.getUTCHours() === hour
    && wallClock.getUTCMinutes() === minute
    && wallClock.getUTCSeconds() === second;
  if (!isValid) throw new RangeError('Invalid demo date and time');

  return new Date(wallClock.getTime() - DEMO_OFFSET_MS).toISOString();
}

/** Returns an instant that displays at the requested hour on the next
 * Asia/Ho_Chi_Minh calendar day, independent of the browser timezone. */
export function nextDemoDayAt(hour: number, minute = 0, now = new Date()): Date {
  const localClock = new Date(now.getTime() + DEMO_OFFSET_MS);
  return new Date(Date.UTC(
    localClock.getUTCFullYear(),
    localClock.getUTCMonth(),
    localClock.getUTCDate() + 1,
    hour - 7,
    minute,
    0,
    0,
  ));
}

export function formatDemoTime(value: string | Date, options: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: DEMO_TIME_ZONE,
    ...options,
  }).format(new Date(value));
}
