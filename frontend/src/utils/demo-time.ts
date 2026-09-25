export const DEMO_TIME_ZONE = 'Asia/Ho_Chi_Minh';

/** Returns an instant that displays at the requested hour on the next
 * Asia/Ho_Chi_Minh calendar day, independent of the browser timezone. */
export function nextDemoDayAt(hour: number, minute = 0, now = new Date()): Date {
  const localClock = new Date(now.getTime() + 7 * 3_600_000);
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
