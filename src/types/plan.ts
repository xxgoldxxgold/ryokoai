export interface Itinerary {
  title: string;
  destination: string;
  days: {
    day_number: number;
    date: string;
    items: {
      time: string;
      activity: string;
      location: string;
      notes: string;
      cost_estimate?: number;
      booking_url?: string;
    }[];
  }[];
  total_cost: { min: number; max: number; currency: string };
}
