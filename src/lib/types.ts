export interface Country {
  code: string;
  name: string;
  nameJa: string;
  flag: string;
  region: string;
  currency: string;
  note?: string;
}

export interface SearchParams {
  hotel: string;
  checkin: string;
  checkout: string;
  adults: number;
  rooms: number;
}

export interface GeneratedLink {
  country: Country;
  url: string;
}
