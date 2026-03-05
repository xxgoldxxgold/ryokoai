// Hotellook engine API is deprecated. Using affiliate link approach instead.

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
    booking: `https://tp.media/r?marker=${marker}&p=501&u=${encodeURIComponent(
      `https://www.booking.com/searchresults.ja.html?ss=${destination}&checkin=${checkIn}&checkout=${checkOut}&group_adults=${adults}&lang=ja`
    )}`,
    agoda: `https://tp.media/r?marker=${marker}&p=3838&u=${encodeURIComponent(
      `https://www.agoda.com/ja-jp/search?city=${destination}&checkIn=${checkIn}&checkOut=${checkOut}&rooms=1&adults=${adults}`
    )}`,
    expedia: `https://tp.media/r?marker=${marker}&p=6498&u=${encodeURIComponent(
      `https://www.expedia.co.jp/Hotel-Search?destination=${destination}&startDate=${checkIn}&endDate=${checkOut}&adults=${adults}`
    )}`,
  };
}
