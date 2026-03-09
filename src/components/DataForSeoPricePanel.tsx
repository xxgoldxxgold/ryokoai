'use client';

import { useEffect, useState, useRef } from 'react';
import { jaLink } from '@/lib/utils';
interface DfsPrice {
  source: string;
  price: number;
  currency: string;
  link: string | null;
  domain: string | null;
}

interface TaxInfo {
  label: string;           // 税込 / 税抜 / 税込?
  color: string;           // tailwind color classes
  risk: string;            // 低 / 中 / 高 / 極高
  riskColor: string;
  surchargeRate: number;   // estimated additional % (0 for tax-inclusive)
}

const TAX_INCLUSIVE: TaxInfo = { label: '税込', color: 'text-emerald-600 bg-emerald-50', risk: '低', riskColor: 'text-emerald-500', surchargeRate: 0 };
const TAX_INCLUSIVE_PREMIUM: TaxInfo = { label: '税サ込', color: 'text-emerald-600 bg-emerald-50', risk: '極小', riskColor: 'text-emerald-500', surchargeRate: 0 };
const TAX_MIXED: TaxInfo = { label: '税込?', color: 'text-amber-600 bg-amber-50', risk: '高', riskColor: 'text-red-500', surchargeRate: 0.15 };
const TAX_EXCLUSIVE: TaxInfo = { label: '税抜', color: 'text-red-600 bg-red-50', risk: '高', riskColor: 'text-red-500', surchargeRate: 0.15 };
const TAX_EXCLUSIVE_EXTREME: TaxInfo = { label: '税抜', color: 'text-red-600 bg-red-50', risk: '極高', riskColor: 'text-red-600', surchargeRate: 0.20 };
const TAX_EXCLUSIVE_MED: TaxInfo = { label: '税抜', color: 'text-red-600 bg-red-50', risk: '中', riskColor: 'text-amber-500', surchargeRate: 0.10 };

// OTA domain/name → tax info mapping (2026 data)
const OTA_TAX_MAP: { match: string[]; info: TaxInfo }[] = [
  // 国内大手（税込）
  { match: ['rakuten', '楽天'], info: TAX_INCLUSIVE },
  { match: ['jalan', 'じゃらん'], info: TAX_INCLUSIVE },
  { match: ['ikyu', '一休', 'ikyu.com'], info: TAX_INCLUSIVE_PREMIUM },
  { match: ['jtb', 'japanican'], info: TAX_INCLUSIVE },
  { match: ['yahoo', 'yahoo!トラベル'], info: TAX_INCLUSIVE },
  { match: ['rurubu', 'るるぶ'], info: TAX_INCLUSIVE },
  { match: ['relux'], info: TAX_INCLUSIVE_PREMIUM },
  { match: ['skyticket'], info: { ...TAX_INCLUSIVE, risk: '中', riskColor: 'text-amber-500' } },
  // 世界大手（税込）
  { match: ['booking.com'], info: TAX_INCLUSIVE },
  { match: ['trip.com'], info: { ...TAX_INCLUSIVE, risk: '中', riskColor: 'text-amber-500' } },
  { match: ['klook'], info: TAX_INCLUSIVE },
  { match: ['traveloka'], info: { ...TAX_INCLUSIVE, risk: '中', riskColor: 'text-amber-500' } },
  { match: ['yanolja'], info: TAX_INCLUSIVE },
  { match: ['luxury escapes'], info: TAX_INCLUSIVE },
  { match: ['tablethotels', 'tablet hotels'], info: TAX_INCLUSIVE },
  { match: ['mr & mrs smith', 'mrandmrssmith'], info: TAX_INCLUSIVE },
  // 世界大手（税抜/混在）
  { match: ['agoda'], info: { label: '税抜', color: 'text-red-600 bg-red-50', risk: '高', riskColor: 'text-red-500', surchargeRate: 0.20 } },
  { match: ['expedia'], info: TAX_MIXED },
  { match: ['hotels.com'], info: TAX_MIXED },
  { match: ['orbitz'], info: TAX_EXCLUSIVE },
  { match: ['travelocity'], info: TAX_EXCLUSIVE },
  { match: ['priceline'], info: TAX_EXCLUSIVE },
  { match: ['cheaptickets'], info: TAX_EXCLUSIVE },
  { match: ['ebookers'], info: TAX_EXCLUSIVE },
  { match: ['hotwire'], info: TAX_EXCLUSIVE },
  // 格安/卸売系（税抜・リスク極高）
  { match: ['vio.com', 'findhotel'], info: TAX_EXCLUSIVE_EXTREME },
  { match: ['goseek'], info: TAX_EXCLUSIVE_EXTREME },
  { match: ['zenhotels'], info: TAX_EXCLUSIVE },
  { match: ['snaptravel'], info: TAX_EXCLUSIVE_EXTREME },
  { match: ['lol.travel'], info: TAX_EXCLUSIVE },
  { match: ['prestigia'], info: TAX_EXCLUSIVE },
  { match: ['destinia'], info: TAX_EXCLUSIVE },
  { match: ['edreams'], info: TAX_EXCLUSIVE_EXTREME },
  { match: ['opodo'], info: TAX_EXCLUSIVE_EXTREME },
  { match: ['lastminute'], info: TAX_EXCLUSIVE_MED },
  { match: ['roomdi'], info: TAX_EXCLUSIVE },
  { match: ['cancelon'], info: TAX_EXCLUSIVE_EXTREME },
  { match: ['stayforlong'], info: TAX_EXCLUSIVE },
  { match: ['hoteltonight'], info: TAX_EXCLUSIVE_MED },
  { match: ['traveluro'], info: TAX_EXCLUSIVE },
  { match: ['travelup'], info: TAX_EXCLUSIVE },
  { match: ['reserving'], info: TAX_EXCLUSIVE_MED },
  { match: ['makemytrip'], info: TAX_EXCLUSIVE },
  { match: ['trivago'], info: TAX_EXCLUSIVE_MED },
  { match: ['catchit'], info: TAX_EXCLUSIVE },
  { match: ['clicktrip'], info: TAX_EXCLUSIVE },
  { match: ['amimir'], info: TAX_EXCLUSIVE },
  { match: ['homeToGo', 'hometogo'], info: TAX_EXCLUSIVE },
  { match: ['wego'], info: TAX_EXCLUSIVE },
  { match: ['hotel booking zone', 'hotelbookingzone'], info: TAX_EXCLUSIVE },
  { match: ['bookhotel.direct', 'bookhoteldirect'], info: TAX_EXCLUSIVE_MED },
  { match: ['closest hotel', 'closesthotel'], info: TAX_EXCLUSIVE },
  { match: ['müv ai', 'muv ai', 'müv'], info: TAX_EXCLUSIVE },
  { match: ['brek'], info: TAX_EXCLUSIVE },
  { match: ['my luxury hotel'], info: TAX_EXCLUSIVE },
  { match: ['laterooms'], info: TAX_EXCLUSIVE },
  { match: ['evendo'], info: TAX_EXCLUSIVE },
  { match: ['qantas'], info: TAX_EXCLUSIVE_MED },
  { match: ['businesshotels'], info: TAX_EXCLUSIVE },
  { match: ['kayak'], info: TAX_EXCLUSIVE_MED },
  { match: ['momondo'], info: TAX_EXCLUSIVE_MED },
  { match: ['hotelscombined'], info: TAX_EXCLUSIVE_MED },
];

function getTaxInfo(source: string, domain: string | null): TaxInfo {
  const s = (source + ' ' + (domain || '')).toLowerCase();
  for (const entry of OTA_TAX_MAP) {
    if (entry.match.some(m => s.includes(m.toLowerCase()))) {
      return entry.info;
    }
  }
  return TAX_EXCLUSIVE_MED; // default: unknown = assume tax-exclusive
}

interface Props {
  hotelName: string;
  checkin: string;
  checkout: string;
  adults: number;
}

export default function DataForSeoPricePanel({ hotelName, checkin, checkout, adults }: Props) {
  const [prices, setPrices] = useState<DfsPrice[]>([]);
  const [hotelTitle, setHotelTitle] = useState<string | null>(null);
  const [basePrice, setBasePrice] = useState<number | null>(null);
  const [searching, setSearching] = useState(true);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevParams = useRef('');

  const paramsKey = `${hotelName}|${checkin}|${checkout}|${adults}`;
  const base = `https://vpn.ryokoai.com/hotel-prices.php?q=${encodeURIComponent(hotelName)}&checkin=${checkin}&checkout=${checkout}&adults=${adults}`;

  useEffect(() => {
    if (!hotelName || !checkin || !checkout) return;
    if (prevParams.current === paramsKey) return;
    prevParams.current = paramsKey;

    setSearching(true);
    setLoadingPrices(false);
    setPrices([]);
    setHotelTitle(null);
    setBasePrice(null);
    setError(null);

    const controller = new AbortController();

    fetch(`${base}&phase=search`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
          setSearching(false);
          return;
        }
        setHotelTitle(data.hotel_name || null);
        setBasePrice(data.base_price || null);
        setSearching(false);
        setLoadingPrices(true);

        return fetch(`${base}&phase=prices&id=${encodeURIComponent(data.hotel_id)}&loc=${data.location_code || 2392}`, { signal: controller.signal })
          .then(r => r.json())
          .then(priceData => {
            if (priceData.hotel_name) setHotelTitle(priceData.hotel_name);
            setPrices(priceData.prices || []);
            setLoadingPrices(false);
          });
      })
      .catch((e) => {
        if (e.name === 'AbortError') return;
        setError(e.message || 'ネットワークエラー');
        setSearching(false);
        setLoadingPrices(false);
      });

    return () => controller.abort();
  }, [paramsKey, hotelName, checkin, checkout, adults, base]);

  const [expanded, setExpanded] = useState(false);

  // Sort by estimated total (tax-inclusive estimate) for fair comparison
  const enriched = prices.map(p => {
    const tax = getTaxInfo(p.source, p.domain);
    const estimatedTotal = Math.round(p.price * (1 + tax.surchargeRate));
    return { ...p, tax, estimatedTotal };
  });
  enriched.sort((a, b) => a.estimatedTotal - b.estimatedTotal);

  const best = enriched.length > 0 ? enriched[0] : null;
  const worst = enriched.length > 1 ? enriched[enriched.length - 1] : null;
  const savings = best && worst && worst.estimatedTotal > best.estimatedTotal ? worst.estimatedTotal - best.estimatedTotal : 0;

  const loading = searching || loadingPrices;
  const showBasePrice = basePrice && basePrice > 0 && enriched.length === 0;
  const visiblePrices = expanded ? enriched : enriched.slice(0, 5);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="text-gray-900 font-bold text-base">予約サイト価格比較</h3>
        </div>
        <p className="text-gray-400 text-xs mt-0.5">
          {hotelTitle ? `${hotelTitle} — ` : ''}Google Hotels経由（1泊・円）・総額予想順
        </p>
      </div>

      {searching && (
        <div className="px-5 py-8 flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-700 rounded-full animate-spin" />
          <span className="text-gray-400 text-sm">ホテルを検索中...</span>
        </div>
      )}

      {showBasePrice && (
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 text-sm">Google Hotels参考価格</span>
            <div>
              <span className="text-gray-900 text-xl font-bold">¥{basePrice.toLocaleString()}</span>
              <span className="text-gray-400 text-xs">/泊</span>
            </div>
          </div>
          {loadingPrices && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <div className="w-3 h-3 border-2 border-blue-300 border-t-blue-700 rounded-full animate-spin" />
              <span className="text-gray-400 text-xs">各予約サイトの価格を比較中...</span>
            </div>
          )}
        </div>
      )}

      {enriched.length > 0 && (
        <div>
          {best && savings > 0 && (
            best.link ? (
            <a href={jaLink(best.link)!} target="_blank" rel="noopener noreferrer" className="block bg-emerald-50 px-5 py-3 border-b border-emerald-100 hover:bg-emerald-100/70 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 text-sm font-bold">{best.source}</span>
                  <span className="text-emerald-500 bg-emerald-100 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">最安</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${best.tax.color}`}>{best.tax.label}</span>
                </div>
                <div className="text-right flex items-center gap-1">
                  <span className="text-emerald-700 text-xl font-bold">¥{best.estimatedTotal.toLocaleString()}</span>
                  <span className="text-emerald-500 text-xs font-normal">/泊</span>
                  <svg className="w-4 h-4 text-emerald-400 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <p className="text-emerald-500 text-xs mt-1">
                最高値より <span className="font-semibold">¥{savings.toLocaleString()}</span> お得
                （{Math.round((savings / worst!.estimatedTotal) * 100)}%OFF）
              </p>
            </a>
            ) : (
            <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 text-sm font-bold">{best.source}</span>
                  <span className="text-emerald-500 bg-emerald-100 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">最安</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${best.tax.color}`}>{best.tax.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-700 text-xl font-bold">¥{best.estimatedTotal.toLocaleString()}</span>
                  <span className="text-emerald-500 text-xs font-normal">/泊</span>
                </div>
              </div>
              <p className="text-emerald-500 text-xs mt-1">
                最高値より <span className="font-semibold">¥{savings.toLocaleString()}</span> お得
                （{Math.round((savings / worst!.estimatedTotal) * 100)}%OFF）
              </p>
            </div>
            )
          )}

          <div className="divide-y divide-gray-50">
            {visiblePrices.map((entry, i) => {
              const isBest = i === 0 && enriched.length > 1;
              const showEstimate = entry.tax.surchargeRate > 0;
              const inner = (
                <div className={`px-5 py-3 transition-colors hover:bg-gray-50 ${isBest ? 'bg-emerald-50/50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-xs w-5 flex-shrink-0 text-center font-semibold rounded-full py-0.5 ${
                        isBest ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {i + 1}
                      </span>
                      <span className={`text-sm truncate ${isBest ? 'text-gray-900 font-semibold' : 'text-gray-700'}`}>
                        {entry.source}
                      </span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${entry.tax.color}`}>
                        {entry.tax.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <div className="text-right">
                        {showEstimate ? (
                          <>
                            <span className="text-gray-400 text-[11px] line-through">¥{entry.price.toLocaleString()}</span>
                            <span className={`text-sm font-bold ml-1 ${isBest ? 'text-emerald-600' : 'text-gray-900'}`}>
                              ~¥{entry.estimatedTotal.toLocaleString()}
                            </span>
                          </>
                        ) : (
                          <span className={`text-sm font-bold ${isBest ? 'text-emerald-600' : 'text-gray-900'}`}>
                            ¥{entry.price.toLocaleString()}
                          </span>
                        )}
                      </div>
                      {entry.link && (
                        <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  {showEstimate && (
                    <div className="flex items-center gap-1 mt-1 ml-7">
                      <span className={`text-[10px] ${entry.tax.riskColor}`}>
                        隠れ費用リスク: {entry.tax.risk}
                      </span>
                      <span className="text-gray-300 text-[10px]">|</span>
                      <span className="text-gray-400 text-[10px]">
                        税・手数料 +{Math.round(entry.tax.surchargeRate * 100)}%予想
                      </span>
                    </div>
                  )}
                </div>
              );

              return entry.link ? (
                <a key={entry.domain || entry.source} href={jaLink(entry.link)!} target="_blank" rel="noopener noreferrer">
                  {inner}
                </a>
              ) : (
                <div key={entry.domain || entry.source}>{inner}</div>
              );
            })}
          </div>

          {!expanded && enriched.length > 5 && (
            <button
              onClick={() => setExpanded(true)}
              className="w-full px-5 py-3 text-center text-blue-800 text-sm font-medium hover:bg-blue-100 transition-colors border-t border-gray-100"
            >
              他 {enriched.length - 5}件の予約サイトを見る
            </button>
          )}

          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-gray-400 text-[10px] text-center">
              ※総額予想は推定です。リンク先で正確な価格を確認してください
            </p>
          </div>
        </div>
      )}

      {!loading && enriched.length === 0 && !showBasePrice && (
        <div className="px-5 py-8 text-center">
          <p className="text-gray-400 text-sm">
            {error === 'Hotel not found'
              ? '該当するホテルが見つかりませんでした。地域名を含めて検索してみてください（例：リブマックス 札幌）'
              : error || '価格データを取得できませんでした。'}
          </p>
        </div>
      )}
    </div>
  );
}
