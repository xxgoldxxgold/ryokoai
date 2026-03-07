'use client';

import { useState } from 'react';

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
  const [hotelName, setHotelName] = useState('AYANA Resort Bali');
  const [checkin, setCheckin] = useState('2026-05-10');
  const [checkout, setCheckout] = useState('2026-05-11');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');

  const handleSearch = async () => {
    if (!hotelName.trim()) { setError('ホテル名を入力してください'); return; }
    setLoading(true); setError(''); setResult(null); setElapsed(0); setStatusMsg('起動中...');
    const start = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);

    try {
      const startData = await api({ search: hotelName, checkIn: checkin, checkOut: checkout });
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
      const resultData = await api({ action: 'results', datasetId, searchName: hotelName });
      setResult(resultData.hotel || null);
      if (!resultData.hotel) setError('該当するホテルが見つかりませんでした');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '通信エラー');
    } finally {
      clearInterval(timer); setLoading(false); setStatusMsg('');
    }
  };

  const pricePerNight = result ? (() => {
    const p = result.pricePerRoomPerNight;
    if (!p) return null;
    return typeof p === 'number' ? p : parseFloat(String(p).replace(/[^0-9.]/g, ''));
  })() : null;

  const priceTotal = result ? (() => {
    const p = result.pricePerBook;
    if (!p) return null;
    return typeof p === 'number' ? p : parseFloat(String(p).replace(/[^0-9.]/g, ''));
  })() : null;

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

      <main className="container mx-auto px-4 py-8 max-w-lg">
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

        {result && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {str(result.image || result.thumbnail) && (
              <div className="h-48 w-full">
                <img src={str(result.image || result.thumbnail)} alt={str(result.name || result.hotelName || result.title)}
                  className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-6">
              <h3 className="font-bold text-xl mb-1">
                {str(result.name || result.hotelName || result.title) || 'ホテル名不明'}
              </h3>
              {str(result.address || result.location) && (
                <p className="text-sm text-gray-500 mb-4">{str(result.address || result.location)}</p>
              )}

              {Number(result.rating || result.reviewScore || 0) > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className={`text-white text-sm font-bold px-2.5 py-1 rounded-lg ${
                    Number(result.rating || result.reviewScore) >= 8.5 ? 'bg-green-600' :
                    Number(result.rating || result.reviewScore) >= 7 ? 'bg-blue-600' : 'bg-gray-500'
                  }`}>{str(result.rating || result.reviewScore)}</div>
                  {Number(result.reviews || result.reviewCount || 0) > 0 && (
                    <span className="text-xs text-gray-400">{Number(result.reviews || result.reviewCount).toLocaleString()}件のレビュー</span>
                  )}
                </div>
              )}

              <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 text-center">
                <p className="text-xs text-purple-600 font-medium mb-2">インドネシアからのAgoda価格</p>
                {pricePerNight ? (
                  <>
                    <p className="text-3xl font-bold text-red-600">
                      {str(result.priceCurrency)} {pricePerNight.toLocaleString()}
                      <span className="text-sm text-gray-400 font-normal ml-1">/泊</span>
                    </p>
                    {priceTotal && priceTotal !== pricePerNight && (
                      <p className="text-sm text-gray-500 mt-1">
                        合計: {str(result.priceCurrency)} {priceTotal.toLocaleString()}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-400">価格情報を取得できませんでした</p>
                )}
              </div>

              {str(result.url || result.link) && (
                <a href={str(result.url || result.link)} target="_blank" rel="noopener noreferrer"
                  className="block mt-4 text-center bg-purple-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors">
                  Agodaで予約ページを開く
                </a>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
