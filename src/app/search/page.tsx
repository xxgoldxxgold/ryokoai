'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, useMemo } from 'react';
import { generateAgodaLinks, generateBookingLinks } from '@/lib/generateLinks';
import { daysBetween } from '@/lib/utils';
import OtaSection from '@/components/OtaSection';
import OtaPriceComparison from '@/components/OtaPriceComparison';
import SearchForm from '@/components/SearchForm';
import Link from 'next/link';

interface Candidate {
  hotel_key: string;
  name: string;
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

        // 候補が1件だけなら自動選択
        if (cands.length === 1) {
          setSelectedKey(cands[0].hotel_key);
          setSelectedName(cands[0].name);
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

  const displayName = selectedName || (directKey ? hotel : hotel);

  function handleSelectCandidate(c: Candidate) {
    setSelectedKey(c.hotel_key);
    setSelectedName(c.name);
  }

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
          ホテルを検索中...
        </div>
      )}

      {/* Candidate selection UI - shown when multiple candidates and none selected */}
      {!searching && candidates.length > 1 && !selectedKey && (
        <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5 space-y-3">
          <h3 className="text-white font-bold text-sm">
            該当するホテルを選択してください（{candidates.length}件）
          </h3>
          <div className="space-y-2">
            {candidates.map((c) => (
              <button
                key={c.hotel_key}
                onClick={() => handleSelectCandidate(c)}
                className="w-full text-left px-4 py-3 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-colors"
              >
                <span className="text-white text-sm">{c.name}</span>
                <span className="text-white/20 text-xs ml-2">({c.hotel_key})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected candidate indicator (when user chose from multiple) */}
      {!searching && candidates.length > 1 && selectedKey && (
        <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-5 py-3">
          <span className="text-indigo-300 text-sm font-medium">{selectedName}</span>
          <button
            onClick={() => { setSelectedKey(null); setSelectedName(null); }}
            className="text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            変更する
          </button>
        </div>
      )}

      {/* No results */}
      {!searching && !directKey && candidates.length === 0 && (
        <div className="bg-[#1E293B] border border-white/5 rounded-xl px-5 py-4">
          <p className="text-white/40 text-sm">
            ホテルが見つかりませんでした。TripAdvisorのURLを直接入力してみてください。
          </p>
        </div>
      )}

      {/* OTA Price Comparison - only shown after hotel is selected */}
      {selectedKey && (
        <OtaPriceComparison
          hotelKey={selectedKey}
          checkin={checkin}
          checkout={checkout}
          adults={adults}
          currency="USD"
        />
      )}

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
