'use client';

import Image from 'next/image';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils/currency';
import type { HotelSearchResult } from '@/types/hotel';

interface HotelResultsProps {
  hotels: HotelSearchResult[];
  sessionId?: string;
}

async function trackClick(
  provider: string,
  productName: string,
  affiliateUrl: string,
  price: number,
  sessionId?: string
) {
  try {
    await fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'track_click',
        provider,
        product_type: 'hotel',
        product_name: productName,
        affiliate_url: affiliateUrl,
        price,
        session_id: sessionId,
      }),
    });
  } catch {
    // Non-blocking
  }
}

export default function HotelResults({ hotels, sessionId }: HotelResultsProps) {
  return (
    <div className="space-y-3">
      {hotels.map((hotel) => (
        <Card key={hotel.id} className="space-y-3">
          <div className="flex gap-3">
            {hotel.photo_url && (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0">
                <Image
                  src={hotel.photo_url}
                  alt={hotel.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium text-sm truncate">{hotel.name}</h4>
              <div className="flex items-center gap-1 mt-0.5">
                {Array.from({ length: hotel.stars }).map((_, i) => (
                  <span key={i} className="text-gold text-xs">&#9733;</span>
                ))}
                {hotel.guest_score > 0 && (
                  <span className="text-white/50 text-xs ml-1">{hotel.guest_score}/10</span>
                )}
              </div>
              {hotel.address && (
                <p className="text-white/40 text-xs mt-1 truncate">{hotel.address}</p>
              )}
            </div>
          </div>

          {hotel.offers.length > 0 && (
            <div className="space-y-1.5">
              {hotel.offers.map((offer, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                    offer.is_cheapest
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-white/70">{offer.agency_name}</span>
                    {offer.is_cheapest && <Badge variant="success">最安値!</Badge>}
                    {offer.free_cancellation && (
                      <span className="text-green-400/60">無料キャンセル</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={offer.is_cheapest ? 'text-green-400 font-bold' : 'text-white/60'}>
                      {formatPrice(offer.price_per_night, offer.currency)}/night
                    </span>
                    <a
                      href={offer.affiliate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackClick(offer.agency_name, hotel.name, offer.affiliate_url, offer.total_price, sessionId)}
                    >
                      <Button size="sm" variant={offer.is_cheapest ? 'primary' : 'secondary'}>
                        予約
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hotel.savings.amount > 0 && (
            <div className="text-green-400 text-xs text-center">
              最大 {formatPrice(hotel.savings.amount)}（{hotel.savings.percentage}%）お得!
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
