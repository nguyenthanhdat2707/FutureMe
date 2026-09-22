export function calculateUnionHours(intervals: { start: number; end: number }[], windowStart: number, windowEnd: number): number {
  if (intervals.length === 0) return 0;

  // Clip and filter
  const clipped = intervals
    .map(i => ({
      start: Math.max(i.start, windowStart),
      end: Math.min(i.end, windowEnd)
    }))
    .filter(i => i.start < i.end);

  if (clipped.length === 0) return 0;

  // Sort by start time
  clipped.sort((a, b) => a.start - b.start);

  // Union
  let unionedTime = 0;
  let currentStart = clipped[0].start;
  let currentEnd = clipped[0].end;

  for (let i = 1; i < clipped.length; i++) {
    const next = clipped[i];
    if (next.start <= currentEnd) {
      currentEnd = Math.max(currentEnd, next.end);
    } else {
      unionedTime += currentEnd - currentStart;
      currentStart = next.start;
      currentEnd = next.end;
    }
  }
  unionedTime += currentEnd - currentStart;

  return unionedTime / (1000 * 60 * 60);
}
