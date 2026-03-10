import { NextResponse } from 'next/server';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Validate checkin/checkout dates. Returns error response or null if valid. */
export function validateDates(checkin: string, checkout: string): NextResponse | null {
  if (!DATE_RE.test(checkin) || !DATE_RE.test(checkout)) {
    return NextResponse.json({ error: 'Invalid date format (YYYY-MM-DD)' }, { status: 400 });
  }
  const ci = new Date(checkin);
  const co = new Date(checkout);
  if (isNaN(ci.getTime()) || isNaN(co.getTime())) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
  }
  if (co <= ci) {
    return NextResponse.json({ error: 'checkout must be after checkin' }, { status: 400 });
  }
  return null;
}

/** Validate adults count. Returns clamped integer (1-10). */
export function validateAdults(adults: string | null): number {
  const n = parseInt(adults || '2', 10);
  if (isNaN(n) || n < 1) return 1;
  if (n > 10) return 10;
  return n;
}
