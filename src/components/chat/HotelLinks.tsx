'use client';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface HotelLinksData {
  destination: string;
  check_in: string;
  check_out: string;
  adults: number;
  booking_links: Record<string, string>;
}

const OTA_INFO: Record<string, { name: string; color: string }> = {
  booking: { name: 'Booking.com', color: 'text-blue-400' },
  agoda: { name: 'Agoda', color: 'text-red-400' },
  expedia: { name: 'Expedia', color: 'text-yellow-400' },
  hotellook: { name: 'Hotellook', color: 'text-green-400' },
};

export default function HotelLinks({ data }: { data: HotelLinksData }) {
  const nights = Math.max(1, Math.round(
    (new Date(data.check_out).getTime() - new Date(data.check_in).getTime()) / (1000 * 60 * 60 * 24)
  ));

  return (
    <Card className="space-y-4">
      <div>
        <h4 className="text-gold font-medium text-sm">
          {data.destination} のホテル検索
        </h4>
        <p className="text-white/40 text-xs mt-0.5">
          {data.check_in} 〜 {data.check_out}（{nights}泊）/ {data.adults}名
        </p>
      </div>

      <div className="space-y-2">
        {Object.entries(data.booking_links).map(([key, url]) => {
          const info = OTA_INFO[key] || { name: key, color: 'text-white/70' };
          return (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
            >
              <span className={`text-sm font-medium ${info.color}`}>
                {info.name}
              </span>
              <Button size="sm" variant="primary">
                料金を見る
              </Button>
            </a>
          );
        })}
      </div>

      <p className="text-white/30 text-[10px] text-center">
        各サイトの料金を比較して最安値で予約できます
      </p>
    </Card>
  );
}
