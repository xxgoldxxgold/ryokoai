'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { generateBookingLinks } from '@/lib/generateLinks';

interface GeoPrice {
  ota: string;
  otaName: string;
  country: string;
  countryName: string;
  flag: string;
  price: number;
  currency: string;
}

interface XoteloRate {
  code: string;
  name: string;
  rate: number;
  tax: number;
}

interface UnifiedPrice {
  id: string;
  otaName: string;
  countryName: string | null;
  flag: string | null;
  price: number;
  link: string;
  source: 'geo' | 'xotelo';
}

interface Props {
  hotelName: string;
  hotelKey: string | null;
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

function buildBookingLink(countryCode: string, hotel: string, checkin: string, checkout: string, adults: number, rooms: number): string {
  const links = generateBookingLinks({ hotel, checkin, checkout, adults, rooms });
  const match = links.find((l) => l.country.code === countryCode);
  return match?.url || '#';
}

function getOtaSearchLink(otaCode: string, hotelName: string, checkin: string, checkout: string, adults: number): string {
  if (otaCode === 'Agoda' || otaCode === 'agoda') {
    return 'https://www.agoda.com/search?q=' + encodeURIComponent(hotelName) + '&checkIn=' + checkin + '&checkOut=' + checkout + '&rooms=1&adults=' + adults + '&currency=USD';
  }
  if (otaCode === 'Trip.com' || otaCode === 'trip') {
    return 'https://www.trip.com/hotels/list?keyword=' + encodeURIComponent(hotelName) + '&checkin=' + checkin.replace(/-/g, '/') + '&checkout=' + checkout.replace(/-/g, '/') + '&adult=' + adults + '&curr=USD';
  }
  if (otaCode === 'Expedia' || otaCode === 'expedia') {
    return 'https://www.expedia.com/Hotel-Search?destination=' + encodeURIComponent(hotelName) + '&startDate=' + checkin + '&endDate=' + checkout + '&adults=' + adults;
  }
  if (otaCode === 'Hotels.com' || otaCode === 'hotels') {
    return 'https://www.hotels.com/search.do?q-destination=' + encodeURIComponent(hotelName) + '&q-check-in=' + checkin + '&q-check-out=' + checkout + '&q-rooms=1&q-room-0-adults=' + adults;
  }
  return 'https://www.google.com/search?q=' + encodeURIComponent(hotelName + ' ' + otaCode);
}

export default function UnifiedPriceRanking({ hotelName, hotelKey, checkin, checkout, adults, rooms }: Props) {
  const [geoPrices, setGeoPrices] = useState<GeoPrice[]>([]);
  const [xoteloRates, setXoteloRates] = useState<XoteloRate[]>([]);
  const [geoPhase, setGeoPhase] = useState<'idle' | 'starting' | 'polling' | 'done' | 'error'>('idle');
  const [xoteloLoading, setXoteloLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryRef = useRef(0);

  const buildGeoParams = useCallback(() => {
    return new URLSearchParams({
      hotel: hotelName,
      checkin,
      checkout,
      adults: adults.toString(),
    }).toString();
  }, [hotelName, checkin, checkout, adults]);

  // Fetch geo prices (Booking.com from multiple countries)
  useEffect(() => {
    if (!hotelName || !checkin || !checkout) return;

    const params = buildGeoParams();
    setGeoPhase('starting');
    setGeoPrices([]);
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
            setGeoPhase('error');
            return;
          }

          setGeoPhase('polling');

          if (d.status === 'done' && d.cached) {
            fetch(`/api/geo-prices?action=status&${params}`)
              .then((r) => r.json())
              .then((full) => {
                setGeoPrices(full.prices || []);
                setGeoPhase('done');
              });
            return;
          }

          if (d.prices) {
            setGeoPrices(d.prices);
          }
        })
        .catch(() => setGeoPhase('error'));
    };

    startJob();

    intervalRef.current = setInterval(() => {
      fetch(`/api/geo-prices?action=status&${params}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.status === 'not_found') return;
          if (d.error) return;
          setGeoPrices(d.prices || []);
          if (d.status === 'done' || d.status === 'error') {
            setGeoPhase('done');
            if (intervalRef.current) clearInterval(intervalRef.current);
          }
        })
        .catch(() => {});
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hotelName, checkin, checkout, adults, buildGeoParams]);

  // Fetch Xotelo rates (multiple OTAs)
  useEffect(() => {
    if (!hotelKey || !checkin || !checkout) return;

    setXoteloLoading(true);
    setXoteloRates([]);

    fetch(`/api/hotel-rates?hotel_key=${encodeURIComponent(hotelKey)}&checkin=${checkin}&checkout=${checkout}&currency=USD&adults=${adults}`)
      .then((r) => r.json())
      .then((data) => {
        setXoteloRates(data.rates || []);
      })
      .catch(() => {})
      .finally(() => setXoteloLoading(false));
  }, [hotelKey, checkin, checkout, adults]);

  // Always show something when mounted (don't return null)
  const isIdle = geoPhase === 'idle' && !xoteloLoading && xoteloRates.length === 0;

  // Build unified list
  const unified: UnifiedPrice[] = [];

  // Add geo prices (Booking.com × countries)
  for (const gp of geoPrices) {
    unified.push({
      id: 'geo-' + gp.ota + '-' + gp.country,
      otaName: gp.otaName,
      countryName: gp.countryName,
      flag: gp.flag,
      price: gp.price,
      link: buildBookingLink(gp.flag, hotelName, checkin, checkout, adults, rooms),
      source: 'geo',
    });
  }

  // Add Xotelo rates (other OTAs — skip Booking.com since we have geo data for it)
  const hasGeoBooking = geoPrices.some((p) => p.ota === 'booking');
  for (const xr of xoteloRates) {
    const isBooking = xr.code === 'booking' || xr.name.toLowerCase().includes('booking');
    if (isBooking && hasGeoBooking) continue; // Skip Booking from Xotelo if we have geo data
    const total = xr.rate + xr.tax;
    if (total <= 0) continue;
    unified.push({
      id: 'xotelo-' + xr.code,
      otaName: xr.name,
      countryName: null,
      flag: null,
      price: total,
      link: getOtaSearchLink(xr.name, hotelName, checkin, checkout, adults),
      source: 'xotelo',
    });
  }

  unified.sort((a, b) => a.price - b.price);

  const isLoading = geoPhase === 'starting' || geoPhase === 'polling' || xoteloLoading;
  const best = unified.length > 0 ? unified[0] : null;
  const worst = unified.length > 1 ? unified[unified.length - 1] : null;
  const geoTotal = geoPhase !== 'idle' ? 8 : 0;
  const geoCompleted = geoPrices.length;

  if (isIdle) return null;

  return (
    <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5 space-y-4">
      <div>
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <span className="text-base">{'\u{1F30D}'}</span>
          OTA × 国別 総合最安ランキング
        </h3>
        <p className="text-white/30 text-xs mt-1">
          Booking.comを8か国のIPで接続 + 他OTAの価格を統合比較
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
            <span className="text-white/40 text-xs">
              {geoCompleted > 0
                ? `Booking.com: ${geoCompleted}/${geoTotal} 国取得完了${xoteloLoading ? ' / OTA価格取得中...' : ''}`
                : '各OTAの価格を取得中...'}
            </span>
          </div>

          {/* Show partial results as they stream in */}
          {unified.length > 0 && (
            <div className="space-y-1.5">
              {unified.slice(0, 5).map((p, i) => {
                const flag = p.flag ? (FLAG_EMOJI[p.flag] || p.flag) : '';
                return (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-white/30 text-xs w-5">{i + 1}.</span>
                      {flag && <span className="text-sm">{flag}</span>}
                      <span className="text-white/60 text-xs">{p.otaName}</span>
                      {p.countryName && <span className="text-white/30 text-[10px]">{p.countryName}</span>}
                      {p.source === 'xotelo' && <span className="text-indigo-400/40 text-[9px]">Xotelo</span>}
                    </div>
                    <span className="text-white/80 text-sm font-semibold">${p.price.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          )}

          {unified.length === 0 && (
            <div className="space-y-1.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 bg-white/5 rounded-lg animate-pulse" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {geoPhase === 'error' && !xoteloLoading && unified.length === 0 && (
        <div className="text-white/30 text-xs text-center py-4">
          価格の取得に失敗しました。しばらくしてからお試しください。
        </div>
      )}

      {/* Results */}
      {!isLoading && unified.length > 0 && (
        <>
          {/* Best deal highlight */}
          {best && worst && best.price < worst.price && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{'\u{1F3C6}'}</span>
                  <span className="text-emerald-400 text-sm font-bold">
                    {best.otaName}{best.countryName ? ` × ${best.countryName}` : ''}
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
                href={best.link}
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
            {unified.map((p, i) => {
              const flag = p.flag ? (FLAG_EMOJI[p.flag] || p.flag) : '';
              const isBest = i === 0;

              return (
                <a
                  key={p.id}
                  href={p.link}
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
                    {flag && <span className="text-sm">{flag}</span>}
                    <span className={`text-xs ${isBest ? 'text-white font-medium' : 'text-white/60'}`}>
                      {p.otaName}
                    </span>
                    {p.countryName && <span className="text-white/25 text-[10px]">{p.countryName}</span>}
                    {p.source === 'xotelo' && !p.countryName && (
                      <span className="text-indigo-400/30 text-[9px]">API</span>
                    )}
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

      {/* Done with no results */}
      {!isLoading && unified.length === 0 && geoPhase === 'done' && (
        <div className="text-white/30 text-xs text-center py-4">
          価格データを取得できませんでした。
        </div>
      )}

      <p className="text-white/20 text-[10px] text-center">
        ※ Booking.com: 各国IPからリアルタイム取得（USD）。他OTA: Xotelo API経由。VPNでその国に接続して予約可能。
      </p>
    </div>
  );
}
