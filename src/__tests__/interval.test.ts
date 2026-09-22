import { calculateUnionHours } from '../utils/interval';

describe('calculateUnionHours', () => {
  it('handles disjoint intervals', () => {
    const intervals = [
      { start: 1000, end: 2000 },
      { start: 3000, end: 4000 }
    ];
    const hours = calculateUnionHours(intervals, 0, 10000);
    expect(hours).toBe(2000 / (1000 * 60 * 60));
  });

  it('merges overlapping intervals', () => {
    const intervals = [
      { start: 1000, end: 3000 },
      { start: 2000, end: 4000 }
    ];
    const hours = calculateUnionHours(intervals, 0, 10000);
    expect(hours).toBe(3000 / (1000 * 60 * 60));
  });

  it('clips to window', () => {
    const intervals = [
      { start: 0, end: 4000 }
    ];
    const hours = calculateUnionHours(intervals, 1000, 3000);
    expect(hours).toBe(2000 / (1000 * 60 * 60));
  });

  it('ignores events outside window', () => {
    const intervals = [
      { start: 0, end: 1000 },
      { start: 4000, end: 5000 }
    ];
    const hours = calculateUnionHours(intervals, 2000, 3000);
    expect(hours).toBe(0);
  });
});
