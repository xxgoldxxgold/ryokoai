'use client';

import Card from '@/components/ui/Card';

interface EstimatedPrices {
  budget: number;
  standard: number;
  premium: number;
}

interface HotelLinksData {
  destination: string;
  check_in: string;
  check_out: string;
  adults: number;
  booking_links: Record<string, string>;
  estimated_prices?: EstimatedPrices | null;
}

const OTA_INFO: Record<string, { name: string; color: string; bg: string }> = {
  booking: { name: 'Booking.com', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  agoda: { name: 'Agoda', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  expedia: { name: 'Expedia', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  hotellook: { name: 'Hotellook', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
};

function formatPrice(yen: number): string {
  return `¥${yen.toLocaleString()}`;
}

export default function HotelLinks({ data }: { data: HotelLinksData }) {
  const nights = Math.max(1, Math.round(
    (new Date(data.check_out).getTime() - new Date(data.check_in).getTime()) / (1000 * 60 * 60 * 24)
  ));
  const prices = data.estimated_prices;

  return (
    <Card className="space-y-4">
      <div>
        <h4 className="text-gold font-medium text-sm">
          {data.destination} のホテル
        </h4>
        <p className="text-white/40 text-xs mt-0.5">
          {data.check_in} ~ {data.check_out}({nights}泊)/ {data.adults}名
        </p>
      </div>

      {prices && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 text-center">
            <p className="text-white/40 text-[10px] mb-1">Budget</p>
            <p className="text-white text-sm font-semibold">{formatPrice(prices.budget)}</p>
            <p className="text-white/30 text-[10px]">/泊~</p>
          </div>
          <div className="bg-gold/10 border border-gold/20 rounded-lg p-3 text-center">
            <p className="text-gold/60 text-[10px] mb-1">Standard</p>
            <p className="text-gold text-sm font-semibold">{formatPrice(prices.standard)}</p>
            <p className="text-gold/40 text-[10px]">/泊~</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 text-center">
            <p className="text-white/40 text-[10px] mb-1">Premium</p>
            <p className="text-white text-sm font-semibold">{formatPrice(prices.premium)}</p>
            <p className="text-white/30 text-[10px]">/泊~</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {Object.entries(data.booking_links).map(([key, url]) => {
          const info = OTA_INFO[key] || { name: key, color: 'text-white/70', bg: 'bg-white/[0.03] border-white/[0.06]' };
          return (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex flex-col items-center justify-center px-3 py-3 rounded-lg border ${info.bg} hover:brightness-125 transition-all`}
            >
              <span className={`text-xs font-medium ${info.color}`}>
                {info.name}
              </span>
              <span className="text-white/50 text-[10px] mt-1">
                料金を比較
              </span>
            </a>
          );
        })}
      </div>

      {prices && (
        <p className="text-white/20 text-[10px] text-center">
          * 料金はAI推定値です。正確な料金は各サイトでご確認ください
        </p>
      )}
    </Card>
  );
}
