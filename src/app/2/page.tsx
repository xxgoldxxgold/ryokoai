'use client';

import { useState } from 'react';

function str(v: unknown): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return Object.values(o).filter(x => typeof x === 'string' && x).join(', ');
  }
  return String(v);
}

interface Hotel {
  hotelName?: string;
  priceText?: string;
  rating?: string;
  reviewCount?: string;
  imageUrl?: string;
  agodaUrl?: string;
}

export default function AgodaPricePage() {
  const [hotelName, setHotelName] = useState('AYANA Resort Bali');
  const [checkin, setCheckin] = useState(() => new Date().toISOString().slice(0, 10));
  const [checkout, setCheckout] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);

  const handleSearch = async () => {
    if (!hotelName.trim()) { setError('ホテル名を入力してください'); return; }
    setLoading(true); setError(''); setHotels([]); setElapsed(0);
    const start = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);

    try {
      const res = await fetch('/api/agoda-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelName, checkIn: checkin, checkOut: checkout, country: 'id' }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else if (data.success && data.data?.hotels?.length > 0) {
        setHotels(data.data.hotels);
      } else {
        setError('ホテルが見つかりませんでした');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '通信エラー');
    } finally {
      clearInterval(timer); setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gradient-to-r from-blue-900 to-blue-950 p-4 text-white shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Agoda <span className="text-yellow-400">ID価格</span></h1>
          <span className="text-xs bg-blue-950/50 px-3 py-1 rounded-full border border-blue-600/50">
            インドネシアIP経由
          </span>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">ホテル名</label>
              <input type="text" value={hotelName} onChange={e => setHotelName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="例: AYANA Resort Bali" />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
            </div>
          </div>
        </div>

        <button onClick={handleSearch} disabled={loading}
          className="w-full bg-blue-800 hover:bg-blue-900 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg mb-6 text-lg">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              検索中... ({elapsed}秒)
            </span>
          ) : 'インドネシア価格を取得'}
        </button>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">{error}</div>}

        {hotels.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">{hotels.length}件のホテルが見つかりました</p>
            {hotels.map((h) => {
              const priceIDR = typeof h.priceText === 'string' ? parseInt(h.priceText.replace(/[^\d]/g, ''), 10) || 0 : 0;
              const priceJPY = priceIDR > 0 ? Math.round(priceIDR / 107) : 0;
              return (
                <div key={str(h.hotelName) || str(h.agodaUrl)} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    {h.imageUrl && (
                      <div className="sm:w-48 h-36 sm:h-auto flex-shrink-0">
                        <img src={h.imageUrl} alt={str(h.hotelName)} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 p-4">
                      <h3 className="font-bold text-base mb-2">{str(h.hotelName)}</h3>
                      <div className="flex items-center justify-between">
                        {priceJPY > 0 ? (
                          <div>
                            <span className="text-xl font-bold text-red-600">
                              ¥{priceJPY.toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-400 ml-1">/泊</span>
                            <p className="text-xs text-gray-400">IDR {priceIDR.toLocaleString()}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">価格なし</span>
                        )}
                        {h.agodaUrl && (
                          <a href={h.agodaUrl} target="_blank" rel="noopener noreferrer"
                            className="bg-blue-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-900 transition-colors flex-shrink-0">
                            Agoda
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
