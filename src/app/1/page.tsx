'use client';

import { useState } from 'react';

const SAMPLE_HOTELS = [
  {
    name: 'アヤナ リゾート バリ',
    agoda: 'https://www.agoda.com/ayana-resort-bali/hotel/bali-id.html',
    booking: 'https://www.booking.com/hotel/id/ayana-resort-and-spa.html',
  },
  {
    name: 'マリーナベイサンズ',
    agoda: 'https://www.agoda.com/marina-bay-sands/hotel/singapore-sg.html',
    booking: 'https://www.booking.com/hotel/sg/marina-bay-sands.html',
  },
  {
    name: 'ザ・ペニンシュラ東京',
    agoda: 'https://www.agoda.com/the-peninsula-tokyo/hotel/tokyo-jp.html',
    booking: 'https://www.booking.com/hotel/jp/the-peninsula-tokyo.html',
  },
];

export default function HotelScrapePage() {
  const [selectedHotel, setSelectedHotel] = useState(0);
  const [checkin, setCheckin] = useState('2026-05-10');
  const [checkout, setCheckout] = useState('2026-05-11');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [prices, setPrices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleScrape = async (site: 'agoda' | 'booking') => {
    const hotel = SAMPLE_HOTELS[selectedHotel];
    const baseUrl = site === 'agoda' ? hotel.agoda : hotel.booking;

    const url = site === 'agoda'
      ? `${baseUrl}?checkIn=${checkin}&checkOut=${checkout}&rooms=1&adults=2&children=0&currency=JPY`
      : `${baseUrl}?checkin=${checkin}&checkout=${checkout}&group_adults=2&no_rooms=1&selected_currency=JPY`;

    setLoading(true);
    setError('');
    setScreenshot(null);
    setPrices([]);

    try {
      const res = await fetch('/api/proxy-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setScreenshot(data.screenshot);
        setTitle(data.title);
        setPrices(data.prices || []);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '通信エラー');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-700 p-4 text-white shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tighter">
            🏨 Hotel Price <span className="text-yellow-400">Scanner</span>
          </h1>
          <span className="text-sm bg-blue-800 px-3 py-1 rounded-full border border-blue-400">
            プロキシ経由で価格比較
          </span>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">ホテル選択</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {SAMPLE_HOTELS.map((h, i) => (
              <button
                key={i}
                onClick={() => setSelectedHotel(i)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedHotel === i
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {h.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">チェックイン</label>
              <input
                type="date"
                value={checkin}
                onChange={e => setCheckin(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">チェックアウト</label>
              <input
                type="date"
                value={checkout}
                onChange={e => setCheckout(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => handleScrape('agoda')}
            disabled={loading}
            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg"
          >
            {loading ? '取得中...' : 'Agodaで価格取得'}
          </button>
          <button
            onClick={() => handleScrape('booking')}
            disabled={loading}
            className="bg-blue-800 hover:bg-blue-900 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg"
          >
            {loading ? '取得中...' : 'Booking.comで取得'}
          </button>
        </div>

        {loading && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-4 mb-6 text-center">
            <svg className="animate-spin h-5 w-5 inline-block mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            プロキシ経由でアクセス中...（最大60秒）
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        {prices.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-bold mb-3">検出された価格情報</h3>
            <div className="space-y-1">
              {prices.map((p, i) => (
                <div key={i} className="text-sm bg-gray-50 px-3 py-2 rounded">{p}</div>
              ))}
            </div>
          </div>
        )}

        {screenshot && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-100 p-4 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-600">{title}</p>
            </div>
            <div className="p-4">
              <img src={screenshot} alt="スクリーンショット" className="w-full rounded-lg border border-gray-200" />
            </div>
          </div>
        )}
      </main>

      <footer className="text-center py-10 text-gray-400 text-xs">
        &copy; 2026 Hotel Price Scanner
      </footer>
    </div>
  );
}
