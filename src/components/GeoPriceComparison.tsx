'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { generateAgodaLinks, generateBookingLinks } from '@/lib/generateLinks';

interface GeoPrice {
  ota: string;
  otaName: string;
  country: string;
  countryName: string;
  flag: string;
  price: number;
  currency: string;
}

interface GeoData {
  status: string;
  completed: number;
  total: number;
  prices: GeoPrice[];
  best: GeoPrice | null;
}

interface Props {
  hotelName: string;
  checkin: string;
  checkout: string;
  adults: number;
  rooms: number;
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

function buildLink(ota: string, countryCode: string, hotel: string, checkin: string, checkout: string, adults: number, rooms: number): string {
  const params = { hotel, checkin, checkout, adults, rooms };

  if (ota === 'booking') {
    const links = generateBookingLinks(params);
    const match = links.find((l) => l.country.code === countryCode);
    return match?.url || '#';
  }
  if (ota === 'agoda') {
    const links = generateAgodaLinks(params);
    const match = links.find((l) => l.country.code === countryCode);
    return match?.url || '#';
  }
  if (ota === 'trip') {
    return 'https://www.trip.com/hotels/list?keyword=' + encodeURIComponent(hotel) + '&checkin=' + checkin.replace(/-/g, '/') + '&checkout=' + checkout.replace(/-/g, '/') + '&adult=' + adults + '&curr=USD';
  }
  return '#';
}

export default function GeoPriceComparison({ hotelName, checkin, checkout, adults, rooms }: Props) {
  const [data, setData] = useState<GeoData | null>(null);
  const [phase, setPhase] = useState<'idle' | 'starting' | 'polling' | 'done' | 'error'>('idle');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryRef = useRef(0);

  const buildParams = useCallback(() => {
    return new URLSearchParams({
      hotel: hotelName,
      checkin,
      checkout,
      adults: adults.toString(),
    }).toString();
  }, [hotelName, checkin, checkout, adults]);

  useEffect(() => {
    if (!hotelName || !checkin || !checkout) return;

    const params = buildParams();
    setPhase('starting');
    setData(null);
    retryRef.current = 0;

    const startJob = () => {
      fetch(`/api/geo-prices?action=start&${params}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.error === 'Server busy') {
            if (retryRef.current < 3) {
              retryRef.current++;
              setTimeout(startJob, 10000);
              return;
            }
            setPhase('error');
            return;
          }

          setPhase('polling');

          if (d.status === 'done' && d.cached) {
            fetch(`/api/geo-prices?action=status&${params}`)
              .then((r) => r.json())
              .then((full) => {
                setData(full);
                setPhase('done');
              });
            return;
          }

          if (d.status && !d.error) {
            setData(d);
          }
        })
        .catch(() => setPhase('error'));
    };

    startJob();

    intervalRef.current = setInterval(() => {
      fetch(`/api/geo-prices?action=status&${params}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.status === 'not_found') return;
          if (d.error) return;
          setData(d);
          if (d.status === 'done' || d.status === 'error') {
            setPhase('done');
            if (intervalRef.current) clearInterval(intervalRef.current);
          }
        })
        .catch(() => {});
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hotelName, checkin, checkout, adults, buildParams]);

  if (phase === 'idle') return null;

  const isLoading = phase === 'starting' || phase === 'polling';
  const prices = (data?.prices || []).slice().sort((a, b) => a.price - b.price);
  const total = data?.total || 0;
  const best = prices.length > 0 ? prices[0] : null;
  const worst = prices.length > 0 ? prices[prices.length - 1] : null;

  return (
    <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5 space-y-4">
      <div>
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <span className="text-base">{'\u{1F30D}'}</span>
          予約サイト × 国別 最安ランキング
        </h3>
        <p className="text-white/30 text-xs mt-1">
          各予約サイトを各国のIPから接続して実際の表示価格を比較
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-white/40 text-xs">
              {data && data.completed > 0
                ? `${data.completed}/${total} 取得完了`
                : '各予約サイト × 各国の価格を取得中...'}
            </span>
          </div>

          {/* Show partial results as they stream in */}
          {prices.length > 0 && (
            <div className="space-y-1.5">
              {prices.slice(0, 5).map((p, i) => {
                const flag = FLAG_EMOJI[p.flag] || p.flag;
                return (
                  <div key={p.ota + '-' + p.country} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-white/30 text-xs w-5">{i + 1}.</span>
                      <span className="text-sm">{flag}</span>
                      <span className="text-white/60 text-xs">{p.otaName}</span>
                      <span className="text-white/30 text-[10px]">{p.countryName}</span>
                    </div>
                    <span className="text-white/80 text-sm font-semibold">${p.price.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          )}

          {prices.length === 0 && (
            <div className="space-y-1.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 bg-white/5 rounded-lg animate-pulse" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {phase === 'error' && (
        <div className="text-white/30 text-xs text-center py-4">
          価格の取得に失敗しました。しばらくしてからお試しください。
        </div>
      )}

      {/* Done with no results */}
      {phase === 'done' && prices.length === 0 && (
        <div className="text-white/30 text-xs text-center py-4">
          価格データを取得できませんでした。
        </div>
      )}

      {/* Results */}
      {!isLoading && prices.length > 0 && (
        <>
          {/* Best deal highlight */}
          {best && worst && best.price < worst.price && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{'\u{1F3C6}'}</span>
                  <span className="text-emerald-400 text-sm font-bold">
                    {best.otaName} × {best.countryName}
                  </span>
                </div>
                <span className="text-emerald-400 text-lg font-bold">
                  ${best.price.toLocaleString()}<span className="text-xs font-normal text-emerald-400/50">/泊</span>
                </span>
              </div>
              <p className="text-emerald-400/60 text-xs mt-1">
                最高値より ${(worst.price - best.price).toLocaleString()}お得
                （{Math.round(((worst.price - best.price) / worst.price) * 100)}%OFF）
              </p>
              <a
                href={buildLink(best.ota, best.flag, hotelName, checkin, checkout, adults, rooms)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 bg-emerald-500/20 text-emerald-400 text-xs font-medium px-3 py-1.5 rounded hover:bg-emerald-500/30 transition-colors"
              >
                {best.otaName}で予約する →
              </a>
            </div>
          )}

          {/* Ranking list */}
          <div className="space-y-1.5">
            {prices.map((p, i) => {
              const flag = FLAG_EMOJI[p.flag] || p.flag;
              const isBest = i === 0;
              const link = buildLink(p.ota, p.flag, hotelName, checkin, checkout, adults, rooms);

              return (
                <a
                  key={p.ota + '-' + p.country}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                    isBest
                      ? 'bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15'
                      : 'bg-white/[0.02] border border-white/5 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs w-5 text-right ${isBest ? 'text-emerald-400 font-bold' : 'text-white/30'}`}>
                      {i + 1}.
                    </span>
                    <span className="text-sm">{flag}</span>
                    <span className={`text-xs ${isBest ? 'text-white font-medium' : 'text-white/60'}`}>
                      {p.otaName}
                    </span>
                    <span className="text-white/25 text-[10px]">{p.countryName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isBest ? 'text-emerald-400' : 'text-white/80'}`}>
                      ${p.price.toLocaleString()}
                    </span>
                    <span className="text-white/20 text-[10px]">→</span>
                  </div>
                </a>
              );
            })}
          </div>
        </>
      )}

      <p className="text-white/20 text-[10px] text-center">
        ※ 各予約サイトを各国IPからリアルタイム取得（USD）。VPNでその国に接続して予約可能。
      </p>
    </div>
  );
}
