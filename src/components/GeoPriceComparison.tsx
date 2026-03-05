'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

interface GeoPrice {
  country: string;
  name: string;
  flag: string;
  price: number;
  currency: string;
}

interface GeoData {
  status: string;
  completed: number;
  total: number;
  prices: GeoPrice[];
  savings: {
    cheapest: { country: string; name: string; price: number };
    mostExpensive: { country: string; name: string; price: number };
    difference: number;
    percentOff: number;
  } | null;
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
  const [data, setData] = useState<GeoData | null>(null);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!hotelName || !checkin || !checkout) return;

    const params = new URLSearchParams({
      hotel: hotelName,
      checkin,
      checkout,
      adults: adults.toString(),
    });

    // Start the job
    fetch(`/api/geo-prices?action=start&${params}`)
      .then((r) => r.json())
      .then((d) => {
        setStarted(true);
        if (d.status === 'done') {
          // Cached - fetch full results
          return fetch(`/api/geo-prices?action=status&${params}`)
            .then((r) => r.json())
            .then((full) => setData(full));
        }
        setData(d);
      })
      .catch(() => setError(true));

    // Poll for updates every 5 seconds
    intervalRef.current = setInterval(() => {
      fetch(`/api/geo-prices?action=status&${params}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.status === 'not_found') return;
          setData(d);
          if (d.status === 'done' || d.status === 'error') {
            if (intervalRef.current) clearInterval(intervalRef.current);
          }
        })
        .catch(() => {});
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hotelName, checkin, checkout, adults]);

  if (error) return null;
  if (!started) return null;

  const isLoading = !data || data.status === 'running';
  const prices = data?.prices || [];
  const savings = data?.savings;

  if (data?.status === 'done' && prices.length === 0) return null;

  const jpPrice = prices.find((p) => p.country === 'jp');
  const baselinePrice = jpPrice?.price || (prices.length > 0 ? prices[prices.length - 1].price : 0);

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

      {isLoading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
            <span className="text-white/40 text-xs">
              {data ? `${data.completed}/${data.total} カ国取得中...` : '開始中...'}
            </span>
          </div>
          {/* Show already-fetched results while loading */}
          {prices.map((p) => {
            const flag = FLAG_EMOJI[p.flag] || p.flag;
            return (
              <div key={p.country} className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-base w-6 text-center">{flag}</span>
                  <span className="text-white/60 text-sm">{p.name}</span>
                </div>
                <span className="text-white/80 text-sm font-semibold">
                  ${p.price.toLocaleString()}<span className="text-xs font-normal text-white/30">/泊</span>
                </span>
              </div>
            );
          })}
          {/* Skeleton for remaining */}
          {data && Array.from({ length: data.total - data.completed }, (_, i) => (
            <div key={`skel-${i}`} className="h-10 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && prices.length > 0 && (
        <>
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
                    {isCheapest && prices.length > 1 && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-medium">
                        最安
                      </span>
                    )}
                    {isBaseline && !isCheapest && (
                      <span className="text-[10px] text-white/30 w-14 text-right">基準</span>
                    )}
                    {!isCheapest && !isBaseline && diffPercent !== 0 && (
                      <span className={`text-[10px] w-14 text-right ${diffPercent < 0 ? 'text-emerald-400' : 'text-red-400/60'}`}>
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
        </>
      )}

      <p className="text-white/20 text-[10px] text-center">
        ※ Booking.comの1泊あたり表示価格（USD）。各国IPからリアルタイム取得。
      </p>
    </div>
  );
}
