'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface GeoPrice {
  country: string;
  name: string;
  flag: string;
  price: number;
  currency: string;
  source: string;
}

interface GeoPriceData {
  hotel: string;
  prices: GeoPrice[];
  savings: {
    cheapest: { country: string; name: string; price: number };
    mostExpensive: { country: string; name: string; price: number };
    difference: number;
    percentOff: number;
  } | null;
  successful: number;
  totalCountries: number;
}

interface Props {
  hotelName: string;
  checkin: string;
  checkout: string;
  adults: number;
}

const FLAG_EMOJI: Record<string, string> = {
  PL: '\u{1F1F5}\u{1F1F1}',
  IN: '\u{1F1EE}\u{1F1F3}',
  TH: '\u{1F1F9}\u{1F1ED}',
  BR: '\u{1F1E7}\u{1F1F7}',
  TR: '\u{1F1F9}\u{1F1F7}',
  JP: '\u{1F1EF}\u{1F1F5}',
  US: '\u{1F1FA}\u{1F1F8}',
  GB: '\u{1F1EC}\u{1F1E7}',
};

export default function GeoPriceComparison({ hotelName, checkin, checkout, adults }: Props) {
  const [data, setData] = useState<GeoPriceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hotelName || !checkin || !checkout) return;

    setLoading(true);
    setError(null);
    setData(null);

    const params = new URLSearchParams({
      hotel: hotelName,
      checkin,
      checkout,
      adults: adults.toString(),
    });

    fetch(`/api/geo-prices?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
      })
      .then((d) => {
        if (d.prices && d.prices.length > 0) {
          setData(d);
        } else {
          setError('no_data');
        }
      })
      .catch(() => setError('fetch_error'))
      .finally(() => setLoading(false));
  }, [hotelName, checkin, checkout, adults]);

  if (loading) {
    return (
      <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
          <span className="text-white/50 text-sm">
            8カ国の価格を取得中...（最大3分）
          </span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
        <p className="text-white/20 text-[10px] text-center">
          各国のIPからBooking.comにアクセスしてリアルタイム価格を取得しています
        </p>
      </div>
    );
  }

  if (error || !data) return null;

  const { prices, savings } = data;
  const jpPrice = prices.find((p) => p.country === 'jp');
  const baselinePrice = jpPrice?.price || prices[prices.length - 1]?.price;

  return (
    <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5 space-y-4">
      <div>
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <span className="text-base">{'\u{1F30D}'}</span>
          国別価格比較
        </h3>
        <p className="text-white/30 text-xs mt-1">
          同じホテルでも、アクセスする国によって料金が異なります
        </p>
      </div>

      <div className="space-y-2">
        {prices.map((p, i) => {
          const isCheapest = i === 0;
          const isBaseline = p.country === 'jp';
          const diffPercent = baselinePrice
            ? Math.round(((p.price - baselinePrice) / baselinePrice) * 100)
            : 0;
          const flag = FLAG_EMOJI[p.flag] || p.flag;

          return (
            <div
              key={p.country}
              className={`flex items-center justify-between px-4 py-2.5 rounded-lg ${
                isCheapest
                  ? 'bg-emerald-500/10 border border-emerald-500/20'
                  : 'bg-white/[0.02] border border-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-base w-6 text-center">{flag}</span>
                <span className={`text-sm ${isCheapest ? 'text-white font-medium' : 'text-white/60'}`}>
                  {p.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${isCheapest ? 'text-emerald-400' : 'text-white/80'}`}>
                  ${p.price.toLocaleString()}
                  <span className="text-xs font-normal text-white/30">/泊</span>
                </span>
                {isCheapest && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-medium">
                    最安
                  </span>
                )}
                {isBaseline && !isCheapest && (
                  <span className="text-[10px] text-white/30 w-16 text-right">基準</span>
                )}
                {!isCheapest && !isBaseline && diffPercent !== 0 && (
                  <span className={`text-[10px] w-16 text-right ${diffPercent < 0 ? 'text-emerald-400' : 'text-red-400/60'}`}>
                    {diffPercent > 0 ? '+' : ''}{diffPercent}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {savings && savings.difference > 0 && (
        <div className="flex items-center justify-center gap-2 pt-1">
          <span className="text-xs text-emerald-400 font-medium">
            {'\u{1F4B0}'} 最大${savings.difference.toLocaleString()}お得！（{savings.cheapest.name}設定）
          </span>
        </div>
      )}

      <Link
        href="/guide"
        className="block bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-4 py-3 hover:bg-indigo-500/15 transition-colors"
      >
        <p className="text-indigo-300 text-xs font-medium">
          {'\u{1F4A1}'} 最安国の価格で予約するにはVPNでその国に接続してからリンクをクリック
        </p>
        <p className="text-indigo-300/40 text-[10px] mt-0.5">
          VPNガイドを見る →
        </p>
      </Link>

      <p className="text-white/20 text-[10px] text-center">
        ※ Booking.comの1泊あたり表示価格（USD）。プロキシ経由で各国IPからリアルタイム取得。
      </p>
    </div>
  );
}
