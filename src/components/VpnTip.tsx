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
  { keywords: ['marriott', 'hilton', 'hyatt', 'intercontinental', 'sheraton', 'westin', 'ritz', 'st. regis', 'conrad', 'waldorf', 'four seasons', 'mandarin oriental', 'peninsula', 'shangri-la', 'banyan tree', 'aman', 'bulgari', 'マリオット', 'ヒルトン', 'ハイアット', 'インターコンチネンタル', 'シェラトン', 'ウェスティン', 'リッツ', 'コンラッド', 'フォーシーズンズ', 'マンダリン', 'ペニンシュラ', 'シャングリラ', 'アマン', 'ブルガリ'], index: 2 },
  { keywords: ['bali', 'thailand', 'bangkok', 'phuket', 'vietnam', 'hanoi', 'ho chi minh', 'singapore', 'kuala lumpur', 'langkawi', 'cebu', 'manila', 'jakarta', 'da nang', 'cambodia', 'siem reap', 'バリ', 'タイ', 'バンコク', 'プーケット', 'ベトナム', 'ハノイ', 'ホーチミン', 'シンガポール', 'クアラルンプール', 'セブ', 'マニラ', 'ジャカルタ', 'ダナン'], index: 6 },
  { keywords: ['dubai', 'abu dhabi', 'doha', 'qatar', 'oman', 'bahrain', 'riyadh', 'jeddah', 'ドバイ', 'アブダビ', 'ドーハ', 'カタール'], index: 7 },
  { keywords: ['sydney', 'melbourne', 'auckland', 'australia', 'new zealand', 'fiji', 'シドニー', 'メルボルン', 'オーストラリア', 'ニュージーランド'], index: 8 },
  { keywords: ['cancun', 'mexico', 'brazil', 'argentina', 'colombia', 'peru', 'chile', 'costa rica', 'rio', 'sao paulo', 'buenos aires', 'カンクン', 'メキシコ', 'ブラジル', 'アルゼンチン'], index: 9 },
  { keywords: ['new york', 'los angeles', 'las vegas', 'hawaii', 'waikiki', 'honolulu', 'miami', 'san francisco', 'chicago', 'boston', 'seattle', 'orlando', 'washington', 'toronto', 'vancouver', 'canada', 'guam', 'ニューヨーク', 'ロサンゼルス', 'ラスベガス', 'ハワイ', 'ワイキキ', 'ホノルル', 'マイアミ', 'サンフランシスコ', 'グアム', 'カナダ'], index: 3 },
  { keywords: ['paris', 'london', 'amsterdam', 'berlin', 'munich', 'vienna', 'zurich', 'stockholm', 'copenhagen', 'oslo', 'helsinki', 'brussels', 'dublin', 'パリ', 'ロンドン', 'アムステルダム', 'ベルリン', 'ウィーン', 'チューリッヒ'], index: 4 },
  { keywords: ['rome', 'barcelona', 'madrid', 'lisbon', 'prague', 'budapest', 'warsaw', 'krakow', 'athens', 'istanbul', 'croatia', 'dubrovnik', 'ローマ', 'バルセロナ', 'マドリード', 'プラハ', 'ブダペスト', 'イスタンブール'], index: 5 },
  { keywords: ['tokyo', 'osaka', 'kyoto', 'fukuoka', 'sapporo', 'okinawa', 'naha', 'nagoya', 'hakone', 'karuizawa', 'nikko', 'hiroshima', 'kobe', 'yokohama', 'japan', '東京', '大阪', '京都', '福岡', '札幌', '沖縄', '那覇', '名古屋', '箱根', '軽井沢', '日光', '広島', '神戸', '横浜', '北海道', '新宿', '渋谷', '池袋', '品川', '浅草', '銀座', '上野', '六本木', '赤坂', '梅田', '難波', '心斎橋', 'すすきの', '博多'], index: 0 },
];

// Japan luxury detection
const JAPAN_LUXURY_KEYWORDS = ['ritz', 'four seasons', 'aman', 'mandarin', 'peninsula', 'park hyatt', 'palace', 'imperial', 'okura', 'prince', 'conrad', 'st. regis', 'edition', 'luxury', 'resort', 'リッツ', 'フォーシーズンズ', 'アマン', 'マンダリン', 'ペニンシュラ', 'パークハイアット', 'パレス', 'インペリアル', 'オークラ', 'プリンス', 'コンラッド', 'エディション'];

const OTA_LINKS: Record<string, { base: string; vpn: string }> = {
  'Agoda': { base: 'https://www.agoda.com/search?q=', vpn: 'ベトナム、タイ' },
  'Booking.com': { base: 'https://www.booking.com/searchresults.html?ss=', vpn: 'ポーランド、ルーマニア' },
  'Trip.com': { base: 'https://www.trip.com/hotels/list?keyword=', vpn: 'インド、韓国' },
  'Expedia': { base: 'https://www.expedia.com/Hotel-Search?destination=', vpn: 'メキシコ、ブラジル' },
};

function detectRegion(hotelName: string): GeoTip | null {
  const lower = hotelName.toLowerCase();

  // Check Japan first
  const isJapan = REGION_KEYWORDS.find(r => r.index === 0)?.keywords.some(k => lower.includes(k));
  if (isJapan) {
    const isLuxury = JAPAN_LUXURY_KEYWORDS.some(k => lower.includes(k));
    return GEO_DATA[isLuxury ? 1 : 0];
  }

  // Check regional match (takes priority over luxury chain detection)
  for (const region of REGION_KEYWORDS) {
    if (region.index <= 2) continue; // skip luxury and japan
    if (region.keywords.some(k => lower.includes(k))) {
      return GEO_DATA[region.index];
    }
  }

  // No region detected — check global luxury chains as fallback
  const luxuryMatch = REGION_KEYWORDS.find(r => r.index === 2)?.keywords.some(k => lower.includes(k));
  if (luxuryMatch) return GEO_DATA[2];

  return null;
}

interface Props {
  hotelName: string;
}

const DEFAULT_TIP: GeoTip = { category: 'General', vpn1: 'ベトナム', vpn2: 'インド', discount: '10-30%', platform: 'Agoda' };

export default function VpnTip({ hotelName }: Props) {
  const tip = detectRegion(hotelName) || DEFAULT_TIP;

  const ota = OTA_LINKS[tip.platform];
  const encodedName = encodeURIComponent(hotelName);

  return (
    <a
      href={`${ota.base}${encodedName}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden hover:bg-amber-100/50 transition-colors"
    >
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-amber-800 font-bold text-sm">
              VPNでさらに安くなる可能性あり
            </p>
            <p className="text-amber-600 text-xs mt-1">
              {tip.vpn1}や{tip.vpn2}のVPNで{tip.platform}を見ると最大<span className="font-bold">{tip.discount}OFF</span>
            </p>
          </div>
          <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <p className="text-amber-500 text-[10px] mt-2">
          VPN: {ota.vpn} → {tip.platform}で検索
        </p>
      </div>
    </a>
  );
}
