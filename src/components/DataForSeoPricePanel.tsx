'use client';

import { useEffect, useState, useRef } from 'react';
import { useUsdToJpy, toJpy } from '@/lib/useExchangeRate';

interface DfsPrice {
  source: string;
  price: number;
  currency: string;
  link: string | null;
  domain: string | null;
}

interface Props {
  hotelName: string;
  checkin: string;
  checkout: string;
  adults: number;
}

export default function DataForSeoPricePanel({ hotelName, checkin, checkout, adults }: Props) {
  const [prices, setPrices] = useState<DfsPrice[]>([]);
  const [hotelTitle, setHotelTitle] = useState<string | null>(null);
  const [basePrice, setBasePrice] = useState<number | null>(null);
  const [searching, setSearching] = useState(true);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevParams = useRef('');
  const jpyRate = useUsdToJpy();

  const paramsKey = `${hotelName}|${checkin}|${checkout}|${adults}`;
  const base = `/api/dataforseo-hotels?q=${encodeURIComponent(hotelName)}&checkin=${checkin}&checkout=${checkout}&adults=${adults}`;

  useEffect(() => {
    if (!hotelName || !checkin || !checkout) return;
    if (prevParams.current === paramsKey) return;
    prevParams.current = paramsKey;

    setSearching(true);
    setLoadingPrices(false);
    setPrices([]);
    setHotelTitle(null);
    setBasePrice(null);
    setError(null);

    const controller = new AbortController();

    // Phase 1: Find hotel + base price (~3-6s)
    fetch(`${base}&phase=search`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
          setSearching(false);
          return;
        }
        setHotelTitle(data.hotel_name || null);
        setBasePrice(data.base_price || null);
        setSearching(false);
        setLoadingPrices(true);

        // Phase 2: Get OTA prices (~10s)
        return fetch(`${base}&phase=prices&id=${encodeURIComponent(data.hotel_id)}`, { signal: controller.signal })
          .then(r => r.json())
          .then(priceData => {
            if (priceData.hotel_name) setHotelTitle(priceData.hotel_name);
            setPrices(priceData.prices || []);
            setLoadingPrices(false);
          });
      })
      .catch((e) => {
        if (e.name === 'AbortError') return;
        setError(e.message || 'ネットワークエラー');
        setSearching(false);
        setLoadingPrices(false);
      });

    return () => controller.abort();
  }, [paramsKey, hotelName, checkin, checkout, adults, base]);

  const [expanded, setExpanded] = useState(false);

  const best = prices.length > 0 ? prices[0] : null;
  const worst = prices.length > 1 ? prices[prices.length - 1] : null;
  const savings = best && worst && worst.price > best.price ? worst.price - best.price : 0;

  const loading = searching || loadingPrices;
  const showBasePrice = basePrice && basePrice > 0 && prices.length === 0;
  const visiblePrices = expanded ? prices : prices.slice(0, 5);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="text-gray-900 font-bold text-base">予約サイト価格比較</h3>
        </div>
        <p className="text-gray-400 text-xs mt-0.5">
          {hotelTitle ? `${hotelTitle} — ` : ''}Google Hotels経由の全予約サイト価格（1泊・USD）
        </p>
      </div>

      {searching && (
        <div className="px-5 py-8 flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-gray-400 text-sm">ホテルを検索中...</span>
        </div>
      )}

      {showBasePrice && (
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 text-sm">Google Hotels参考価格</span>
            <div>
              <span className="text-gray-900 text-xl font-bold">${basePrice.toLocaleString()}</span>
              <span className="text-gray-400 text-xs">/泊</span>
              {jpyRate && <span className="text-gray-400 text-xs ml-1.5">({toJpy(basePrice, jpyRate)})</span>}
            </div>
          </div>
          {loadingPrices && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <div className="w-3 h-3 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-gray-400 text-xs">各予約サイトの価格を比較中...</span>
            </div>
          )}
        </div>
      )}

      {prices.length > 0 && (
        <div>
          {best && savings > 0 && (
            <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 text-sm font-bold">{best.source}</span>
                  <span className="text-emerald-500 bg-emerald-100 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">最安</span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-700 text-xl font-bold">${best.price.toLocaleString()}</span>
                  <span className="text-emerald-500 text-xs font-normal">/泊</span>
                  {jpyRate && <span className="text-emerald-500 text-xs ml-1.5">({toJpy(best.price, jpyRate)})</span>}
                </div>
              </div>
              <p className="text-emerald-500 text-xs mt-1">
                最高値より <span className="font-semibold">${savings.toLocaleString()}{jpyRate && `（${toJpy(savings, jpyRate)}）`}</span> お得
                （{Math.round((savings / worst!.price) * 100)}%OFF）
              </p>
            </div>
          )}

          <div className="divide-y divide-gray-50">
            {visiblePrices.map((entry, i) => {
              const isBest = i === 0 && prices.length > 1;
              const inner = (
                <div className={`flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-gray-50 ${isBest ? 'bg-emerald-50/50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs w-5 text-center font-semibold rounded-full py-0.5 ${
                      isBest ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {i + 1}
                    </span>
                    <span className={`text-sm ${isBest ? 'text-gray-900 font-semibold' : 'text-gray-700'}`}>
                      {entry.source}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className={`text-sm font-bold ${isBest ? 'text-emerald-600' : 'text-gray-900'}`}>
                        ${entry.price.toLocaleString()}
                      </span>
                      {jpyRate && (
                        <span className="text-gray-400 text-[11px] ml-1.5">{toJpy(entry.price, jpyRate)}</span>
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
                <a key={entry.domain || entry.source} href={entry.link} target="_blank" rel="noopener noreferrer">
                  {inner}
                </a>
              ) : (
                <div key={entry.domain || entry.source}>{inner}</div>
              );
            })}
          </div>

          {!expanded && prices.length > 5 && (
            <button
              onClick={() => setExpanded(true)}
              className="w-full px-5 py-3 text-center text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors border-t border-gray-100"
            >
              他 {prices.length - 5}件の予約サイトを見る
            </button>
          )}

          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-gray-400 text-[10px] text-center">
              Google Hotels経由・1泊あたり（USD）・税別の場合あり{jpyRate && ` / 1USD≈¥${Math.round(jpyRate)}`}
            </p>
          </div>
        </div>
      )}

      {!loading && prices.length === 0 && !showBasePrice && (
        <div className="px-5 py-8 text-center">
          <p className="text-gray-400 text-sm">
            {error || '価格データを取得できませんでした。'}
          </p>
        </div>
      )}
    </div>
  );
}
