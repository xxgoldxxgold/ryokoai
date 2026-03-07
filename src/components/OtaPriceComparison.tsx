'use client';

import { useEffect, useState } from 'react';

interface Rate {
  code: string;
  name: string;
  rate: number;
  tax: number;
}

interface OtaPriceComparisonProps {
  hotelKey: string;
  checkin: string;
  checkout: string;
  adults: number;
  currency: string;
}

export default function OtaPriceComparison({ hotelKey, checkin, checkout, adults, currency }: OtaPriceComparisonProps) {
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hotelKey) return;

    setLoading(true);
    setError(null);
    setRates([]);

    fetch(
      `/api/hotel-rates?hotel_key=${encodeURIComponent(hotelKey)}&checkin=${checkin}&checkout=${checkout}&currency=${currency}&adults=${adults}`
    )
      .then((res) => res.json())
      .then((data) => {
        const ratesList = data.rates || [];
        if (ratesList.length > 0) {
          const sorted = [...ratesList].sort((a: Rate, b: Rate) => (a.rate + a.tax) - (b.rate + b.tax));
          setRates(sorted);
        } else {
          setError('price_not_found');
        }
      })
      .catch(() => {
        setError('fetch_error');
      })
      .finally(() => setLoading(false));
  }, [hotelKey, checkin, checkout, adults, currency]);

  if (!hotelKey) return null;

  if (loading) {
    return (
      <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
          <span className="text-white/50 text-sm">予約サイト価格を取得中...</span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || rates.length === 0) {
    return (
      <div className="bg-[#1E293B] border border-white/5 rounded-xl px-5 py-4">
        <p className="text-white/40 text-sm">
          価格データは取得できませんでした。下のリンクから各サイトで直接ご確認ください。
        </p>
      </div>
    );
  }

  const cheapest = rates[0].rate + rates[0].tax;
  const mostExpensive = rates[rates.length - 1].rate + rates[rates.length - 1].tax;
  const diff = mostExpensive - cheapest;
  const diffPercent = mostExpensive > 0 ? Math.round((diff / mostExpensive) * 100) : 0;
  const currSymbol = currency === 'JPY' ? '¥' : '$';

  return (
    <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5 space-y-4">
      <h3 className="text-white font-bold text-sm flex items-center gap-2">
        <span className="text-base">📊</span>
        予約サイト価格比較（リアルタイム）
      </h3>

      <div className="space-y-2">
        {rates.map((rate, i) => {
          const total = rate.rate + rate.tax;
          const isCheapest = i === 0;
          const medals = ['🥇', '🥈', '🥉'];
          const medal = i < 3 ? medals[i] : '　';

          return (
            <div
              key={rate.code}
              className={`flex items-center justify-between px-4 py-3 rounded-lg ${
                isCheapest
                  ? 'bg-emerald-500/10 border border-emerald-500/20'
                  : 'bg-white/[0.02] border border-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-base">{medal}</span>
                <span className={`text-sm ${isCheapest ? 'text-white font-medium' : 'text-white/60'}`}>
                  {rate.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${isCheapest ? 'text-emerald-400' : 'text-white/80'}`}>
                  {currSymbol}{total.toLocaleString()}<span className="text-xs font-normal text-white/30">/泊</span>
                </span>
                {isCheapest && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-medium">
                    最安
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {diff > 0 && (
        <div className="flex items-center justify-center gap-2 pt-1">
          <span className="text-xs text-indigo-400">
            💡 OTA間の価格差: {currSymbol}{diff.toLocaleString()} ({diffPercent}%)
          </span>
        </div>
      )}

      <p className="text-white/20 text-[10px] text-center">
        ※ 税込み1泊あたりの料金。Xotelo経由で取得。
      </p>
    </div>
  );
}
