'use client';

import { useState, useRef } from 'react';

interface GeoResult {
  country: string;
  country_name: string;
  original_price?: number;
  currency?: string;
  jpy_price?: number;
  error?: string;
}

const FLAG: Record<string, string> = {
  vn:'🇻🇳',pl:'🇵🇱',th:'🇹🇭',ph:'🇵🇭',id:'🇮🇩',br:'🇧🇷',us:'🇺🇸',jp:'🇯🇵',kr:'🇰🇷',tw:'🇹🇼',
  'in':'🇮🇳',my:'🇲🇾',mx:'🇲🇽',tr:'🇹🇷',eg:'🇪🇬',ar:'🇦🇷',za:'🇿🇦',ro:'🇷🇴',hu:'🇭🇺',cz:'🇨🇿',
  bg:'🇧🇬',co:'🇨🇴',pe:'🇵🇪',cl:'🇨🇱',pk:'🇵🇰',bd:'🇧🇩',lk:'🇱🇰',de:'🇩🇪',fr:'🇫🇷',gb:'🇬🇧',
  it:'🇮🇹',es:'🇪🇸',au:'🇦🇺',ca:'🇨🇦',sg:'🇸🇬',hk:'🇭🇰',
};

const CURR_SYM: Record<string, string> = {
  JPY:'¥',USD:'$',EUR:'€',GBP:'£',KRW:'₩',THB:'฿',VND:'₫',IDR:'Rp',INR:'₹',
  MXN:'$',TRY:'₺',BRL:'R$',ARS:'$',PLN:'zł',HUF:'Ft',CZK:'Kč',BGN:'лв',
  CLP:'$',COP:'$',PEN:'S/',PKR:'₨',BDT:'৳',LKR:'₨',MYR:'RM',PHP:'₱',
  EGP:'E£',ZAR:'R',RON:'lei',AUD:'A$',CAD:'C$',SGD:'S$',HKD:'HK$',TWD:'NT$',
};

export default function GeoPricingPage() {
  const [hotelName, setHotelName] = useState('Dusit Beach Resort Guam');
  const [checkin, setCheckin] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [checkout, setCheckout] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  });
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSearch = async () => {
    if (!hotelName.trim()) return;
    setLoading(true);
    setError('');
    setResults([]);
    setElapsed(0);

    const start = Date.now();
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 500);

    try {
      const params = new URLSearchParams({
        q: hotelName.trim(),
        checkin,
        checkout,
      });
      const res = await fetch(`https://vpn.ryokoai.com/geo-prices.php?${params}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResults(data.results || []);
      }
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
      setLoading(false);
    }
  };

  const priced = results.filter(r => r.jpy_price);
  const cheapest = priced.length > 0 ? priced[0].jpy_price! : 0;
  const jpPrice = results.find(r => r.country === 'jp')?.jpy_price;
  const savings = jpPrice && cheapest ? jpPrice - cheapest : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <nav className="bg-slate-900/80 backdrop-blur border-b border-slate-700 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-white font-bold text-lg">GeoPrice Scanner</h1>
          <span className="text-slate-400 text-xs">世界最安値を探す</span>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 space-y-4">
          <input
            type="text"
            value={hotelName}
            onChange={e => setHotelName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && handleSearch()}
            placeholder="ホテル名（英語）"
            className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">チェックイン</label>
              <input type="date" value={checkin} onChange={e => setCheckin(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">チェックアウト</label>
              <input type="date" value={checkout} onChange={e => setCheckout(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold text-sm transition-colors"
          >
            {loading ? `検索中... (${elapsed}秒)` : '世界最安値を検索'}
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl px-4 py-3 text-red-300 text-sm">{error}</div>
        )}

        {priced.length > 0 && savings > 0 && (
          <div className="bg-emerald-900/30 border border-emerald-700 rounded-2xl px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-400 text-xs font-medium">最安値（{priced[0].country_name}）</p>
                <p className="text-emerald-300 text-2xl font-bold mt-1">¥{cheapest.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-emerald-400 text-xs">日本価格との差額</p>
                <p className="text-emerald-300 text-xl font-bold mt-1">-¥{savings.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-700">
              <h2 className="text-white font-bold text-sm">国別価格ランキング</h2>
              <p className="text-slate-400 text-xs mt-0.5">{priced.length}カ国で価格を取得 / {results.length - priced.length}カ国は取得失敗</p>
            </div>
            <div className="divide-y divide-slate-700/50">
              {results.map((r, i) => (
                <div key={r.country} className={`flex items-center justify-between px-5 py-3 ${i === 0 && r.jpy_price ? 'bg-emerald-900/20' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs w-6 text-center font-bold ${r.jpy_price ? (i === 0 ? 'text-emerald-400' : 'text-slate-500') : 'text-slate-600'}`}>
                      {r.jpy_price ? i + 1 : '-'}
                    </span>
                    <span className="text-lg">{FLAG[r.country] || '🏳️'}</span>
                    <div>
                      <span className="text-white text-sm">{r.country_name}</span>
                      {r.original_price && r.currency && r.currency !== 'JPY' && (
                        <span className="text-slate-500 text-xs ml-2">
                          {CURR_SYM[r.currency] || r.currency}{r.original_price.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {r.jpy_price ? (
                      <span className={`font-bold text-sm ${i === 0 ? 'text-emerald-400' : 'text-white'}`}>
                        ¥{r.jpy_price.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">{r.error || '—'}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 text-sm">ホテル名を入力して検索してください</p>
            <p className="text-slate-600 text-xs mt-2">各国のGoogleから価格を取得し、日本円に換算して比較します</p>
          </div>
        )}
      </main>
    </div>
  );
}
