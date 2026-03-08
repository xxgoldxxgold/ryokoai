'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, useMemo } from 'react';
import { daysBetween } from '@/lib/utils';
import UnifiedPriceRanking from '@/components/UnifiedPriceRanking';
import DataForSeoPricePanel from '@/components/DataForSeoPricePanel';
import SearchForm from '@/components/SearchForm';
import { useAuth } from '@/lib/useAuth';
import Link from 'next/link';
import VpnTip from '@/components/VpnTip';

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
      className="block bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-indigo-700 font-bold text-sm">ログインで高速検索</p>
          <p className="text-indigo-500 text-xs mt-0.5">
            無料ログインで3倍速く、より多くの予約サイト価格を比較できます
          </p>
        </div>
        <svg className="w-5 h-5 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

function SearchResults() {
  const searchParams = useSearchParams();
  const hotel = searchParams.get('hotel');
  const checkin = searchParams.get('checkin');
  const checkout = searchParams.get('checkout');
  const adults = Number(searchParams.get('adults')) || 2;
  const rooms = Number(searchParams.get('rooms')) || 1;
  const { isLoggedIn, loading: authLoading } = useAuth();

  const directKey = useMemo(() => hotel ? extractDirectKey(hotel) : null, [hotel]);
  interface Candidate { hotel_key: string; name: string; }
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(directKey);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (directKey || !hotel) return;
    setSearching(true);
    setCandidates([]);
    setSelectedKey(null);
    setSelectedName(null);

    fetch(`/api/hotel-search?query=${encodeURIComponent(hotel)}`)
      .then((res) => res.json())
      .then((data) => {
        const cands: Candidate[] = data.candidates || [];
        setCandidates(cands);
        // auto_select=true or only 1 candidate → pick first automatically
        if (cands.length > 0 && (data.auto_select || cands.length === 1)) {
          setSelectedKey(cands[0].hotel_key);
          setSelectedName(cands[0].name);
        } else if (cands.length === 0 && data.hotel_key) {
          setSelectedKey(data.hotel_key);
          setSelectedName(data.hotel_name || null);
        }
      })
      .catch(() => {})
      .finally(() => setSearching(false));
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
      <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
        <h1 className="text-gray-900 font-bold text-lg">{displayName}</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {checkin} ~ {checkout}（{nights}泊）/ {adults}名 / {rooms}室
        </p>
      </div>

      {/* Hotel search status */}
      {searching && (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <div className="w-3 h-3 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
          ホテルを検索中...
        </div>
      )}

      {/* Candidate selection — only when auto_select was false */}
      {!searching && candidates.length > 1 && !selectedKey && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-gray-900 font-bold text-sm">
            該当するホテルを選択してください（{candidates.length}件）
          </h3>
          <div className="space-y-2">
            {candidates.map((c) => (
              <button
                key={c.hotel_key}
                onClick={() => { setSelectedKey(c.hotel_key); setSelectedName(c.name); }}
                className="w-full text-left px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
              >
                <span className="text-gray-900 text-sm">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {!searching && !directKey && !selectedKey && candidates.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
          <p className="text-gray-400 text-sm">
            ホテルが見つかりませんでした。TripAdvisorのURLを直接入力してみてください。
          </p>
        </div>
      )}

      {/* Price ranking — branch by auth state */}
      {!authLoading && selectedKey && checkin && checkout && (
        isLoggedIn ? (
          <UnifiedPriceRanking
            hotelName={selectedName || hotel}
            hotelKey={selectedKey}
            checkin={checkin}
            checkout={checkout}
            adults={adults}
            rooms={rooms}
          />
        ) : (
          <>
            <SpeedPromoBanner />
            <DataForSeoPricePanel
              hotelName={selectedName || hotel}
              checkin={checkin}
              checkout={checkout}
              adults={adults}
            />
          </>
        )
      )}

      {/* VPN tip */}
      {selectedKey && <VpnTip hotelName={selectedName || hotel} />}

      {/* Disclaimer */}
      <p className="text-gray-400 text-xs text-center">
        表示される価格は各予約サイト上の価格です。RyokoAIは価格を保証するものではありません。
      </p>
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
