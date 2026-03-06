'use client';

import { useEffect, useState } from 'react';
import { useUsdToJpy, toJpy } from '@/lib/useExchangeRate';

interface AmadeusOffer {
  roomType: string;
  bedType: string;
  description: string;
  price: number;
  currency: string;
  boardType: string;
}

interface AmadeusHotelResult {
  hotelName: string;
  hotelId: string;
  offers: AmadeusOffer[];
}

interface Props {
  hotelName: string;
  checkin: string;
  checkout: string;
  adults: number;
  cityCode?: string;
  lat?: number;
  lng?: number;
}

export default function AmadeusPricePanel({ hotelName, checkin, checkout, adults, cityCode, lat, lng }: Props) {
  const [results, setResults] = useState<AmadeusHotelResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const jpyRate = useUsdToJpy();

  useEffect(() => {
    if (!hotelName || !checkin || !checkout) return;
    if (!cityCode && (!lat || !lng)) return;

    setLoading(true);
    setResults([]);
    setError(null);

    const params = new URLSearchParams({
      hotelName,
      checkin,
      checkout,
      adults: adults.toString(),
    });
    if (cityCode) params.set('cityCode', cityCode);
    if (lat && lng) {
      params.set('lat', lat.toString());
      params.set('lng', lng.toString());
    }

    fetch(`/api/amadeus-hotels?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        setResults(data.offers || []);
      })
      .catch(() => setError('Amadeus API error'))
      .finally(() => setLoading(false));
  }, [hotelName, checkin, checkout, adults, cityCode, lat, lng]);

  if (!cityCode && !lat) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="text-gray-900 font-bold text-base">Amadeus GDS価格</h3>
          <span className="text-[10px] font-medium px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded-full">TEST</span>
        </div>
        <p className="text-gray-400 text-xs mt-0.5">GDS直結の卸売価格（1泊・USD）</p>
      </div>

      {loading && (
        <div className="px-5 py-8 flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
          <span className="text-gray-400 text-sm">Amadeus価格を取得中...</span>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div>
          {results.map((hotel) => (
            <div key={hotel.hotelId}>
              <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-gray-700 text-sm font-medium">{hotel.hotelName}</span>
                <span className="text-gray-300 text-xs ml-2">({hotel.hotelId})</span>
              </div>
              <div className="divide-y divide-gray-50">
                {hotel.offers.sort((a, b) => a.price - b.price).map((offer, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-700 text-sm">{offer.roomType}</span>
                      {offer.bedType && (
                        <span className="text-gray-400 text-xs ml-1.5">({offer.bedType})</span>
                      )}
                      {offer.boardType && (
                        <span className="text-gray-400 text-xs ml-1.5">{offer.boardType}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold ${i === 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                        ${offer.price.toLocaleString()} {offer.currency !== 'USD' && offer.currency}
                      </span>
                      {jpyRate && offer.currency === 'USD' && (
                        <span className="text-gray-400 text-[11px] ml-1.5">{toJpy(offer.price, jpyRate)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-gray-400 text-[10px] text-center">
              Amadeus GDS (テスト環境) ・チェーンホテルのみ対応{jpyRate && ` / 1USD≈¥${Math.round(jpyRate)}`}
            </p>
          </div>
        </div>
      )}

      {!loading && results.length === 0 && error && (
        <div className="px-5 py-8 text-center">
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      )}

      {!loading && results.length === 0 && !error && (
        <div className="px-5 py-8 text-center">
          <p className="text-gray-400 text-sm">Amadeus GDSに該当ホテルがありません。</p>
        </div>
      )}
    </div>
  );
}
