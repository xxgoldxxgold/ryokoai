'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { generateAgodaLinks, generateBookingLinks } from '@/lib/generateLinks';
import { daysBetween } from '@/lib/utils';
import OtaSection from '@/components/OtaSection';
import SearchForm from '@/components/SearchForm';
import Link from 'next/link';

function SearchResults() {
  const searchParams = useSearchParams();
  const hotel = searchParams.get('hotel');
  const checkin = searchParams.get('checkin');
  const checkout = searchParams.get('checkout');
  const adults = Number(searchParams.get('adults')) || 2;
  const rooms = Number(searchParams.get('rooms')) || 1;

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

  return (
    <div className="px-4 py-8 max-w-3xl mx-auto space-y-8">
      {/* Search summary */}
      <div className="bg-[#1E293B] border border-white/5 rounded-xl px-5 py-4 space-y-1">
        <h1 className="text-white font-bold text-lg">{hotel}</h1>
        <p className="text-white/40 text-sm">
          {checkin} ~ {checkout}（{nights}泊）/ {adults}名 / {rooms}室
        </p>
      </div>

      {/* OTA sections */}
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
