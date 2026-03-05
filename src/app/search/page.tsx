'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, useMemo } from 'react';
import { generateAgodaLinks, generateBookingLinks } from '@/lib/generateLinks';
import { daysBetween } from '@/lib/utils';
import OtaSection from '@/components/OtaSection';
import OtaPriceComparison from '@/components/OtaPriceComparison';
import SearchForm from '@/components/SearchForm';
import Link from 'next/link';

interface HotelCandidate {
  name: string;
  hotel_key: string;
}

function extractDirectKey(input: string): string | null {
  const taMatch = input.match(/Hotel_Review-(g\d+-d\d+)/);
  if (taMatch) return taMatch[1];
  const keyMatch = input.match(/(g\d+-d\d+)/);
  if (keyMatch) return keyMatch[1];
  return null;
}

function SearchResults() {
  const searchParams = useSearchParams();
  const hotel = searchParams.get('hotel');
  const checkin = searchParams.get('checkin');
  const checkout = searchParams.get('checkout');
  const adults = Number(searchParams.get('adults')) || 2;
  const rooms = Number(searchParams.get('rooms')) || 1;

  const directKey = useMemo(() => hotel ? extractDirectKey(hotel) : null, [hotel]);
  const [hotelKey, setHotelKey] = useState<string | null>(directKey);
  const [hotelName, setHotelName] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<HotelCandidate[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (directKey || !hotel) return;

    setSearching(true);
    fetch(`/api/hotel-search?query=${encodeURIComponent(hotel)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.hotel_key) {
          setHotelKey(data.hotel_key);
          setHotelName(data.hotel_name);
        }
        if (data.candidates?.length > 1) {
          setCandidates(data.candidates);
        }
      })
      .catch(() => {})
      .finally(() => setSearching(false));
  }, [hotel, directKey]);

  if (!hotel || !checkin || !checkout) {
    return (
      <div className="px-4 py-16 text-center space-y-6">
        <p className="text-white/50 text-sm">検索条件を入力してください。</p>
        <SearchForm />
      </div>
    );
  }

  const nights = daysBetween(checkin, checkout);
  const params = { hotel, checkin, checkout, adults, rooms };
  const agodaLinks = generateAgodaLinks(params);
  const bookingLinks = generateBookingLinks(params);

  const displayName = hotelName || hotel;

  return (
    <div className="px-4 py-8 max-w-3xl mx-auto space-y-8">
      {/* Search summary */}
      <div className="bg-[#1E293B] border border-white/5 rounded-xl px-5 py-4 space-y-1">
        <h1 className="text-white font-bold text-lg">{displayName}</h1>
        <p className="text-white/40 text-sm">
          {checkin} ~ {checkout}（{nights}泊）/ {adults}名 / {rooms}室
        </p>
      </div>

      {/* Hotel search status */}
      {searching && (
        <div className="flex items-center gap-2 text-white/40 text-sm">
          <div className="w-3 h-3 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
          TripAdvisorでホテルを検索中...
        </div>
      )}

      {/* Candidate selector */}
      {candidates.length > 1 && (
        <div className="bg-[#1E293B] border border-white/5 rounded-xl p-4 space-y-2">
          <p className="text-white/50 text-xs">もしかして：</p>
          <div className="space-y-1">
            {candidates.map((c) => (
              <button
                key={c.hotel_key}
                onClick={() => { setHotelKey(c.hotel_key); setHotelName(c.name); setCandidates([]); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  c.hotel_key === hotelKey
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-white/60 hover:bg-white/5'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* OTA Price Comparison (Xotelo) */}
      <OtaPriceComparison
        hotelKey={hotelKey}
        checkin={checkin}
        checkout={checkout}
        adults={adults}
        currency="USD"
      />

      {/* Country link sections */}
      <OtaSection name="Agoda" color="bg-red-500/30" links={agodaLinks} />
      <OtaSection name="Booking.com" color="bg-blue-500/30" links={bookingLinks} />

      {/* VPN banner */}
      <Link
        href="/guide"
        className="block bg-amber-500/10 border border-amber-500/20 rounded-xl px-5 py-4 hover:bg-amber-500/15 transition-colors"
      >
        <p className="text-amber-400 text-sm font-medium">
          💡 VPNを使うとリンク先の価格がそのまま適用されます
        </p>
        <p className="text-amber-400/50 text-xs mt-1">
          ガイドを見る →
        </p>
      </Link>

      {/* Disclaimer */}
      <p className="text-white/20 text-xs text-center">
        ⚠️ 表示される価格はOTAサイト上の価格です。RyokoAIは価格を保証するものではありません。
      </p>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-center text-white/30 text-sm">読み込み中...</div>}>
      <SearchResults />
    </Suspense>
  );
}
