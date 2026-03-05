import Card from '@/components/ui/Card';
import { formatPrice } from '@/lib/utils/currency';
import type { Itinerary } from '@/types/plan';

interface ItineraryViewProps {
  itinerary: Itinerary;
}

export default function ItineraryView({ itinerary }: ItineraryViewProps) {
  return (
    <Card className="space-y-4">
      <div>
        <h3 className="text-gold font-medium text-sm">{itinerary.title}</h3>
        <p className="text-white/50 text-xs">{itinerary.destination}</p>
      </div>

      <div className="space-y-4">
        {itinerary.days.map((day) => (
          <div key={day.day_number}>
            <div className="text-white/70 text-xs font-medium mb-2">
              Day {day.day_number} — {day.date}
            </div>
            <div className="space-y-2 pl-3 border-l border-white/[0.06]">
              {day.items.map((item, idx) => (
                <div key={idx} className="text-xs">
                  <div className="flex items-start gap-2">
                    <span className="text-gold/70 shrink-0 w-12">{item.time}</span>
                    <div>
                      <div className="text-white/90">{item.activity}</div>
                      <div className="text-white/40">{item.location}</div>
                      {item.notes && <div className="text-white/30 mt-0.5">{item.notes}</div>}
                      {item.cost_estimate != null && (
                        <div className="text-white/50 mt-0.5">
                          ~{formatPrice(item.cost_estimate, itinerary.total_cost.currency)}
                        </div>
                      )}
                      {item.booking_url && (
                        <a
                          href={item.booking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gold/70 hover:text-gold text-[10px] underline"
                        >
                          Book this
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-white/50 text-center pt-2 border-t border-white/[0.06]">
        Estimated total: {formatPrice(itinerary.total_cost.min, itinerary.total_cost.currency)} – {formatPrice(itinerary.total_cost.max, itinerary.total_cost.currency)}
      </div>
    </Card>
  );
}
