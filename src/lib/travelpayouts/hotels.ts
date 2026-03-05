export function buildHotelSearchUrl(
  destination: string,
  checkIn: string,
  checkOut: string,
  adults: number,
  marker: string
): Record<string, string> {
  const encodedDest = encodeURIComponent(destination);

  return {
    hotellook: `https://search.hotellook.com/hotels?destination=${encodedDest}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&marker=${marker}&language=ja`,
    booking: `https://www.booking.com/searchresults.ja.html?ss=${encodedDest}&checkin=${checkIn}&checkout=${checkOut}&group_adults=${adults}&lang=ja`,
    agoda: `https://www.agoda.com/ja-jp/search?city=${encodedDest}&checkIn=${checkIn}&checkOut=${checkOut}&rooms=1&adults=${adults}`,
    expedia: `https://www.expedia.co.jp/Hotel-Search?destination=${encodedDest}&startDate=${checkIn}&endDate=${checkOut}&adults=${adults}`,
  };
}
