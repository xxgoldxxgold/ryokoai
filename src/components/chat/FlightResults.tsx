'use client';

import Image from 'next/image';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils/currency';
import { formatDuration } from '@/lib/utils/date';
import type { FlightSearchResult } from '@/types/flight';

interface FlightResultsProps {
  flights: FlightSearchResult[];
}

export default function FlightResults({ flights }: FlightResultsProps) {
  return (
    <div className="space-y-3">
      {flights.map((flight) => (
        <Card key={flight.id} className="space-y-3">
          <div className="flex items-center gap-3">
            {flight.airline_logo && (
              <div className="relative w-12 h-5 shrink-0">
                <Image
                  src={flight.airline_logo}
                  alt={flight.airline}
                  fill
                  className="object-contain"
                  sizes="48px"
                />
              </div>
            )}
            <span className="text-white text-sm font-medium">{flight.airline}</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="text-white/70">
                <div className="text-white font-medium">{flight.outbound.departure.substring(11, 16)}</div>
                <div>{flight.outbound.segments?.[0]?.origin || 'DEP'}</div>
              </div>
              <div className="flex-1 px-4">
                <div className="text-center text-white/40">
                  {formatDuration(flight.outbound.duration_minutes)}
                </div>
                <div className="h-px bg-white/10 relative">
                  <div className="absolute left-1/2 -translate-x-1/2 -top-1 text-white/30 text-[10px]">
                    {flight.outbound.stops === 0 ? 'Direct' : `${flight.outbound.stops} stop${flight.outbound.stops > 1 ? 's' : ''}`}
                  </div>
                </div>
              </div>
              <div className="text-white/70 text-right">
                <div className="text-white font-medium">{flight.outbound.arrival.substring(11, 16)}</div>
                <div>{flight.outbound.segments?.[flight.outbound.segments.length - 1]?.destination || 'ARR'}</div>
              </div>
            </div>

            {flight.inbound && (
              <div className="flex items-center justify-between text-xs">
                <div className="text-white/70">
                  <div className="text-white font-medium">{flight.inbound.departure.substring(11, 16)}</div>
                  <div>{flight.inbound.segments?.[0]?.origin || 'DEP'}</div>
                </div>
                <div className="flex-1 px-4">
                  <div className="text-center text-white/40">
                    {formatDuration(flight.inbound.duration_minutes)}
                  </div>
                  <div className="h-px bg-white/10 relative">
                    <div className="absolute left-1/2 -translate-x-1/2 -top-1 text-white/30 text-[10px]">
                      {flight.inbound.stops === 0 ? 'Direct' : `${flight.inbound.stops} stop${flight.inbound.stops > 1 ? 's' : ''}`}
                    </div>
                  </div>
                </div>
                <div className="text-white/70 text-right">
                  <div className="text-white font-medium">{flight.inbound.arrival.substring(11, 16)}</div>
                  <div>{flight.inbound.segments?.[flight.inbound.segments.length - 1]?.destination || 'ARR'}</div>
                </div>
              </div>
            )}
          </div>

          {flight.offers.length > 0 && (
            <div className="space-y-1.5">
              {flight.offers.map((offer, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                    offer.is_cheapest
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-white/70">{offer.agency}</span>
                    {offer.is_cheapest && <Badge variant="success">Best Price!</Badge>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={offer.is_cheapest ? 'text-green-400 font-bold' : 'text-white/60'}>
                      {formatPrice(offer.price, offer.currency)}
                    </span>
                    <a href={offer.affiliate_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant={offer.is_cheapest ? 'primary' : 'secondary'}>
                        Book
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {flight.savings.amount > 0 && (
            <div className="text-green-400 text-xs text-center">
              Save {formatPrice(flight.savings.amount)} ({flight.savings.percentage}%) with {flight.savings.cheapest_agency}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
