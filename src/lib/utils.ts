export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

export function extractSlugFromUrl(input: string): { slug: string; city: string } | null {
  // Agoda URL: agoda.com/.../hotel-name/hotel/city.html
  const agodaMatch = input.match(/agoda\.com\/[^/]+\/([^/]+)\/hotel\/([^/.]+)/);
  if (agodaMatch) return { slug: agodaMatch[1], city: agodaMatch[2] };

  // Booking.com URL: booking.com/hotel/xx/hotel-name.html
  const bookingMatch = input.match(/booking\.com\/hotel\/[^/]+\/([^/.]+)/);
  if (bookingMatch) return { slug: bookingMatch[1], city: '' };

  return null;
}
