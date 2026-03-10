'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, useMemo } from 'react';
import { daysBetween } from '@/lib/utils';
import UnifiedPriceRanking from '@/components/UnifiedPriceRanking';
import DataForSeoPricePanel from '@/components/DataForSeoPricePanel';
import SearchForm from '@/components/SearchForm';
import { useAuth } from '@/lib/useAuth';
import Link from 'next/link';

const CITY_CODES: Record<string, string> = {
  seoul: 'SEL', tokyo: 'TYO', osaka: 'OSA', kyoto: 'UKY', bangkok: 'BKK',
  singapore: 'SIN', hongkong: 'HKG', taipei: 'TPE', hanoi: 'HAN',
  saigon: 'SGN', bali: 'DPS', jakarta: 'JKT', manila: 'MNL',
  paris: 'PAR', london: 'LON', york: 'NYC', angeles: 'LAX',
  hawaii: 'HNL', waikiki: 'HNL', honolulu: 'HNL', guam: 'GUM',
  sydney: 'SYD', dubai: 'DXB', rome: 'ROM', barcelona: 'BCN',
  amsterdam: 'AMS', berlin: 'BER', munich: 'MUC', vienna: 'VIE',
  prague: 'PRG', istanbul: 'IST', lumpur: 'KUL', beijing: 'BJS',
  shanghai: 'SHA', busan: 'PUS', fukuoka: 'FUK', sapporo: 'SPK',
  okinawa: 'OKA', naha: 'OKA', nagoya: 'NGO',
};

function detectCityCode(hotelName: string): string | undefined {
  const lower = hotelName.toLowerCase();
  if (lower.includes('hong kong')) return 'HKG';
  if (lower.includes('ho chi minh')) return 'SGN';
  if (lower.includes('new york')) return 'NYC';
  if (lower.includes('los angeles')) return 'LAX';
  if (lower.includes('kuala lumpur')) return 'KUL';
  for (const [city, code] of Object.entries(CITY_CODES)) {
    if (lower.includes(city)) return code;
  }
  return undefined;
}

const JP_TO_EN: Record<string, string> = {
  'リブマックス': 'livemax', 'ヒルトン': 'hilton', 'マリオット': 'marriott',
  'シェラトン': 'sheraton', 'ハイアット': 'hyatt', 'コンラッド': 'conrad',
  'ウェスティン': 'westin', 'アパ': 'apa', '東横': 'toyoko', 'トヨコ': 'toyoko',
  'ドーミー': 'dormy', 'スーパー': 'super', 'コンフォート': 'comfort',
  'ホテル': 'hotel', 'リゾート': 'resort', 'プレミアム': 'premium',
  'バジェット': 'budget', '札幌': 'sapporo', 'すすきの': 'susukino',
  '駅前': 'ekimae', '東京': 'tokyo', '大阪': 'osaka', '京都': 'kyoto',
  '沖縄': 'okinawa', '福岡': 'fukuoka', '名古屋': 'nagoya', '北海道': 'hokkaido',
  '新宿': 'shinjuku', '渋谷': 'shibuya', '池袋': 'ikebukuro', '品川': 'shinagawa',
  '浅草': 'asakusa', '銀座': 'ginza', '上野': 'ueno', '六本木': 'roppongi',
  '赤坂': 'akasaka', '横浜': 'yokohama', '博多': 'hakata', '梅田': 'umeda',
  '難波': 'namba', '心斎橋': 'shinsaibashi', '那覇': 'naha',
};

function japaneseToEnglish(s: string): string {
  let result = s;
  for (const [jp, en] of Object.entries(JP_TO_EN)) {
    result = result.replace(new RegExp(jp, 'g'), en);
  }
  return result.toLowerCase().replace(/[,\s]+/g, ' ').trim();
}

const EN_TO_JP: Record<string, string> = Object.fromEntries(
  Object.entries(JP_TO_EN).map(([jp, en]) => [en, jp])
);
Object.assign(EN_TO_JP, {
  'odoriKoen': '大通公園', 'odori': '大通', 'chuo': '中央', 'minami': '南',
  'kita': '北', 'nishi': '西', 'higashi': '東', 'kabukicho': '歌舞伎町',
  'meijidori': '明治通り', 'kayabacho': '茅場町',
  'east': '東口', 'west': '西口', 'shin': '新', 'grand': 'グランド',
  'grande': 'グランデ', 'yodoyabashi': '淀屋橋', 'esaka': '江坂',
  'kawaji': '川治', 'inn': 'イン', 'station': '駅', 'meiki': '名駅',
});

function englishToJapanese(name: string): string {
  const words = name.replace(/([A-Z])/g, ' $1').split(/[\s,]+/).filter(Boolean);
  return words.map(w => EN_TO_JP[w.toLowerCase()] || w).join('');
}

interface Candidate { hotel_key: string; name: string; }

function findBestMatch(query: string, candidates: Candidate[]): Candidate | null {
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  // Normalize both sides the same way (strip address, lowercase)
  const queryClean = query.split(',')[0].trim().toLowerCase();

  let bestMatch: Candidate | null = null;
  let bestScore = -1;

  for (const c of candidates) {
    const cClean = c.name.split(',')[0].trim().toLowerCase();

    // Exact match on hotel name part
    if (queryClean === cClean) return c;

    // Check containment in both directions
    const qInC = cClean.includes(queryClean) ? 1 : 0;
    const cInQ = queryClean.includes(cClean) ? 1 : 0;
    const score = qInC + cInQ;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = c;
    }
  }

  if (bestMatch && bestScore >= 1) return bestMatch;
  return null;
}

function extractDirectKey(input: string): string | null {
  const taMatch = input.match(/Hotel_Review-(g\d+-d\d+)/);
  if (taMatch) return taMatch[1];
  const keyMatch = input.match(/(g\d+-d\d+)/);
  if (keyMatch) return keyMatch[1];
  return null;
}

function SpeedPromoBanner() {
  return (
    <Link
      href="/login"
      className="block bg-gradient-to-r from-blue-100 to-blue-100 border border-blue-300 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-blue-900 font-bold text-sm">ログインで高速検索</p>
          <p className="text-blue-700 text-xs mt-0.5">
            無料ログインで爆速検索、より多くの予約サイト価格を比較できます
          </p>
        </div>
        <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

function SearchResults() {
  const searchParams = useSearchParams();
  const hotel = searchParams.get('hotel');
  const hotelDisplayName = searchParams.get('name') || null;
  const checkin = searchParams.get('checkin');
  const checkout = searchParams.get('checkout');
  const adults = Number(searchParams.get('adults')) || 2;
  const rooms = Number(searchParams.get('rooms')) || 1;
  const { isLoggedIn, loading: authLoading } = useAuth();

  const directKey = useMemo(() => hotel ? extractDirectKey(hotel) : null, [hotel]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(directKey);
  const [selectedName, setSelectedName] = useState<string | null>(hotelDisplayName);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  // Clear stale price caches when search params change
  useEffect(() => {
    try {
      const keys = Object.keys(sessionStorage);
      for (const k of keys) {
        if (k.startsWith('ryoko_prices_')) sessionStorage.removeItem(k);
      }
    } catch { /* ignore */ }
  }, [hotel, checkin, checkout, adults, rooms]);

  useEffect(() => {
    if (directKey || !hotel) return;
    const controller = new AbortController();
    setSearching(true);
    setCandidates([]);
    setSelectedKey(null);
    setSelectedName(null);
    setSearchError(null);

    // Strip address parts after first comma for better matching
    const hotelNameOnly = hotel.split(',')[0].trim();

    // Use VPS API (returns Japanese names from tripadvisor.jp)
    fetch(`https://vpn.ryokoai.com/suggest.php?q=${encodeURIComponent(hotelNameOnly)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((results: Candidate[]) => {
        if (results.length > 0) {
          setCandidates(results);
          // Find best match by scoring against input (use name without address)
          const best = findBestMatch(hotelNameOnly, results);
          if (best) {
            setSelectedKey(best.hotel_key);
            setSelectedName(best.name);
          }
        } else {
          // Fallback to original API (English names → convert to Japanese)
          return fetch(`/api/hotel-search?query=${encodeURIComponent(hotelNameOnly)}`, { signal: controller.signal })
            .then((res) => res.json())
            .then((data) => {
              const cands: Candidate[] = (data.candidates || []).map((c: Candidate) => ({
                ...c,
                name: englishToJapanese(c.name),
              }));
              setCandidates(cands);
              const best = findBestMatch(hotelNameOnly, cands);
              if (best) {
                setSelectedKey(best.hotel_key);
                setSelectedName(best.name);
              } else if (cands.length === 0 && data.hotel_key) {
                setSelectedKey(data.hotel_key);
                setSelectedName(data.hotel_name ? englishToJapanese(data.hotel_name) : null);
              }
            });
        }
      })
      .catch((e) => {
        if (e.name === 'AbortError') return;
        setSearchError('ホテル情報の取得に失敗しました。もう一度お試しください。');
      })
      .finally(() => setSearching(false));

    return () => controller.abort();
  }, [hotel, directKey]);

  if (!hotel || !checkin || !checkout) {
    return (
      <div className="px-4 py-16 text-center space-y-6">
        <p className="text-gray-400 text-sm">検索条件を入力してください。</p>
        <SearchForm />
      </div>
    );
  }

  const nights = daysBetween(checkin, checkout);
  const displayName = selectedName || hotel;

  return (
    <div className="px-4 py-8 max-w-2xl mx-auto space-y-6">
      {/* Search summary */}
      <button
        onClick={() => setShowEditForm(!showEditForm)}
        className="w-full text-left bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-gray-900 font-bold text-lg">{displayName}</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {checkin} ~ {checkout}（{nights}泊）/ {adults}名 / {rooms}室
            </p>
          </div>
          <svg className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${showEditForm ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {showEditForm && (
        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
          <SearchForm initialHotel={displayName} initialCheckin={checkin} initialCheckout={checkout} initialAdults={adults} initialRooms={rooms} />
        </div>
      )}

      {/* Hotel search status */}
      {searching && (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <div className="w-3 h-3 border-2 border-blue-300 border-t-blue-700 rounded-full animate-spin" />
          ホテルを検索中...
        </div>
      )}

      {/* Candidate selection — only show when no auto-match found */}
      {!searching && candidates.length > 1 && !selectedKey && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-gray-900 font-bold text-sm">
            {selectedKey ? '検索対象ホテル（変更可）' : '該当するホテルを選択してください'}（{candidates.length}件）
          </h3>
          <div className="space-y-2">
            {candidates.map((c) => (
              <button
                key={c.hotel_key}
                onClick={() => { setSelectedKey(c.hotel_key); setSelectedName(c.name); }}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                  c.hotel_key === selectedKey
                    ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200'
                    : 'bg-gray-50 border-gray-200 hover:bg-blue-100 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {c.hotel_key === selectedKey && (
                    <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  <span className={`text-sm ${c.hotel_key === selectedKey ? 'text-blue-900 font-medium' : 'text-gray-900'}`}>
                    {c.name.split(',')[0].trim()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search error */}
      {searchError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 shadow-sm">
          <p className="text-red-600 text-sm">{searchError}</p>
        </div>
      )}

      {/* No results */}
      {!searching && !searchError && !directKey && !selectedKey && candidates.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
          <p className="text-gray-400 text-sm">
            ホテルが見つかりませんでした。TripAdvisorのURLを直接入力してみてください。
          </p>
        </div>
      )}

      {/* Price ranking — branch by auth state */}
      {!authLoading && selectedKey && checkin && checkout && (
        isLoggedIn ? (
          <>
            <UnifiedPriceRanking
              hotelName={selectedName || hotel}
              hotelKey={selectedKey}
              checkin={checkin}
              checkout={checkout}
              adults={adults}
              rooms={rooms}
            />
            <DataForSeoPricePanel
              hotelName={selectedName || hotel}
              checkin={checkin}
              checkout={checkout}
              adults={adults}
            />
          </>
        ) : (
          <>
            <SpeedPromoBanner />

            <Link
              href="/login"
              className="block bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 hover:bg-amber-100/50 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-amber-800 font-bold text-sm">ログインして更に激安価格をゲット！！</p>
                  <p className="text-amber-600 text-xs mt-0.5">マジで安くなる。これを知らない人が意外に多い。</p>
                </div>
                <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            <DataForSeoPricePanel
              hotelName={selectedName || hotel}
              checkin={checkin}
              checkout={checkout}
              adults={adults}
            />
          </>
        )
      )}

      {/* Disclaimer — right after prices */}
      <div className="bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 text-center">
        <p className="text-gray-700 text-xs font-medium">
          表示価格は各予約サイトの掲載価格です。予約前に必ずリンク先で最終価格をご確認ください。
        </p>
      </div>

    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-center text-gray-400 text-sm">読み込み中...</div>}>
      <SearchResults />
    </Suspense>
  );
}
