'use client';

import { useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(false);
  const jpyRate = useUsdToJpy();

  useEffect(() => {
    if (!hotelName || !checkin || !checkout) return;
    setLoading(true);
    setPrices([]);
    setHotelTitle(null);

    fetch(`/api/dataforseo-hotels?q=${encodeURIComponent(hotelName)}&checkin=${checkin}&checkout=${checkout}&adults=${adults}`)
      .then(r => r.json())
      .then(data => {
        setPrices(data.prices || []);
        setHotelTitle(data.hotel_name || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hotelName, checkin, checkout, adults]);

  const best = prices.length > 0 ? prices[0] : null;
  const worst = prices.length > 1 ? prices[prices.length - 1] : null;
  const savings = best && worst && worst.price > best.price ? worst.price - best.price : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="text-gray-900 font-bold text-base">DataForSEO価格比較</h3>
          <span className="text-[10px] font-medium px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full">広範囲</span>
        </div>
        <p className="text-gray-400 text-xs mt-0.5">
          {hotelTitle ? `${hotelTitle} — ` : ''}Google Hotels経由の全OTA価格（1泊・USD）
        </p>
      </div>

      {loading && (
        <div className="px-5 py-8 flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-gray-400 text-sm">価格を取得中...</span>
        </div>
      )}

      {!loading && prices.length > 0 && (
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
            {prices.map((entry, i) => {
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

          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-gray-400 text-[10px] text-center">
              DataForSEO経由・1泊あたり（USD）{jpyRate && ` / 1USD≈¥${Math.round(jpyRate)}`}
            </p>
          </div>
        </div>
      )}

      {!loading && prices.length === 0 && (
        <div className="px-5 py-8 text-center">
          <p className="text-gray-400 text-sm">価格データを取得できませんでした。</p>
        </div>
      )}
    </div>
  );
}
