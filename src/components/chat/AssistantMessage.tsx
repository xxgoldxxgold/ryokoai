import Avatar from '@/components/ui/Avatar';
import HotelResults from './HotelResults';
import FlightResults from './FlightResults';
import ItineraryView from './ItineraryView';
import type { ChatMessage } from '@/types/chat';

interface AssistantMessageProps {
  message: ChatMessage;
}

export default function AssistantMessage({ message }: AssistantMessageProps) {
  return (
    <div className="flex gap-3">
      <Avatar isAI className="shrink-0 mt-1" />
      <div className="max-w-[80%] md:max-w-[70%] space-y-3">
        <div className="bg-white/[0.03] border border-white/[0.06] text-white/90 rounded-2xl rounded-tl-md px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>

        {message.metadata?.hotels && message.metadata.hotels.length > 0 && (
          <HotelResults hotels={message.metadata.hotels} />
        )}

        {message.metadata?.flights && message.metadata.flights.length > 0 && (
          <FlightResults flights={message.metadata.flights} />
        )}

        {message.metadata?.itinerary && (
          <ItineraryView itinerary={message.metadata.itinerary} />
        )}
      </div>
    </div>
  );
}
