import { NextRequest, NextResponse } from 'next/server';

const KATA_MAP: Record<string, string> = {
  'アヤナ': 'ayana', 'リゾート': 'resort', 'ヴィラ': 'villa',
  'パレス': 'palace', 'グランド': 'grand', 'ロイヤル': 'royal',
  'インターコンチネンタル': 'intercontinental', 'マリオット': 'marriott',
  'ヒルトン': 'hilton', 'シェラトン': 'sheraton', 'ハイアット': 'hyatt',
  'リッツ': 'ritz', 'カールトン': 'carlton', 'フォーシーズンズ': 'four seasons',
  'マンダリン': 'mandarin', 'オリエンタル': 'oriental', 'ペニンシュラ': 'peninsula',
  'シャングリラ': 'shangri-la', 'コンラッド': 'conrad', 'ウェスティン': 'westin',
  'セント': 'st', 'レジス': 'regis', 'アマン': 'aman', 'ブルガリ': 'bulgari',
  'ホテル': 'hotel', 'イン': 'inn', 'スイート': 'suite',
};

const LOCATION_MAP: Record<string, string> = {
  'ワイキキ': 'waikiki', 'ホノルル': 'honolulu', 'ハワイ': 'hawaii',
  '東京': 'tokyo', '京都': 'kyoto', '大阪': 'osaka', '沖縄': 'okinawa',
  'バリ': 'bali', 'プーケット': 'phuket', 'バンコク': 'bangkok',
  'シンガポール': 'singapore', 'パリ': 'paris', 'ロンドン': 'london',
  'ニューヨーク': 'new york', 'ソウル': 'seoul', '台北': 'taipei',
  '香港': 'hong kong', 'ドバイ': 'dubai', '北海道': 'hokkaido',
  '福岡': 'fukuoka', '名古屋': 'nagoya', 'セブ': 'cebu',
  'ダナン': 'da nang', 'マルディブ': 'maldives', 'カンクン': 'cancun',
};

function toEnglish(query: string): string {
  let result = query;
  for (const [kata, en] of Object.entries(KATA_MAP)) {
    result = result.replace(new RegExp(kata, 'g'), en);
  }
  for (const [jp, en] of Object.entries(LOCATION_MAP)) {
    result = result.replace(new RegExp(jp, 'g'), en);
  }
  return result.replace(/\s+/g, ' ').trim();
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q') || '';
  if (query.trim().length < 2) {
    return NextResponse.json([]);
  }

  const englishQuery = toEnglish(query);
  const queries = query !== englishQuery ? [query, englishQuery] : [query];

  const errors: string[] = [];

  for (const q of queries) {
    try {
      // Try tripadvisor.com first, then .jp
      const domains = ['com', 'jp'];
      for (const domain of domains) {
        try {
          const url = `https://www.tripadvisor.${domain}/TypeAheadJson?action=API&types=hotel&query=${encodeURIComponent(q)}`;
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          const res = await fetch(url, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
              'Accept': 'application/json, text/javascript, */*',
              'Accept-Language': 'en-US,en;q=0.9,ja;q=0.8',
              'Referer': `https://www.tripadvisor.${domain}/`,
            },
          });
          clearTimeout(timeout);

          if (!res.ok) {
            errors.push(`${domain}: HTTP ${res.status}`);
            continue;
          }

          const text = await res.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch {
            errors.push(`${domain}: invalid JSON (${text.substring(0, 100)})`);
            continue;
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const results = (data.results || []).slice(0, 6).map((r: any) => {
            // url can be at root level or inside urls array
            const rawUrl = r.url || r.urls?.[0]?.url || '';
            const m = rawUrl.match(/Hotel_Review-(g\d+-d\d+)/);
            return {
              name: r.name,
              hotel_key: m ? m[1] : null,
            };
          }).filter((r: { name: string; hotel_key: string | null }) => r.hotel_key);

          if (results.length > 0) {
            return NextResponse.json(results);
          }
        } catch (e) {
          errors.push(`${domain}: ${e instanceof Error ? e.message : 'unknown'}`);
          continue;
        }
      }
    } catch (e) {
      errors.push(`outer: ${e instanceof Error ? e.message : 'unknown'}`);
      continue;
    }
  }

  // Return debug info when no results
  return NextResponse.json({ debug: errors, query, englishQuery: toEnglish(query) });
}
