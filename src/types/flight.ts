export interface FlightOffer {
  agency: string;
  price: number;
  currency: string;
  is_cheapest: boolean;
  affiliate_url: string;
}

export interface FlightSegment {
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  airline: string;
  flight_number: string;
  origin: string;
  destination: string;
}

export interface FlightSearchResult {
  id: string;
  airline: string;
  airline_logo: string;
  outbound: {
    departure: string;
    arrival: string;
    duration_minutes: number;
    stops: number;
    segments: FlightSegment[];
  };
  inbound?: {
    departure: string;
    arrival: string;
    duration_minutes: number;
    stops: number;
    segments: FlightSegment[];
  };
  offers: FlightOffer[];
  savings: {
    amount: number;
    percentage: number;
    cheapest_agency: string;
  };
}
