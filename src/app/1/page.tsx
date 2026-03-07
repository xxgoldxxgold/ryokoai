'use client';

import { useState } from 'react';

export default function ProxyScrapePage() {
  const [query, setQuery] = useState('hotel istanbul');
  const [countryCode, setCountryCode] = useState('tr');
  const [lang, setLang] = useState('tr');
  const [proxyHost, setProxyHost] = useState('');
  const [proxyPort, setProxyPort] = useState('');
  const [proxyUser, setProxyUser] = useState('');
  const [proxyPass, setProxyPass] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const countries = [
    { code: 'tr', name: 'トルコ', lang: 'tr' },
    { code: 'id', name: 'インドネシア', lang: 'id' },
    { code: 'za', name: '南アフリカ', lang: 'en' },
    { code: 'th', name: 'タイ', lang: 'th' },
    { code: 'vn', name: 'ベトナム', lang: 'vi' },
    { code: 'us', name: 'アメリカ', lang: 'en' },
    { code: 'jp', name: '日本', lang: 'ja' },
  ];

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    const c = countries.find(c => c.code === code);
    if (c) setLang(c.lang);
  };

  const handleSubmit = async () => {
    if (!proxyHost || !proxyPort || !proxyUser || !proxyPass) {
      setError('プロキシ情報をすべて入力してください');
      return;
    }
    setLoading(true);
    setError('');
    setScreenshot(null);

    try {
      const res = await fetch('/api/proxy-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, countryCode, lang, proxyHost, proxyPort, proxyUser, proxyPass }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setScreenshot(data.screenshot);
        setTitle(data.title);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-700 p-4 text-white shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tighter">
            🌍 Proxy Scraper <span className="text-yellow-400">Tool</span>
          </h1>
          <span className="text-sm bg-blue-800 px-3 py-1 rounded-full border border-blue-400">
            プロトタイプ版
          </span>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">プロキシ設定</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">ホスト</label>
              <input
                type="text"
                value={proxyHost}
                onChange={e => setProxyHost(e.target.value)}
                placeholder="proxy.example.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">ポート</label>
              <input
                type="text"
                value={proxyPort}
                onChange={e => setProxyPort(e.target.value)}
                placeholder="8080"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">ユーザー名</label>
              <input
                type="text"
                value={proxyUser}
                onChange={e => setProxyUser(e.target.value)}
                placeholder="username"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">パスワード</label>
              <input
                type="password"
                value={proxyPass}
                onChange={e => setProxyPass(e.target.value)}
                placeholder="password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">検索設定</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">検索キーワード</label>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">アクセス国</label>
              <div className="flex flex-wrap gap-2">
                {countries.map(c => (
                  <button
                    key={c.code}
                    onClick={() => handleCountryChange(c.code)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      countryCode === c.code
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl text-center transition-all shadow-lg mb-6"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              スクレイピング中...
            </span>
          ) : (
            '検索実行'
          )}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        {screenshot && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-100 p-4 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-600">結果: {title}</p>
            </div>
            <div className="p-4">
              <img src={screenshot} alt="スクリーンショット" className="w-full rounded-lg border border-gray-200" />
            </div>
          </div>
        )}
      </main>

      <footer className="text-center py-10 text-gray-400 text-xs">
        &copy; 2026 Proxy Scraper Tool
      </footer>
    </div>
  );
}
