import { COUNTRIES } from './countries';
import { GeneratedLink } from './types';
import { toSlug, daysBetween, extractSlugFromUrl } from './utils';

const AGODA_LOCALE: Record<string, string> = {
  'TH': 'th-th', 'IN': 'en-in', 'VN': 'vi-vn',
  'ID': 'id-id', 'MY': 'ms-my', 'PH': 'en-ph',
  'JP': 'ja-jp', 'KR': 'ko-kr', 'CN': 'zh-cn',
  'TW': 'zh-tw', 'HK': 'zh-hk', 'US': 'en-us',
  'GB': 'en-gb', 'DE': 'de-de', 'BR': 'pt-br',
  'AR': 'es-ar', 'TR': 'tr-tr', 'EG': 'ar-eg',
};

const AGODA_CURRENCY: Record<string, string> = {
  'TH': 'THB', 'IN': 'INR', 'VN': 'VND',
  'ID': 'IDR', 'MY': 'MYR', 'PH': 'PHP',
  'JP': 'JPY', 'KR': 'KRW', 'CN': 'CNY',
  'TW': 'TWD', 'HK': 'HKD', 'US': 'USD',
  'GB': 'GBP', 'DE': 'EUR', 'BR': 'BRL',
  'AR': 'ARS', 'TR': 'TRY', 'EG': 'EGP',
};

const BOOKING_LANG: Record<string, string> = {
  'TH': 'th', 'IN': 'en-gb', 'VN': 'vi',
  'ID': 'id', 'MY': 'ms', 'PH': 'en-gb',
  'JP': 'ja', 'KR': 'ko', 'CN': 'zh-cn',
  'TW': 'zh-tw', 'HK': 'zh-cn', 'US': 'en-us',
  'GB': 'en-gb', 'DE': 'de', 'BR': 'pt-br',
  'AR': 'es-ar', 'TR': 'tr', 'EG': 'ar',
};

const BOOKING_CURRENCY: Record<string, string> = {
  'TH': 'THB', 'IN': 'INR', 'VN': 'VND',
  'ID': 'IDR', 'MY': 'MYR', 'PH': 'PHP',
  'JP': 'JPY', 'KR': 'KRW', 'CN': 'CNY',
  'TW': 'TWD', 'HK': 'HKD', 'US': 'USD',
  'GB': 'GBP', 'DE': 'EUR', 'BR': 'BRL',
  'AR': 'ARS', 'TR': 'TRY', 'EG': 'EGP',
};

export function generateAgodaLinks(params: {
  hotel: string;
  checkin: string;
  checkout: string;
  adults: number;
  rooms: number;
}): GeneratedLink[] {
  const affiliateId = process.env.NEXT_PUBLIC_AGODA_AFFILIATE_ID || '0';
  const extracted = extractSlugFromUrl(params.hotel);
  const slug = extracted?.slug || toSlug(params.hotel);
  const city = extracted?.city || '';
  const los = daysBetween(params.checkin, params.checkout);

  return COUNTRIES.map((country) => {
    const locale = AGODA_LOCALE[country.code] || 'en-us';
    const currency = AGODA_CURRENCY[country.code] || 'USD';

    const basePath = city
      ? `https://www.agoda.com/${locale}/${slug}/hotel/${city}.html`
      : `https://www.agoda.com/${locale}/${slug}.html`;

    const query = new URLSearchParams({
      cid: affiliateId,
      checkin: params.checkin,
      checkout: params.checkout,
      los: los.toString(),
      adults: params.adults.toString(),
      rooms: params.rooms.toString(),
      currency,
    });

    return { country, url: `${basePath}?${query.toString()}` };
  });
}

export function generateBookingLinks(params: {
  hotel: string;
  checkin: string;
  checkout: string;
  adults: number;
  rooms: number;
}): GeneratedLink[] {
  const affiliateId = process.env.NEXT_PUBLIC_BOOKING_AFFILIATE_ID || '0';
  const extracted = extractSlugFromUrl(params.hotel);
  const slug = extracted?.slug || toSlug(params.hotel);

  return COUNTRIES.map((country) => {
    const lang = BOOKING_LANG[country.code] || 'en-us';
    const currency = BOOKING_CURRENCY[country.code] || 'USD';

    const baseUrl = `https://www.booking.com/searchresults.${lang}.html`;
    const query = new URLSearchParams({
      aid: affiliateId,
      ss: params.hotel,
      checkin: params.checkin,
      checkout: params.checkout,
      group_adults: params.adults.toString(),
      no_rooms: params.rooms.toString(),
      selected_currency: currency,
    });

    return { country, url: `${baseUrl}?${query.toString()}` };
  });
}
