// Affiliate ID management
// IDs are loaded from environment variables and can be updated without code changes

export function getAgodaAffiliateId(): string {
  return process.env.NEXT_PUBLIC_AGODA_AFFILIATE_ID || '0';
}

export function getBookingAffiliateId(): string {
  return process.env.NEXT_PUBLIC_BOOKING_AFFILIATE_ID || '0';
}
