import { formatPrice, formatTimeSince } from '@/lib/utils';

// ── formatPrice ─────────────────────────────────────────

describe('formatPrice', () => {
  it('formats centimes to DA with two decimals', () => {
    expect(formatPrice(2050)).toBe('20.5 DA');
    expect(formatPrice(100)).toBe('1 DA');
    expect(formatPrice(0)).toBe('0 DA');
    expect(formatPrice(999)).toBe('9.99 DA');
  });
});

// ── formatTimeSince ─────────────────────────────────────

describe('formatTimeSince', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-27T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns "just now" for times less than 1 minute ago', () => {
    expect(formatTimeSince('2026-02-27T12:00:00Z')).toBe('just now');
    expect(formatTimeSince('2026-02-27T11:59:30Z')).toBe('just now');
  });

  it('returns minutes for times 1-59 minutes ago', () => {
    expect(formatTimeSince('2026-02-27T11:59:00Z')).toBe('1 min ago');
    expect(formatTimeSince('2026-02-27T11:55:00Z')).toBe('5 min ago');
    expect(formatTimeSince('2026-02-27T11:30:00Z')).toBe('30 min ago');
    expect(formatTimeSince('2026-02-27T11:01:00Z')).toBe('59 min ago');
  });

  it('returns hours for times 1-23 hours ago', () => {
    expect(formatTimeSince('2026-02-27T11:00:00Z')).toBe('1 hr ago');
    expect(formatTimeSince('2026-02-27T09:00:00Z')).toBe('3 hrs ago');
    expect(formatTimeSince('2026-02-26T13:00:00Z')).toBe('23 hrs ago');
  });

  it('returns days for times 24+ hours ago', () => {
    expect(formatTimeSince('2026-02-26T12:00:00Z')).toBe('1 day ago');
    expect(formatTimeSince('2026-02-24T12:00:00Z')).toBe('3 days ago');
    expect(formatTimeSince('2026-02-20T12:00:00Z')).toBe('7 days ago');
  });
});
