// Future: Residential proxy integration for real country-based price fetching
// Phase 2: IPRoyal ($1.75/GB PAYG) or Decodo ($2.20/GB)

export interface ProxyConfig {
  provider: 'iproyal' | 'decodo';
  username: string;
  password: string;
  country: string; // ISO 3166-1 alpha-2
}

export interface ProxyPriceResult {
  country: string;
  ota: string;
  price: number;
  currency: string;
  fetchedAt: string;
}
