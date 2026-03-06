'use client';

import { useEffect, useState } from 'react';

interface XoteloRate {
  code: string;
  name: string;
  rate: number;
  tax: number;
}

interface GooglePrice {
  source: string;
  logo: string | null;
  rate: number;
  rateWithTax: number;
}

interface UnifiedEntry {
  otaName: string;
  rate: number;
  rateWithTax: number;
  source: 'xotelo' | 'google';
  logo: string | null;
}

interface Props {
  hotelName: string;
  hotelKey: string | null;
  checkin: string;
  checkout: string;
  adults: number;
  rooms: number;
}

function getOtaLink(otaName: string, hotelName: string, checkin: string, checkout: string, adults: number): string {
  const n = otaName.toLowerCase();
  if (n.includes('agoda')) return 'https://www.agoda.com/search?q=' + encodeURIComponent(hotelName) + '&checkIn=' + checkin + '&checkOut=' + checkout + '&rooms=1&adults=' + adults + '&currency=USD';
  if (n.includes('trip')) return 'https://www.trip.com/hotels/list?keyword=' + encodeURIComponent(hotelName) + '&checkin=' + checkin.replace(/-/g, '/') + '&checkout=' + checkout.replace(/-/g, '/') + '&adult=' + adults + '&curr=USD';
  if (n.includes('expedia')) return 'https://www.expedia.com/Hotel-Search?destination=' + encodeURIComponent(hotelName) + '&startDate=' + checkin + '&endDate=' + checkout + '&adults=' + adults;
  if (n.includes('hotels.com')) return 'https://www.hotels.com/search.do?q-destination=' + encodeURIComponent(hotelName) + '&q-check-in=' + checkin + '&q-check-out=' + checkout + '&q-rooms=1&q-room-0-adults=' + adults;
  if (n.includes('booking')) return 'https://www.booking.com/searchresults.html?ss=' + encodeURIComponent(hotelName) + '&checkin=' + checkin + '&checkout=' + checkout + '&group_adults=' + adults + '&selected_currency=USD';
  if (n.includes('vio')) return 'https://www.vio.com/Hotel/Search?q=' + encodeURIComponent(hotelName) + '&checkin=' + checkin + '&checkout=' + checkout + '&guests=' + adults;
  if (n.includes('priceline')) return 'https://www.priceline.com/hotel-search/' + encodeURIComponent(hotelName) + '?check_in=' + checkin + '&check_out=' + checkout + '&adults=' + adults;
  return 'https://www.google.com/travel/hotels?q=' + encodeURIComponent(hotelName);
}

/** Normalize OTA names for dedup */
function normalizeOtaName(name: string): string {
  const n = name.toLowerCase().replace(/\.com$/, '').replace(/\s+/g, '');
  if (n.includes('booking')) return 'booking';
  if (n.includes('agoda')) return 'agoda';
  if (n.includes('trip')) return 'trip';
  if (n.includes('expedia')) return 'expedia';
  if (n.includes('hotels')) return 'hotels';
  if (n.includes('vio')) return 'vio';
  if (n.includes('priceline')) return 'priceline';
  if (n.includes('ritzcarlton') || n.includes('marriott')) return 'marriott';
  return n;
}

export default function UnifiedPriceRanking({ hotelName, hotelKey, checkin, checkout, adults, rooms }: Props) {
  const [xoteloRates, setXoteloRates] = useState<XoteloRate[]>([]);
  const [googlePrices, setGooglePrices] = useState<GooglePrice[]>([]);
  const [xoteloLoading, setXoteloLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Fetch Xotelo rates
  useEffect(() => {
    if (!hotelKey || !checkin || !checkout) return;
    setXoteloLoading(true);
    setXoteloRates([]);

    fetch(`/api/hotel-rates?hotel_key=${encodeURIComponent(hotelKey)}&checkin=${checkin}&checkout=${checkout}&currency=USD&adults=${adults}`)
      .then((r) => r.json())
      .then((data) => {
        setXoteloRates((data.rates || []) as XoteloRate[]);
      })
      .catch(() => {})
      .finally(() => setXoteloLoading(false));
  }, [hotelKey, checkin, checkout, adults]);

  // Fetch Google Hotels prices via SerpAPI
  useEffect(() => {
    if (!hotelName || !checkin || !checkout) return;
    setGoogleLoading(true);
    setGooglePrices([]);

    fetch(`/api/google-hotels?q=${encodeURIComponent(hotelName)}&checkin=${checkin}&checkout=${checkout}&adults=${adults}&currency=USD`)
      .then((r) => r.json())
      .then((data) => {
        setGooglePrices((data.prices || []) as GooglePrice[]);
      })
      .catch(() => {})
      .finally(() => setGoogleLoading(false));
  }, [hotelName, checkin, checkout, adults]);

  // Merge and deduplicate
  const merged: UnifiedEntry[] = [];
  const seen = new Set<string>();

  // Add Xotelo rates first (generally more reliable for tax breakdown)
  for (const r of xoteloRates) {
    if (r.rate <= 0) continue;
    const key = normalizeOtaName(r.name);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({
      otaName: r.name,
      rate: r.rate,
      rateWithTax: r.rate + r.tax,
      source: 'xotelo',
      logo: null,
    });
  }

  // Add Google Hotels prices (only if not already from Xotelo)
  for (const p of googlePrices) {
    const key = normalizeOtaName(p.source);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({
      otaName: p.source,
      rate: p.rate,
      rateWithTax: p.rateWithTax,
      source: 'google',
      logo: p.logo,
    });
  }

  // Sort by rate ascending
  merged.sort((a, b) => a.rate - b.rate);

  const loading = xoteloLoading || googleLoading;
  const best = merged.length > 0 ? merged[0] : null;
  const worst = merged.length > 1 ? merged[merged.length - 1] : null;

  if (!loading && merged.length === 0 && !hotelKey && !hotelName) return null;

  return (
    <div className="space-y-6">
      <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5 space-y-4">
        <div>
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <span className="text-base">&#x1F4B0;</span>
            OTA最安ランキング
          </h3>
          <p className="text-white/30 text-xs mt-1">
            複数の予約サイトの価格を比較（1泊・USD）
          </p>
        </div>

        {/* Loading */}
        {loading && merged.length === 0 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
            <span className="text-white/40 text-xs">OTA価格を取得中...</span>
          </div>
        )}

        {/* Results */}
        {merged.length > 0 && (
          <>
            {/* Best deal highlight */}
            {best && worst && best.rate < worst.rate && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">&#x1F3C6;</span>
                    <span className="text-emerald-400 text-sm font-bold">{best.otaName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 text-lg font-bold">
                      ${best.rate.toLocaleString()}<span className="text-xs font-normal text-emerald-400/50">/泊</span>
                    </span>
                    {best.rateWithTax > best.rate && (
                      <p className="text-emerald-400/30 text-[10px]">税込 ${best.rateWithTax.toLocaleString()}</p>
                    )}
                  </div>
                </div>
                <p className="text-emerald-400/60 text-xs mt-1">
                  最高値より ${(worst.rate - best.rate).toLocaleString()}お得
                  （{Math.round(((worst.rate - best.rate) / worst.rate) * 100)}%OFF）
                </p>
                <a
                  href={getOtaLink(best.otaName, hotelName, checkin, checkout, adults)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 bg-emerald-500/20 text-emerald-400 text-xs font-medium px-3 py-1.5 rounded hover:bg-emerald-500/30 transition-colors"
                >
                  {best.otaName}で検索する &#x2192;
                </a>
              </div>
            )}

            {/* OTA list */}
            <div className="space-y-1.5">
              {merged.map((entry, i) => {
                const isBest = i === 0 && merged.length > 1;
                const link = getOtaLink(entry.otaName, hotelName, checkin, checkout, adults);
                return (
                  <a
                    key={entry.otaName + entry.source}
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
                        {entry.otaName}
                      </span>
                      {entry.source === 'google' && (
                        <span className="text-[9px] text-white/15 bg-white/5 px-1 rounded">G</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="text-right">
                        <span className={`text-sm font-semibold ${isBest ? 'text-emerald-400' : 'text-white/80'}`}>
                          ${entry.rate.toLocaleString()}
                        </span>
                        {entry.rateWithTax > entry.rate && (
                          <span className="text-white/20 text-[10px] ml-1">税込${entry.rateWithTax.toLocaleString()}</span>
                        )}
                      </div>
                      <span className="text-white/20 text-xs">&#x2192;</span>
                    </div>
                  </a>
                );
              })}
            </div>

            {/* Still loading one source */}
            {loading && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 border border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                <span className="text-white/30 text-[10px]">追加データを取得中...</span>
              </div>
            )}

            <p className="text-white/20 text-[10px] text-center">
              ※ 税抜1泊あたり（USD）／税込価格は各行右側に表示
            </p>
          </>
        )}

        {/* No results */}
        {!loading && merged.length === 0 && (
          <div className="text-white/30 text-xs text-center py-3">
            価格データを取得できませんでした。
          </div>
        )}
      </div>
    </div>
  );
}
