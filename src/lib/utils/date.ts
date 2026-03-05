import { format, differenceInDays, parseISO } from 'date-fns';

export function formatDate(date: string): string {
  return format(parseISO(date), 'MMM d, yyyy');
}

export function formatTime(date: string): string {
  return format(parseISO(date), 'h:mm a');
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getNights(checkIn: string, checkOut: string): number {
  return differenceInDays(parseISO(checkOut), parseISO(checkIn));
}
