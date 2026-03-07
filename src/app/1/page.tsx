'use client';

import { useState } from 'react';

interface Hotel {
  propertyId: number;
  name: string;
  url: string;
  propertyType: string;
  image: string;
  address: { country: string; city: string; area: string };
  rating: number;
  reviewCount: number;
  reviewScore: number;
  pricePerRoomPerNight: number;
  pricePerBook: number;
  priceCurrency: string;
}

export default function HotelScrapePage() {
  const [hotelName, setHotelName] = useState('AYANA Resort Bali');
  const [checkin, setCheckin] = useState('2026-05-10');
  const [checkout, setCheckout] = useState('2026-05-11');
  const [currency, setCurrency] = useState('JPY');
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);

  const currencies = ['JPY', 'USD', 'IDR', 'THB', 'VND', 'KRW', 'EUR'];

  const currencySymbol = (c: string) => {
    const map: Record<string, string> = { JPY: '¥', USD: '$', IDR: 'Rp', THB: '฿', VND: '₫', KRW: '₩', EUR: '€' };
    return map[c] || c;
  };

  const formatPrice = (price: number, curr: string) => {
    return currencySymbol(curr) + price.toLocaleString();
  };

  const handleSearch = async () => {
    if (!hotelName.trim()) {
      setError('ホテル名を入力してください');
      return;
    }
    setLoading(true);
    setError('');
    setHotels([]);
    setElapsed(0);
    const start = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);

    try {
      const res = await fetch('/api/proxy-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelName, checkIn: checkin, checkOut: checkout, currency, adults: 2 }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setHotels(data.hotels || []);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '通信エラー');
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gradient-to-r from-blue-700 to-blue-900 p-4 text-white shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tighter">
            🏨 Hotel Price <span className="text-yellow-400">Scanner</span>
          </h1>
          <span className="text-xs bg-blue-800/50 px-3 py-1 rounded-full border border-blue-400/50">
            Agoda APIでリアルタイム価格取得
          </span>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">ホテル名 / 地域</label>
              <input
                type="text"
                value={hotelName}
                onChange={e => setHotelName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="例: AYANA Resort Bali, Marina Bay Sands..."
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">チェックイン</label>
                <input type="date" value={checkin} onChange={e => setCheckin(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">チェックアウト</label>
                <input type="date" value={checkout} onChange={e => setCheckout(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">通貨</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {currencies.map(c => (
                    <option key={c} value={c}>{c} ({currencySymbol(c)})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={loading}
          className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg mb-6 text-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Agodaから価格取得中... {elapsed}秒
            </span>
          ) : (
            'Agodaで価格を検索'
          )}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">{error}</div>
        )}

        {hotels.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-700">{hotels.length}件の結果</h2>
            {hotels.map((h, i) => (
              <div key={h.propertyId || i} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">
                {h.image && (
                  <div className="md:w-48 h-40 md:h-auto flex-shrink-0">
                    <img src={h.image} alt={h.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-base">{h.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {h.address?.area && `${h.address.area}, `}{h.address?.city}
                        </p>
                      </div>
                      {h.reviewScore > 0 && (
                        <div className="flex-shrink-0 text-center">
                          <div className={`text-white text-sm font-bold px-2 py-1 rounded-lg ${
                            h.reviewScore >= 8.5 ? 'bg-green-600' : h.reviewScore >= 7 ? 'bg-blue-600' : 'bg-gray-500'
                          }`}>
                            {h.reviewScore}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">{h.reviewCount?.toLocaleString()}件</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: h.rating || 0 }).map((_, j) => (
                        <span key={j} className="text-yellow-400 text-xs">★</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-end justify-between mt-3">
                    <span className="text-xs text-gray-400">{h.propertyType}</span>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">1泊あたり</p>
                      <p className="text-2xl font-black text-red-600">
                        {formatPrice(h.pricePerRoomPerNight, h.priceCurrency)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="text-center py-10 text-gray-400 text-xs">
        &copy; 2026 Hotel Price Scanner - Powered by Apify + Agoda
      </footer>
    </div>
  );
}
