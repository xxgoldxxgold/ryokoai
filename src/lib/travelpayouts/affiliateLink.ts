export function buildViatorLink(destination: string, marker: string): string {
  return `https://tp.media/r?marker=${marker}&p=5765&u=${encodeURIComponent(
    `https://www.viator.com/ja-JP/searchResults/all?text=${destination}`
  )}`;
}

export function buildGetYourGuideLink(destination: string, marker: string): string {
  return `https://tp.media/r?marker=${marker}&p=4736&u=${encodeURIComponent(
    `https://www.getyourguide.com/ja/?q=${destination}`
  )}`;
}

export function buildDiscoverCarsLink(
  location: string,
  pickup: string,
  dropoff: string,
  marker: string
): string {
  return `https://tp.media/r?marker=${marker}&p=7658&u=${encodeURIComponent(
    `https://www.discovercars.com/ja/search?location=${location}&pickup_date=${pickup}&dropoff_date=${dropoff}`
  )}`;
}
