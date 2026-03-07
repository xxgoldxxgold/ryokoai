'use client';

import { useState } from 'react';

interface Hotel {
  name?: string;
  url?: string;
  image?: string;
  address?: unknown;
  location?: unknown;
  rating?: number;
  reviewCount?: number;
  reviewScore?: number;
  pricePerRoomPerNight?: number;
  pricePerBook?: number;
  priceCurrency?: string;
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

export default function AgodaPricePage() {
  const [search, setSearch] = useState('AYANA Resort Bali');
  const [checkin, setCheckin] = useState('2026-05-10');
  const [checkout, setCheckout] = useState('2026-05-11');
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
      const startData = await api({ search, checkIn: checkin, checkOut: checkout });
      if (startData.error) { setError(startData.error); return; }
      const { runId, datasetId } = startData;

      setStatusMsg('Agodaからインドネシア価格を取得中...');
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
      const list = resultData.hotels || [];
      setHotels(list);
      if (list.length === 0) setError('該当するホテルが見つかりませんでした');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '通信エラー');
    } finally {
      clearInterval(timer); setLoading(false); setStatusMsg('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gradient-to-r from-purple-700 to-indigo-900 p-4 text-white shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Agoda <span className="text-yellow-400">ID価格</span></h1>
          <span className="text-xs bg-purple-800/50 px-3 py-1 rounded-full border border-purple-400/50">
            インドネシアIP経由
          </span>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">検索キーワード（地域・ホテル名）</label>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
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
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg mb-6 text-lg">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {statusMsg} ({elapsed}秒)
            </span>
          ) : 'インドネシア価格を取得'}
        </button>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">{error}</div>}

        {hotels.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">{hotels.length}件のホテルが見つかりました</p>
            {hotels.map((h, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  {h.image && (
                    <div className="sm:w-48 h-36 sm:h-auto flex-shrink-0">
                      <img src={h.image} alt={h.name || ''} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-base">{h.name || '名称不明'}</h3>
                      {Number(h.reviewScore || 0) > 0 && (
                        <div className="flex-shrink-0 text-center">
                          <div className={`text-white text-xs font-bold px-2 py-0.5 rounded-md ${
                            Number(h.reviewScore) >= 8.5 ? 'bg-green-600' : Number(h.reviewScore) >= 7 ? 'bg-blue-600' : 'bg-gray-500'
                          }`}>{h.reviewScore}</div>
                          {Number(h.reviewCount || 0) > 0 && (
                            <p className="text-[10px] text-gray-400 mt-0.5">{Number(h.reviewCount).toLocaleString()}件</p>
                          )}
                        </div>
                      )}
                    </div>
                    {str(h.address || h.location) && (
                      <p className="text-xs text-gray-500 mb-2">{str(h.address || h.location)}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      {h.pricePerRoomPerNight ? (
                        <div>
                          <span className="text-xl font-bold text-red-600">
                            {h.priceCurrency || ''} {h.pricePerRoomPerNight.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-400 ml-1">/泊</span>
                          {h.pricePerBook && h.pricePerBook !== h.pricePerRoomPerNight && (
                            <span className="text-xs text-gray-400 ml-2">
                              (合計 {h.priceCurrency || ''} {h.pricePerBook.toLocaleString()})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">価格なし</span>
                      )}
                      {h.url && (
                        <a href={h.url} target="_blank" rel="noopener noreferrer"
                          className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors flex-shrink-0">
                          Agoda
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
