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
}

interface Props {
  hotelName: string;
  hotelKey: string | null;
  checkin: string;
  checkout: string;
  adults: number;
  rooms: number;
}

function normalizeOtaName(name: string): string {
  const n = name.toLowerCase().replace(/\.com$/, '').replace(/\s+/g, '');
  if (n.includes('booking')) return 'booking';
  if (n.includes('agoda')) return 'agoda';
  if (n.includes('trip')) return 'trip';
  if (n.includes('expedia')) return 'expedia';
  if (n.includes('hotels') && !n.includes('hotelscombined')) return 'hotels';
  if (n.includes('hotelscombined')) return 'hotelscombined';
  if (n.includes('vio')) return 'vio';
  if (n.includes('priceline')) return 'priceline';
  if (n.includes('super')) return 'super';
  if (n.includes('kayak')) return 'kayak';
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

  // Build merged list: for each OTA, pick the cheaper price from either source
  // Google Hotels links are always preferred (direct booking links)
  const googleMap = new Map<string, GooglePrice>();
  for (const p of googlePrices) {
    if (p.rate <= 0) continue;
    const key = normalizeOtaName(p.source);
    if (!googleMap.has(key)) googleMap.set(key, p);
  }

  const xoteloMap = new Map<string, XoteloRate>();
  for (const r of xoteloRates) {
    if (r.rate <= 0) continue;
    const key = normalizeOtaName(r.name);
    if (!xoteloMap.has(key)) xoteloMap.set(key, r);
  }

  const allKeys = new Set([...googleMap.keys(), ...xoteloMap.keys()]);
  const merged: UnifiedEntry[] = [];

  for (const key of allKeys) {
    const gp = googleMap.get(key);
    const xr = xoteloMap.get(key);

    if (gp && xr) {
      // Both sources have this OTA - pick cheaper rate, always use Google link
      if (xr.rate < gp.rate) {
        merged.push({ otaName: xr.name, rate: xr.rate, rateWithTax: xr.rate + xr.tax, link: gp.link });
      } else {
        merged.push({ otaName: gp.source, rate: gp.rate, rateWithTax: gp.rateWithTax, link: gp.link });
      }
    } else if (gp) {
      merged.push({ otaName: gp.source, rate: gp.rate, rateWithTax: gp.rateWithTax, link: gp.link });
    } else if (xr) {
      // Xotelo only - skip (no reliable link available)
    }
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
              return (
                <a
                  key={entry.otaName}
                  href={entry.link || '#'}
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

          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-gray-400 text-[10px] text-center">
              税抜1泊あたり（USD）/ 税込価格は各行右側に表示
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
