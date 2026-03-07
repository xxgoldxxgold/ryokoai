'use client';

import { useState } from 'react';

interface PriceInfo { provider: string; price: number; link: string; }
interface Hotel { title: string; thumbnail: string; address: string; rating: number; reviews: number; prices: PriceInfo[]; priceRange: string; }

async function api(body: Record<string, unknown>) {
  const res = await fetch('/api/proxy-scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
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
  const [statusMsg, setStatusMsg] = useState('');

  const currencies = ['JPY', 'USD', 'IDR', 'THB', 'VND', 'KRW', 'EUR'];
  const sym = (c: string) => ({ JPY: '¥', USD: '$', IDR: 'Rp', THB: '฿', VND: '₫', KRW: '₩', EUR: '€' }[c] || c + ' ');

  const handleSearch = async () => {
    if (!hotelName.trim()) { setError('ホテル名を入力してください'); return; }
    setLoading(true); setError(''); setHotels([]); setElapsed(0); setStatusMsg('起動中...');
    const start = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);

    try {
      // 1. Start run
      const startData = await api({ hotelName, checkIn: checkin, checkOut: checkout, currency, adults: 2 });
      if (startData.error) { setError(startData.error); return; }
      const { runId, datasetId } = startData;

      // 2. Poll status from frontend
      setStatusMsg('スクレイピング中...');
      let status = 'RUNNING';
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const statusData = await api({ action: 'status', runId });
        status = statusData.status;
        if (statusData.statusMessage) setStatusMsg(statusData.statusMessage);
        if (status === 'SUCCEEDED' || status === 'FAILED' || status === 'ABORTED') break;
      }

      if (status !== 'SUCCEEDED') {
        setError(`スクレイピングが失敗しました (${status})`);
        return;
      }

      // 3. Get results
      setStatusMsg('結果を取得中...');
      const resultData = await api({ action: 'results', datasetId });
      setHotels(resultData.hotels || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '通信エラー');
    } finally {
      clearInterval(timer); setLoading(false); setStatusMsg('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gradient-to-r from-blue-700 to-blue-900 p-4 text-white shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">🏨 Hotel Price <span className="text-yellow-400">Scanner</span></h1>
          <span className="text-xs bg-blue-800/50 px-3 py-1 rounded-full border border-blue-400/50">複数サイトの価格を一括比較</span>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">ホテル名 / 地域</label>
              <input type="text" value={hotelName} onChange={e => setHotelName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="例: AYANA Resort Bali, Marina Bay Sands..." />
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
                  {currencies.map(c => <option key={c} value={c}>{c} ({sym(c)})</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <button onClick={handleSearch} disabled={loading}
          className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg mb-6 text-lg">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {statusMsg} ({elapsed}秒)
            </span>
          ) : '価格を検索'}
        </button>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">{error}</div>}

        {hotels.length > 0 && (
          <div className="space-y-6">
            {hotels.map((h, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {h.thumbnail && (
                    <div className="md:w-56 h-44 md:h-auto flex-shrink-0">
                      <img src={h.thumbnail} alt={h.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-lg">{h.title}</h3>
                      {h.rating > 0 && (
                        <div className="flex-shrink-0 text-center">
                          <div className={`text-white text-sm font-bold px-2.5 py-1 rounded-lg ${
                            h.rating >= 4.5 ? 'bg-green-600' : h.rating >= 4 ? 'bg-blue-600' : 'bg-gray-500'
                          }`}>{h.rating}</div>
                          <p className="text-[10px] text-gray-400 mt-0.5">{h.reviews?.toLocaleString()}件</p>
                        </div>
                      )}
                    </div>
                    {h.address && <p className="text-xs text-gray-500 mb-3">{h.address}</p>}

                    {h.prices && h.prices.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">予約サイト別 価格比較</p>
                        {h.prices.map((p, j) => (
                          <a key={j} href={p.link} target="_blank" rel="noopener noreferrer"
                            className={`flex items-center justify-between px-4 py-2.5 rounded-lg border transition-all hover:shadow-md ${
                              j === 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'
                            }`}>
                            <div className="flex items-center gap-2">
                              {j === 0 && <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">最安</span>}
                              <span className="text-sm font-medium">{p.provider}</span>
                            </div>
                            <span className={`font-bold text-lg ${j === 0 ? 'text-red-600' : 'text-gray-700'}`}>
                              {sym(currency)}{p.price?.toLocaleString()}
                            </span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">価格情報なし</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="text-center py-10 text-gray-400 text-xs">
        &copy; 2026 Hotel Price Scanner - Google Hotels経由で価格比較
      </footer>
    </div>
  );
}
