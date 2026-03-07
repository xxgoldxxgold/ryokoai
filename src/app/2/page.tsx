'use client';

import { useState } from 'react';

interface Hotel {
  name?: string;
  hotelName?: string;
  title?: string;
  image?: string;
  thumbnail?: string;
  address?: string;
  location?: string;
  rating?: number;
  reviewScore?: number;
  reviews?: number;
  reviewCount?: number;
  price?: number | string;
  originalPrice?: number | string;
  currency?: string;
  url?: string;
  link?: string;
  [key: string]: unknown;
}

async function api(body: Record<string, unknown>) {
  const res = await fetch('/api/agoda-scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export default function AgodaScrapePage() {
  const [search, setSearch] = useState('Bali');
  const [checkin, setCheckin] = useState('2026-05-10');
  const [checkout, setCheckout] = useState('2026-05-11');
  const [maxItems, setMaxItems] = useState(5);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');

  const handleSearch = async () => {
    if (!search.trim()) { setError('検索キーワードを入力してください'); return; }
    setLoading(true); setError(''); setHotels([]); setElapsed(0); setStatusMsg('起動中...');
    const start = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);

    try {
      const startData = await api({ search, checkIn: checkin, checkOut: checkout, maxItems });
      if (startData.error) { setError(startData.error); return; }
      const { runId, datasetId } = startData;

      setStatusMsg('Agodaスクレイピング中...');
      let status = 'RUNNING';
      for (let i = 0; i < 120; i++) {
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

      setStatusMsg('結果を取得中...');
      const resultData = await api({ action: 'results', datasetId });
      setHotels(resultData.hotels || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '通信エラー');
    } finally {
      clearInterval(timer); setLoading(false); setStatusMsg('');
    }
  };

  const getPrice = (h: Hotel) => {
    const p = h.price || h.originalPrice;
    if (!p) return null;
    return typeof p === 'string' ? parseFloat(p.replace(/[^0-9.]/g, '')) : p;
  };

  const getName = (h: Hotel) => h.name || h.hotelName || h.title || '名称不明';
  const getRating = (h: Hotel) => h.rating || h.reviewScore || 0;
  const getReviews = (h: Hotel) => h.reviews || h.reviewCount || 0;
  const getImage = (h: Hotel) => h.image || h.thumbnail || '';
  const getAddress = (h: Hotel) => h.address || h.location || '';
  const getUrl = (h: Hotel) => h.url || h.link || '';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gradient-to-r from-purple-700 to-indigo-900 p-4 text-white shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Agoda Price <span className="text-yellow-400">Scanner</span></h1>
          <span className="text-xs bg-purple-800/50 px-3 py-1 rounded-full border border-purple-400/50">
            インドネシアIP経由・現地価格取得
          </span>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">検索キーワード（地域・ホテル名）</label>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="例: Bali, Tokyo, Marina Bay Sands..." />
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
                <label className="block text-sm font-medium text-gray-600 mb-1">最大件数</label>
                <select value={maxItems} onChange={e => setMaxItems(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {[3, 5, 10].map(n => <option key={n} value={n}>{n}件</option>)}
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-400">※ IPRoyalプロキシでインドネシアIPから接続し、現地価格を取得します（1回あたり上限$0.05）</p>
          </div>
        </div>

        <button onClick={handleSearch} disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg mb-6 text-lg">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {statusMsg} ({elapsed}秒)
            </span>
          ) : 'Agoda価格を検索'}
        </button>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">{error}</div>}

        {hotels.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">{hotels.length}件のホテルが見つかりました</p>
            {hotels.map((h, i) => {
              const price = getPrice(h);
              const rating = getRating(h);
              const image = getImage(h);
              const url = getUrl(h);
              return (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {image && (
                      <div className="md:w-56 h-44 md:h-auto flex-shrink-0">
                        <img src={image} alt={getName(h)} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-lg">{getName(h)}</h3>
                        {rating > 0 && (
                          <div className="flex-shrink-0 text-center">
                            <div className={`text-white text-sm font-bold px-2.5 py-1 rounded-lg ${
                              rating >= 8.5 ? 'bg-green-600' : rating >= 7 ? 'bg-blue-600' : 'bg-gray-500'
                            }`}>{rating}</div>
                            {getReviews(h) > 0 && (
                              <p className="text-[10px] text-gray-400 mt-0.5">{getReviews(h).toLocaleString()}件</p>
                            )}
                          </div>
                        )}
                      </div>
                      {getAddress(h) && <p className="text-xs text-gray-500 mb-3">{getAddress(h)}</p>}

                      <div className="flex items-center justify-between mt-3">
                        <div>
                          {price ? (
                            <div>
                              <span className="text-2xl font-bold text-red-600">
                                {h.currency || ''} {price.toLocaleString()}
                              </span>
                              <span className="text-xs text-gray-400 ml-1">/泊</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">価格情報なし</span>
                          )}
                        </div>
                        {url && (
                          <a href={url} target="_blank" rel="noopener noreferrer"
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                            Agodaで見る
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

      <footer className="text-center py-10 text-gray-400 text-xs">
        &copy; 2026 Agoda Price Scanner - インドネシアIP経由で現地価格を取得
      </footer>
    </div>
  );
}
