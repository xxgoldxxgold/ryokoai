'use client';

interface GeoTip {
  category: string;
  vpn1: string;
  vpn2: string;
  discount: string;
  platform: string;
}

const GEO_DATA: GeoTip[] = [
  { category: 'Japan: Business/Economy', vpn1: '日本', vpn2: 'ベトナム', discount: '5-10%', platform: 'Agoda' },
  { category: 'Japan: Luxury/Resort', vpn1: 'ポーランド', vpn2: 'ドイツ', discount: '10-20%', platform: 'Booking.com' },
  { category: 'Global Luxury', vpn1: 'インド', vpn2: 'ブラジル', discount: '25-40%', platform: 'Agoda' },
  { category: 'USA & Canada', vpn1: 'メキシコ', vpn2: 'インド', discount: '15-25%', platform: 'Expedia' },
  { category: 'Western/Northern Europe', vpn1: 'ポーランド', vpn2: 'ルーマニア', discount: '20-30%', platform: 'Booking.com' },
  { category: 'Southern/Eastern Europe', vpn1: 'ウクライナ', vpn2: 'ブラジル', discount: '15-30%', platform: 'Booking.com' },
  { category: 'Southeast Asia', vpn1: 'ベトナム', vpn2: 'インドネシア', discount: '15-25%', platform: 'Agoda' },
  { category: 'Middle East', vpn1: 'インド', vpn2: 'エジプト', discount: '20-35%', platform: 'Booking.com' },
  { category: 'Oceania', vpn1: 'ベトナム', vpn2: 'フィリピン', discount: '15-20%', platform: 'Expedia' },
  { category: 'Latin America', vpn1: 'アルゼンチン', vpn2: 'コロンビア', discount: '20-45%', platform: 'Booking.com' },
];

const REGION_KEYWORDS: { keywords: string[]; index: number }[] = [
  { keywords: ['marriott', 'hilton', 'hyatt', 'intercontinental', 'sheraton', 'westin', 'ritz', 'st. regis', 'conrad', 'waldorf', 'four seasons', 'mandarin oriental', 'peninsula', 'shangri-la', 'banyan tree', 'aman', 'bulgari'], index: 2 },
  { keywords: ['bali', 'thailand', 'bangkok', 'phuket', 'vietnam', 'hanoi', 'ho chi minh', 'singapore', 'kuala lumpur', 'langkawi', 'cebu', 'manila', 'jakarta', 'da nang', 'cambodia', 'siem reap'], index: 6 },
  { keywords: ['dubai', 'abu dhabi', 'doha', 'qatar', 'oman', 'bahrain', 'riyadh', 'jeddah'], index: 7 },
  { keywords: ['sydney', 'melbourne', 'auckland', 'australia', 'new zealand', 'fiji'], index: 8 },
  { keywords: ['cancun', 'mexico', 'brazil', 'argentina', 'colombia', 'peru', 'chile', 'costa rica', 'rio', 'sao paulo', 'buenos aires'], index: 9 },
  { keywords: ['new york', 'los angeles', 'las vegas', 'hawaii', 'waikiki', 'honolulu', 'miami', 'san francisco', 'chicago', 'boston', 'seattle', 'orlando', 'washington', 'toronto', 'vancouver', 'canada', 'guam'], index: 3 },
  { keywords: ['paris', 'london', 'amsterdam', 'berlin', 'munich', 'vienna', 'zurich', 'stockholm', 'copenhagen', 'oslo', 'helsinki', 'brussels', 'dublin'], index: 4 },
  { keywords: ['rome', 'barcelona', 'madrid', 'lisbon', 'prague', 'budapest', 'warsaw', 'krakow', 'athens', 'istanbul', 'croatia', 'dubrovnik'], index: 5 },
  { keywords: ['tokyo', 'osaka', 'kyoto', 'fukuoka', 'sapporo', 'okinawa', 'naha', 'nagoya', 'hakone', 'karuizawa', 'nikko', 'hiroshima', 'kobe', 'yokohama', 'japan'], index: 0 },
];

// Japan luxury detection
const JAPAN_LUXURY_KEYWORDS = ['ritz', 'four seasons', 'aman', 'mandarin', 'peninsula', 'park hyatt', 'palace', 'imperial', 'okura', 'prince', 'conrad', 'st. regis', 'edition', 'luxury', 'resort'];

const OTA_LINKS: Record<string, { base: string; label: string }> = {
  'Agoda': { base: 'https://www.agoda.com/search?q=', label: 'Agoda' },
  'Booking.com': { base: 'https://www.booking.com/searchresults.html?ss=', label: 'Booking.com' },
  'Trip.com': { base: 'https://www.trip.com/hotels/list?keyword=', label: 'Trip.com' },
  'Expedia': { base: 'https://www.expedia.com/Hotel-Search?destination=', label: 'Expedia' },
};

function detectRegion(hotelName: string): GeoTip | null {
  const lower = hotelName.toLowerCase();

  // Check Japan first
  const isJapan = REGION_KEYWORDS.find(r => r.index === 0)?.keywords.some(k => lower.includes(k));
  if (isJapan) {
    const isLuxury = JAPAN_LUXURY_KEYWORDS.some(k => lower.includes(k));
    return GEO_DATA[isLuxury ? 1 : 0];
  }

  // Check global luxury chains
  const luxuryMatch = REGION_KEYWORDS.find(r => r.index === 2)?.keywords.some(k => lower.includes(k));

  // Check other regions
  for (const region of REGION_KEYWORDS) {
    if (region.index <= 2) continue; // skip luxury and japan
    if (region.keywords.some(k => lower.includes(k))) {
      // If it's a luxury chain in this region, might prefer global luxury tip
      if (luxuryMatch && GEO_DATA[2].discount > GEO_DATA[region.index].discount) {
        return GEO_DATA[2];
      }
      return GEO_DATA[region.index];
    }
  }

  // If luxury chain but no region detected
  if (luxuryMatch) return GEO_DATA[2];

  return null;
}

interface Props {
  hotelName: string;
}

export default function VpnTip({ hotelName }: Props) {
  const tip = detectRegion(hotelName);
  if (!tip) return null;

  const otaEntries = [
    { ota: 'Agoda', vpn: 'ベトナム、タイ', target: 'アジア全域・日本のビジホ' },
    { ota: 'Booking.com', vpn: 'ポーランド、ルーマニア', target: '欧州のホテル・日本の高級宿' },
    { ota: 'Trip.com', vpn: 'インド、韓国', target: '全世界の高級チェーン' },
    { ota: 'Expedia', vpn: 'メキシコ、ブラジル', target: '北米・ハワイのホテル' },
  ];

  const encodedName = encodeURIComponent(hotelName);

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-amber-100">
        <p className="text-amber-800 font-bold text-sm">
          このホテルはVPNでさらに安くなる可能性があります
        </p>
        <p className="text-amber-600 text-xs mt-1">
          {tip.vpn1}や{tip.vpn2}のVPNで最大<span className="font-bold">{tip.discount}OFF</span>の実績あり（{tip.category}）
        </p>
      </div>
      <div className="divide-y divide-amber-100">
        {otaEntries.map((entry) => {
          const link = OTA_LINKS[entry.ota];
          return (
            <a
              key={entry.ota}
              href={`${link.base}${encodedName}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-5 py-3 hover:bg-amber-100/50 transition-colors"
            >
              <div>
                <span className="text-gray-900 text-sm font-semibold">{entry.ota}</span>
                <span className="text-amber-600 text-xs ml-2">VPN: {entry.vpn}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs">{entry.target}</span>
                <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>
          );
        })}
      </div>
      <div className="px-5 py-2.5 bg-amber-50 border-t border-amber-100">
        <p className="text-amber-500 text-[10px] text-center">
          VPNで別の国から接続すると、予約サイトの表示価格が変わる場合があります
        </p>
      </div>
    </div>
  );
}
