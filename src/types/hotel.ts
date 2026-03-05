export interface HotelOffer {
  agency_id: string;
  agency_name: string;
  price_per_night: number;
  total_price: number;
  currency: string;
  room_type: string;
  is_cheapest: boolean;
  affiliate_url: string;
  free_cancellation: boolean;
}

export interface HotelSearchResult {
  id: number;
  name: string;
  stars: number;
  address: string;
  location: { lat: number; lon: number };
  guest_score: number;
  photo_url: string;
  offers: HotelOffer[];
  savings: {
    amount: number;
    percentage: number;
    cheapest_agency: string;
  };
}
