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

function getBookingLink(countryCode: string, hotel: string, checkin: string, checkout: string, adults: number, rooms: number): string {
  const links = generateBookingLinks({ hotel, checkin, checkout, adults, rooms });
  const match = links.find((l) => l.country.code === countryCode);
  return match?.url || 'https://www.booking.com/searchresults.html?ss=' + encodeURIComponent(hotel);
}

function getOtaLink(otaName: string, hotelName: string, checkin: string, checkout: string, adults: number): string {
  const n = otaName.toLowerCase();
  if (n.includes('agoda')) return 'https://www.agoda.com/search?q=' + encodeURIComponent(hotelName) + '&checkIn=' + checkin + '&checkOut=' + checkout + '&rooms=1&adults=' + adults + '&currency=USD';
  if (n.includes('trip')) return 'https://www.trip.com/hotels/list?keyword=' + encodeURIComponent(hotelName) + '&checkin=' + checkin.replace(/-/g, '/') + '&checkout=' + checkout.replace(/-/g, '/') + '&adult=' + adults + '&curr=USD';
  if (n.includes('expedia')) return 'https://www.expedia.com/Hotel-Search?destination=' + encodeURIComponent(hotelName) + '&startDate=' + checkin + '&endDate=' + checkout + '&adults=' + adults;
  if (n.includes('hotels.com')) return 'https://www.hotels.com/search.do?q-destination=' + encodeURIComponent(hotelName) + '&q-check-in=' + checkin + '&q-check-out=' + checkout + '&q-rooms=1&q-room-0-adults=' + adults;
  if (n.includes('booking')) return 'https://www.booking.com/searchresults.html?ss=' + encodeURIComponent(hotelName) + '&checkin=' + checkin + '&checkout=' + checkout + '&group_adults=' + adults + '&selected_currency=USD';
  return 'https://www.google.com/search?q=' + encodeURIComponent(hotelName + ' ' + otaName);
}

export default function UnifiedPriceRanking({ hotelName, hotelKey, checkin, checkout, adults, rooms }: Props) {
  const [geoPrices, setGeoPrices] = useState<GeoPrice[]>([]);
  const [xoteloRates, setXoteloRates] = useState<XoteloRate[]>([]);
  const [geoPhase, setGeoPhase] = useState<'idle' | 'starting' | 'polling' | 'done' | 'error'>('idle');
  const [xoteloLoading, setXoteloLoading] = useState(false);
  const [geoCompleted, setGeoCompleted] = useState(0);
  const [geoTotal, setGeoTotal] = useState(0);
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
    setGeoCompleted(0);
    setGeoTotal(0);
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
          if (d.total) setGeoTotal(d.total);

          if (d.status === 'done' && d.cached) {
            fetch(`/api/geo-prices?action=status&${params}`)
              .then((r) => r.json())
              .then((full) => {
                setGeoPrices(full.prices || []);
                setGeoCompleted(full.completed || 0);
                setGeoTotal(full.total || 0);
                setGeoPhase('done');
              });
            return;
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
          setGeoCompleted(d.completed || 0);
          setGeoTotal(d.total || 0);
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
        const rates = (data.rates || []) as XoteloRate[];
        rates.sort((a: XoteloRate, b: XoteloRate) => (a.rate + a.tax) - (b.rate + b.tax));
        setXoteloRates(rates);
      })
      .catch(() => {})
      .finally(() => setXoteloLoading(false));
  }, [hotelKey, checkin, checkout, adults]);

  // Prepare data
  const sortedGeo = [...geoPrices].sort((a, b) => a.price - b.price);
  const geoLoading = geoPhase === 'starting' || geoPhase === 'polling';
  const geoBest = sortedGeo.length > 0 ? sortedGeo[0] : null;
  const geoWorst = sortedGeo.length > 1 ? sortedGeo[sortedGeo.length - 1] : null;

  const xoteloValid = xoteloRates.filter(r => (r.rate + r.tax) > 0);
  const xoteloBest = xoteloValid.length > 0 ? xoteloValid[0] : null;
  const xoteloWorst = xoteloValid.length > 1 ? xoteloValid[xoteloValid.length - 1] : null;

  const showNothing = geoPhase === 'idle' && !xoteloLoading && xoteloRates.length === 0;
  if (showNothing) return null;

  return (
    <div className="space-y-6">

      {/* ===== Section 1: OTA Price Comparison (Xotelo - fast) ===== */}
      {(xoteloLoading || xoteloValid.length > 0) && (
        <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <span className="text-base">📊</span>
              OTA価格比較
            </h3>
            <p className="text-white/30 text-xs mt-1">
              各OTAの現在価格（税込/1泊・USD）
            </p>
          </div>

          {xoteloLoading && xoteloValid.length === 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
              <span className="text-white/40 text-xs">OTA価格を取得中...</span>
            </div>
          )}

          {xoteloValid.length > 0 && (
            <>
              {/* Best deal */}
              {xoteloBest && xoteloWorst && xoteloBest.rate + xoteloBest.tax < xoteloWorst.rate + xoteloWorst.tax && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🏆</span>
                      <span className="text-emerald-400 text-sm font-bold">{xoteloBest.name}</span>
                    </div>
                    <span className="text-emerald-400 text-lg font-bold">
                      ${(xoteloBest.rate + xoteloBest.tax).toLocaleString()}<span className="text-xs font-normal text-emerald-400/50">/泊</span>
                    </span>
                  </div>
                  <p className="text-emerald-400/60 text-xs mt-1">
                    最高値より ${((xoteloWorst.rate + xoteloWorst.tax) - (xoteloBest.rate + xoteloBest.tax)).toLocaleString()}お得
                  </p>
                  <a
                    href={getOtaLink(xoteloBest.name, hotelName, checkin, checkout, adults)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 bg-emerald-500/20 text-emerald-400 text-xs font-medium px-3 py-1.5 rounded hover:bg-emerald-500/30 transition-colors"
                  >
                    {xoteloBest.name}で検索する →
                  </a>
                </div>
              )}

              {/* OTA list */}
              <div className="space-y-1.5">
                {xoteloValid.map((rate, i) => {
                  const total = rate.rate + rate.tax;
                  const isBest = i === 0;
                  const link = getOtaLink(rate.name, hotelName, checkin, checkout, adults);
                  return (
                    <a
                      key={rate.code}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                        isBest
                          ? 'bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15'
                          : 'bg-white/[0.02] border border-white/5 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-xs w-5 text-right ${isBest ? 'text-emerald-400 font-bold' : 'text-white/30'}`}>
                          {i + 1}.
                        </span>
                        <span className={`text-sm ${isBest ? 'text-white font-medium' : 'text-white/60'}`}>
                          {rate.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${isBest ? 'text-emerald-400' : 'text-white/80'}`}>
                          ${total.toLocaleString()}
                        </span>
                        <span className="text-white/20 text-xs">→</span>
                      </div>
                    </a>
                  );
                })}
              </div>

              <p className="text-white/20 text-[10px] text-center">
                ※ Xotelo API経由。税込み1泊あたり（USD）
              </p>
            </>
          )}
        </div>
      )}

      {/* ===== Section 2: Booking.com Country Price Comparison (Geo scraper) ===== */}
      {geoPhase !== 'idle' && (
        <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <span className="text-base">🌍</span>
              Booking.com 国別価格比較
            </h3>
            <p className="text-white/30 text-xs mt-1">
              各国のIPから実際にBooking.comにアクセスして価格を取得
            </p>
          </div>

          {/* Loading state */}
          {geoLoading && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                <span className="text-white/40 text-xs">
                  {geoCompleted > 0
                    ? `${geoCompleted}/${geoTotal} か国取得完了...`
                    : '各国の価格を取得中（約1分）...'}
                </span>
              </div>

              {/* Show partial results as they come in */}
              {sortedGeo.length > 0 && (
                <div className="space-y-1.5">
                  {sortedGeo.map((p, i) => {
                    const flag = FLAG_EMOJI[p.flag] || p.flag;
                    const link = getBookingLink(p.flag, hotelName, checkin, checkout, adults, rooms);
                    return (
                      <a
                        key={p.country}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-white/30 text-xs w-5 text-right">{i + 1}.</span>
                          <span className="text-sm">{flag}</span>
                          <span className="text-white/60 text-sm">{p.countryName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-white/80 text-sm font-semibold">${p.price.toLocaleString()}</span>
                          <span className="text-white/20 text-xs">→</span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}

              {sortedGeo.length === 0 && (
                <div className="space-y-1.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {geoPhase === 'error' && (
            <div className="text-white/30 text-xs text-center py-3">
              価格の取得に失敗しました。しばらくしてからお試しください。
            </div>
          )}

          {/* Completed results */}
          {geoPhase === 'done' && sortedGeo.length > 0 && (
            <>
              {/* Best deal highlight */}
              {geoBest && geoWorst && geoBest.price < geoWorst.price && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🏆</span>
                      <span className="text-sm">{FLAG_EMOJI[geoBest.flag] || geoBest.flag}</span>
                      <span className="text-emerald-400 text-sm font-bold">{geoBest.countryName}</span>
                    </div>
                    <span className="text-emerald-400 text-lg font-bold">
                      ${geoBest.price.toLocaleString()}<span className="text-xs font-normal text-emerald-400/50">/泊</span>
                    </span>
                  </div>
                  <p className="text-emerald-400/60 text-xs mt-1">
                    最高値（{geoWorst.countryName} ${geoWorst.price.toLocaleString()}）より ${(geoWorst.price - geoBest.price).toLocaleString()}お得
                    （{Math.round(((geoWorst.price - geoBest.price) / geoWorst.price) * 100)}%OFF）
                  </p>
                  <a
                    href={getBookingLink(geoBest.flag, hotelName, checkin, checkout, adults, rooms)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 bg-emerald-500/20 text-emerald-400 text-xs font-medium px-3 py-1.5 rounded hover:bg-emerald-500/30 transition-colors"
                  >
                    {geoBest.countryName}版Booking.comで予約する →
                  </a>
                </div>
              )}

              {/* Country list */}
              <div className="space-y-1.5">
                {sortedGeo.map((p, i) => {
                  const flag = FLAG_EMOJI[p.flag] || p.flag;
                  const isBest = i === 0 && sortedGeo.length > 1;
                  const link = getBookingLink(p.flag, hotelName, checkin, checkout, adults, rooms);
                  return (
                    <a
                      key={p.country}
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
                        <span className={`text-sm ${isBest ? 'text-white font-medium' : 'text-white/60'}`}>
                          {p.countryName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${isBest ? 'text-emerald-400' : 'text-white/80'}`}>
                          ${p.price.toLocaleString()}
                        </span>
                        <span className="text-white/20 text-xs">→</span>
                      </div>
                    </a>
                  );
                })}
              </div>

              <p className="text-white/15 text-[10px] text-center">
                ※ VPNでその国に接続してからリンク先で予約すると、その国の価格で予約できます
              </p>
            </>
          )}

          {/* Done but no results */}
          {geoPhase === 'done' && sortedGeo.length === 0 && (
            <div className="text-white/30 text-xs text-center py-3">
              Booking.comから価格を取得できませんでした。
            </div>
          )}
        </div>
      )}
    </div>
  );
}
