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
  link: string | null;
  rate: number;
  rateWithTax: number;
}

interface UnifiedEntry {
  otaName: string;
  rate: number;
  rateWithTax: number;
  link: string | null;
  source: 'xotelo' | 'google';
}

interface Props {
  hotelName: string;
  hotelKey: string | null;
  checkin: string;
  checkout: string;
  adults: number;
  rooms: number;
}

function fallbackOtaLink(otaName: string, hotelName: string, checkin: string, checkout: string, adults: number): string {
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
  if (n.includes('hyatt')) return 'hyatt';
  if (n.includes('hilton')) return 'hilton';
  return n;
}

export default function UnifiedPriceRanking({ hotelName, hotelKey, checkin, checkout, adults, rooms }: Props) {
  const [xoteloRates, setXoteloRates] = useState<XoteloRate[]>([]);
  const [googlePrices, setGooglePrices] = useState<GooglePrice[]>([]);
  const [xoteloLoading, setXoteloLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (!hotelKey || !checkin || !checkout) return;
    setXoteloLoading(true);
    setXoteloRates([]);
    fetch(`/api/hotel-rates?hotel_key=${encodeURIComponent(hotelKey)}&checkin=${checkin}&checkout=${checkout}&currency=USD&adults=${adults}`)
      .then((r) => r.json())
      .then((data) => setXoteloRates((data.rates || []) as XoteloRate[]))
      .catch(() => {})
      .finally(() => setXoteloLoading(false));
  }, [hotelKey, checkin, checkout, adults]);

  useEffect(() => {
    if (!hotelName || !checkin || !checkout) return;
    setGoogleLoading(true);
    setGooglePrices([]);
    fetch(`/api/google-hotels?q=${encodeURIComponent(hotelName)}&checkin=${checkin}&checkout=${checkout}&adults=${adults}&currency=USD`)
      .then((r) => r.json())
      .then((data) => setGooglePrices((data.prices || []) as GooglePrice[]))
      .catch(() => {})
      .finally(() => setGoogleLoading(false));
  }, [hotelName, checkin, checkout, adults]);

  // Merge results: Google Hotels first (real-time, has direct links), then Xotelo as supplement
  const merged: UnifiedEntry[] = [];
  const seen = new Set<string>();

  // Google Hotels prices first (more accurate, has direct booking links)
  for (const p of googlePrices) {
    if (p.rate <= 0) continue;
    const key = normalizeOtaName(p.source);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({
      otaName: p.source,
      rate: p.rate,
      rateWithTax: p.rateWithTax,
      link: p.link,
      source: 'google',
    });
  }

  // Xotelo rates as supplement (only OTAs not already from Google Hotels)
  for (const r of xoteloRates) {
    if (r.rate <= 0) continue;
    const key = normalizeOtaName(r.name);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({
      otaName: r.name,
      rate: r.rate,
      rateWithTax: r.rate + r.tax,
      link: null,
      source: 'xotelo',
    });
  }

  merged.sort((a, b) => a.rate - b.rate);

  const loading = xoteloLoading || googleLoading;
  const best = merged.length > 0 ? merged[0] : null;
  const worst = merged.length > 1 ? merged[merged.length - 1] : null;
  const savings = best && worst && worst.rate > best.rate ? worst.rate - best.rate : 0;

  if (!loading && merged.length === 0 && !hotelKey && !hotelName) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-gray-900 font-bold text-base">OTA最安ランキング</h3>
        <p className="text-gray-400 text-xs mt-0.5">複数の予約サイトの価格を比較（1泊・USD）</p>
      </div>

      {loading && merged.length === 0 && (
        <div className="px-5 py-8 flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-gray-400 text-sm">価格を取得中...</span>
        </div>
      )}

      {merged.length > 0 && (
        <div>
          {best && savings > 0 && (
            <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 text-sm font-bold">{best.otaName}</span>
                  <span className="text-emerald-500 bg-emerald-100 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">最安</span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-700 text-xl font-bold">${best.rate.toLocaleString()}</span>
                  <span className="text-emerald-500 text-xs font-normal">/泊</span>
                </div>
              </div>
              <p className="text-emerald-500 text-xs mt-1">
                最高値より <span className="font-semibold">${savings.toLocaleString()}</span> お得
                （{Math.round((savings / worst!.rate) * 100)}%OFF）
              </p>
            </div>
          )}

          <div className="divide-y divide-gray-50">
            {merged.map((entry, i) => {
              const isBest = i === 0 && merged.length > 1;
              const href = entry.link || fallbackOtaLink(entry.otaName, hotelName, checkin, checkout, adults);
              return (
                <a
                  key={entry.otaName + entry.source}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-gray-50 ${isBest ? 'bg-emerald-50/50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs w-5 text-center font-semibold rounded-full py-0.5 ${
                      isBest ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {i + 1}
                    </span>
                    <span className={`text-sm ${isBest ? 'text-gray-900 font-semibold' : 'text-gray-700'}`}>
                      {entry.otaName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className={`text-sm font-bold ${isBest ? 'text-emerald-600' : 'text-gray-900'}`}>
                        ${entry.rate.toLocaleString()}
                      </span>
                      {entry.rateWithTax > entry.rate && (
                        <span className="text-gray-300 text-[10px] ml-1.5">税込${entry.rateWithTax.toLocaleString()}</span>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </a>
              );
            })}
          </div>

          {loading && (
            <div className="px-5 py-2 border-t border-gray-50 flex items-center gap-2">
              <div className="w-2.5 h-2.5 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
              <span className="text-gray-400 text-[11px]">追加データを取得中...</span>
            </div>
          )}

          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 space-y-1">
            <p className="text-gray-400 text-[10px] text-center">
              税抜1泊あたり（USD）/ 税込価格は各行右側に表示
            </p>
            <p className="text-amber-500 text-[10px] text-center">
              ※ 価格は参考値です。在庫状況や最終価格はリンク先でご確認ください
            </p>
          </div>
        </div>
      )}

      {!loading && merged.length === 0 && (
        <div className="px-5 py-8 text-center">
          <p className="text-gray-400 text-sm">価格データを取得できませんでした。</p>
        </div>
      )}
    </div>
  );
}
