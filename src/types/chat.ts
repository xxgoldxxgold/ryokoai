import { HotelSearchResult } from './hotel';
import { FlightSearchResult } from './flight';
import { Itinerary } from './plan';

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  destination: string | null;
  travel_dates: { start: string; end: string } | null;
  travelers: { adults: number; children: number } | null;
  budget: { amount: number; currency: string } | null;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata: {
    hotels?: HotelSearchResult[];
    flights?: FlightSearchResult[];
    itinerary?: Itinerary;
  };
  created_at: string;
}
