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

const JA_DOMAINS = [
  'agoda.com/ja-jp', 'expedia.co.jp', 'jp.trip.com', 'jp.hotels.com',
  'booking.com', 'jalan.net', 'rakuten.co.jp', 'ikyu.com', 'rurubu.travel',
  'yukoyuko.net', 'trivago.jp', 'kayak.co.jp', 'skyscanner.jp',
  'yahoo.co.jp', 'skyticket.jp', 'tripadvisor.jp', 'agoda.com',
];

export function jaLink(url: string | null): string | null {
  if (!url) return url;
  for (const d of JA_DOMAINS) {
    if (url.includes(d)) return url;
  }
  return 'https://translate.google.com/translate?sl=en&tl=ja&u=' + encodeURIComponent(url);
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
