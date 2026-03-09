'use client';

import { useEffect, useState, useRef } from 'react';
interface PriceEntry {
  source: string;
  link: string | null;
  rate: number;
  rateWithTax: number;
  from: 'serpapi' | 'dataforseo' | 'both';
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
  if (n.includes('trip') && !n.includes('tripadvisor')) return 'trip';
  if (n.includes('expedia')) return 'expedia';
  if (n.includes('hotels') && !n.includes('hotelscombined')) return 'hotels';
  if (n.includes('hotelscombined')) return 'hotelscombined';
  if (n.includes('vio')) return 'vio';
  if (n.includes('priceline')) return 'priceline';
  if (n.includes('super')) return 'super';
  if (n.includes('kayak')) return 'kayak';
  if (n.includes('travelocity')) return 'travelocity';
  if (n.includes('orbitz')) return 'orbitz';
  if (n.includes('tripadvisor')) return 'tripadvisor';
  if (n.includes('wego')) return 'wego';
  return n;
}

function dedup(entries: PriceEntry[]): PriceEntry[] {
  const seen = new Set<string>();
  const result: PriceEntry[] = [];
  for (const p of entries) {
    const key = normalizeOtaName(p.source);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(p);
  }
  return result;
}

export default function UnifiedPriceRanking({ hotelName, hotelKey, checkin, checkout, adults, rooms }: Props) {
  const [prices, setPrices] = useState<PriceEntry[]>([]);
  const [serpDone, setSerpDone] = useState(false);
  const [dfsDone, setDfsDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const serpRef = useRef<PriceEntry[]>([]);
  const prevParamsRef = useRef('');

  const paramsKey = `${hotelName}|${checkin}|${checkout}|${adults}`;
  const cacheKey = `ryoko_prices_${paramsKey}`;

  useEffect(() => {
    if (!hotelName || !checkin || !checkout) return;
    if (prevParamsRef.current === paramsKey) return;
    prevParamsRef.current = paramsKey;

    // Restore cached prices instantly to avoid flicker
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as PriceEntry[];
        setPrices(parsed);
        serpRef.current = parsed;
        setLoading(false);
      } else {
        setPrices([]);
        setLoading(true);
      }
    } catch {
      setPrices([]);
      setLoading(true);
    }

    setSerpDone(false);
    setDfsDone(false);
    serpRef.current = [];

    // Fetch Xotelo (fast, uses TripAdvisor hotel_key) + SerpAPI in parallel
    const xoteloPromise = hotelKey
      ? fetch(`/api/hotel-rates?hotel_key=${encodeURIComponent(hotelKey)}&checkin=${checkin}&checkout=${checkout}&currency=JPY&adults=${adults}`)
          .then(r => r.json())
          .then(data => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const raw = (data.rates || []).filter((r: any) => r.rate > 0);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return raw.map((r: any) => ({
              source: r.name || r.code, link: null, rate: r.rate, rateWithTax: r.rate + (r.tax || 0), from: 'serpapi' as const,
            })) as PriceEntry[];
          })
          .catch(() => [] as PriceEntry[])
      : Promise.resolve([] as PriceEntry[]);

    const serpPromise = fetch(`https://vpn.ryokoai.com/hotel-serpapi.php?q=${encodeURIComponent(hotelName)}&checkin=${checkin}&checkout=${checkout}&adults=${adults}&currency=JPY`)
      .then(r => r.json())
      .then(data => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = (data.prices || []).filter((p: any) => p.rate > 0);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return raw.map((p: any) => ({
          source: p.source, link: p.link, rate: p.rate, rateWithTax: p.rateWithTax || 0, from: 'serpapi' as const,
        })) as PriceEntry[];
      })
      .catch(() => [] as PriceEntry[]);

    Promise.all([xoteloPromise, serpPromise])
      .then(([xoteloPrices, serpPrices]) => {
        // Merge: SerpAPI prices take priority (have links), Xotelo fills gaps
        const merged: PriceEntry[] = [...serpPrices];
        const serpOtas = new Set(serpPrices.map(p => normalizeOtaName(p.source)));
        for (const xp of xoteloPrices) {
          const key = normalizeOtaName(xp.source);
          if (!serpOtas.has(key)) {
            merged.push(xp);
          }
        }
        const d = dedup(merged);
        d.sort((a, b) => a.rate - b.rate);
        serpRef.current = d;
        setPrices(d);
        setLoading(false);
        try { sessionStorage.setItem(cacheKey, JSON.stringify(d)); } catch {}
      })
      .catch(() => setLoading(false))
      .finally(() => setSerpDone(true));

    // Fetch DataForSEO (slow) — merge into existing on arrival
    fetch(`https://vpn.ryokoai.com/hotel-prices.php?q=${encodeURIComponent(hotelName)}&checkin=${checkin}&checkout=${checkout}&adults=${adults}`)
      .then(r => r.json())
      .then(data => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = (data.prices || []).filter((p: any) => p.price > 0);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dfsEntries: PriceEntry[] = raw.map((p: any) => ({
          source: p.source, link: p.link, rate: p.price, rateWithTax: 0, from: 'dataforseo' as const,
        }));
        const dfsDedup = dedup(dfsEntries);

        // Only update existing OTAs if DFS has a cheaper price — no new items, no reorder
        const serp = serpRef.current;
        if (serp.length === 0) return;

        const dfsMap = new Map<string, PriceEntry>();
        for (const p of dfsDedup) dfsMap.set(normalizeOtaName(p.source), p);

        let changed = false;
        const updated = serp.map(p => {
          const key = normalizeOtaName(p.source);
          const dfs = dfsMap.get(key);
          if (dfs && dfs.rate < p.rate) {
            changed = true;
            return { ...p, rate: dfs.rate, link: dfs.link || p.link, from: 'both' as const };
          }
          return p;
        });

        if (changed) {
          setPrices(updated);
        }
      })
      .catch(() => {})
      .finally(() => setDfsDone(true));
  }, [paramsKey, hotelName, checkin, checkout, adults]);

  const best = prices.length > 0 ? prices[0] : null;
  const worst = prices.length > 1 ? prices[prices.length - 1] : null;
  const savings = best && worst && worst.rate > best.rate ? worst.rate - best.rate : 0;

  if (!loading && prices.length === 0 && !hotelName) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="text-gray-900 font-bold text-base">予約サイト最安ランキング</h3>
          {!dfsDone && (
            <span className="flex items-center gap-1 text-[10px] text-blue-700">
              <span className="w-2.5 h-2.5 border border-blue-1000 border-t-blue-700 rounded-full animate-spin" />
              追加取得中
            </span>
          )}
        </div>
        <p className="text-gray-400 text-xs mt-0.5">複数の予約サイトの価格を比較（1泊・円）</p>
      </div>

      {loading && (
        <div className="px-5 py-8 flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-700 rounded-full animate-spin" />
          <span className="text-gray-400 text-sm">価格を取得中...</span>
        </div>
      )}

      {prices.length > 0 && (
        <div>
          {best && savings > 0 && best.link && (
            <a href={best.link} target="_blank" rel="noopener noreferrer" className="block bg-emerald-50 px-5 py-3 border-b border-emerald-100 hover:bg-emerald-100/60 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 text-sm font-bold">{best.source}</span>
                  <span className="text-emerald-500 bg-emerald-100 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">最安</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-emerald-700 text-xl font-bold">¥{best.rate.toLocaleString()}</span>
                    <span className="text-emerald-500 text-xs font-normal">/泊</span>
                  </div>
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <p className="text-emerald-500 text-xs mt-1">
                最高値より <span className="font-semibold">¥{savings.toLocaleString()}</span> お得
                （{Math.round((savings / worst!.rate) * 100)}%OFF）
              </p>
            </a>
          )}

          <div className="divide-y divide-gray-50">
            {prices.map((entry, i) => {
              const isBest = i === 0 && prices.length > 1;
              const otaKey = normalizeOtaName(entry.source);
              const inner = (
                <div className={`flex items-center justify-between px-5 py-3.5 transition-all duration-300 hover:bg-gray-50 ${isBest ? 'bg-emerald-50/50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs w-5 text-center font-semibold rounded-full py-0.5 ${
                      isBest ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {i + 1}
                    </span>
                    <span className={`text-sm ${isBest ? 'text-gray-900 font-semibold' : 'text-gray-700'}`}>
                      {entry.source}
                    </span>
                    {entry.from === 'dataforseo' && (
                      <span className="text-[9px] text-blue-600 bg-blue-100 px-1 py-0.5 rounded">+DFS</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className={`text-sm font-bold ${isBest ? 'text-emerald-600' : 'text-gray-900'}`}>
                        ¥{entry.rate.toLocaleString()}
                      </span>
                      {entry.rateWithTax > entry.rate && (
                        <span className="text-gray-300 text-[10px] ml-1.5">税込¥{entry.rateWithTax.toLocaleString()}</span>
                      )}
                    </div>
                    {entry.link && (
                      <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </div>
              );

              return entry.link ? (
                <a key={otaKey} href={entry.link} target="_blank" rel="noopener noreferrer" className="block animate-[fadeIn_0.3s_ease-in]">
                  {inner}
                </a>
              ) : (
                <div key={otaKey} className="animate-[fadeIn_0.3s_ease-in]">{inner}</div>
              );
            })}
          </div>

          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-gray-400 text-[10px] text-center">
              SerpAPI + DataForSEO経由・1泊あたり（JPY）
            </p>
          </div>
        </div>
      )}

      {serpDone && dfsDone && prices.length === 0 && (
        <div className="px-5 py-8 text-center">
          <p className="text-gray-400 text-sm">価格データを取得できませんでした。</p>
        </div>
      )}
    </div>
  );
}
