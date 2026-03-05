import { NextRequest, NextResponse } from 'next/server';

// Xotelo /search requires RapidAPI. Instead, we help users extract hotel_key
// from TripAdvisor URLs and provide a manual lookup flow.

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') || '';

  // Try to extract hotel_key from a TripAdvisor URL
  // Format: tripadvisor.com/Hotel_Review-g60982-d87993-Reviews-...
  const taMatch = query.match(/Hotel_Review-(g\d+-d\d+)/);
  if (taMatch) {
    return NextResponse.json({
      hotel_key: taMatch[1],
      source: 'tripadvisor_url',
    });
  }

  // Try to extract from a plain hotel_key format
  const keyMatch = query.match(/^(g\d+-d\d+)$/);
  if (keyMatch) {
    return NextResponse.json({
      hotel_key: keyMatch[1],
      source: 'direct_key',
    });
  }

  // For plain text hotel names, generate a TripAdvisor search URL
  // so the user can find the hotel and get the key
  const tripAdvisorSearchUrl = `https://www.tripadvisor.com/Search?q=${encodeURIComponent(query)}`;

  return NextResponse.json({
    hotel_key: null,
    source: 'text_search',
    tripadvisor_search_url: tripAdvisorSearchUrl,
    hint: 'TripAdvisorでホテルを検索し、URLからhotel_keyを取得してください。',
  });
}
