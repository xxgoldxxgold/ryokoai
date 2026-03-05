import Avatar from '@/components/ui/Avatar';
import HotelResults from './HotelResults';
import HotelLinks from './HotelLinks';
import FlightResults from './FlightResults';
import ItineraryView from './ItineraryView';
import type { ChatMessage } from '@/types/chat';

interface AssistantMessageProps {
  message: ChatMessage;
}

export default function AssistantMessage({ message }: AssistantMessageProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta = message.metadata as any;
  const hotelLinks = meta?.hotel_links;
  const hasHotelArray = Array.isArray(meta?.hotels) && meta.hotels.length > 0;

  return (
    <div className="flex gap-3">
      <Avatar isAI className="shrink-0 mt-1" />
      <div className="max-w-[80%] md:max-w-[70%] space-y-3">
        <div className="bg-white/[0.03] border border-white/[0.06] text-white/90 rounded-2xl rounded-tl-md px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>

        {hotelLinks && (
          <HotelLinks data={hotelLinks} />
        )}

        {hasHotelArray && (
          <HotelResults hotels={meta.hotels} />
        )}

        {meta?.flights && Array.isArray(meta.flights) && meta.flights.length > 0 && (
          <FlightResults flights={meta.flights} />
        )}

        {meta?.itinerary && (
          <ItineraryView itinerary={meta.itinerary} />
        )}
      </div>
    </div>
  );
}
