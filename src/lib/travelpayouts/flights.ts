const BASE_URL = 'https://api.travelpayouts.com';

interface CheapFlightData {
  price: number;
  airline: string;
  flight_number: number;
  departure_at: string;
  return_at?: string;
  expires_at?: string;
  actual_destination?: string;
}

const AIRLINE_NAMES: Record<string, string> = {
  'HA': 'Hawaiian Airlines',
  'UA': 'United Airlines',
  'AA': 'American Airlines',
  'DL': 'Delta Air Lines',
  'NH': 'ANA',
  'JL': 'JAL',
  'SQ': 'Singapore Airlines',
  'CX': 'Cathay Pacific',
  'QF': 'Qantas',
  'EK': 'Emirates',
  'TG': 'Thai Airways',
  'BA': 'British Airways',
  'LH': 'Lufthansa',
  'AF': 'Air France',
  'KE': 'Korean Air',
  'OZ': 'Asiana Airlines',
  'CI': 'China Airlines',
  'BR': 'EVA Air',
  'MH': 'Malaysia Airlines',
  'GA': 'Garuda Indonesia',
  'PR': 'Philippine Airlines',
  'VN': 'Vietnam Airlines',
  'FD': 'AirAsia',
  'MM': 'Peach Aviation',
  'GK': 'Jetstar Japan',
  '7C': 'Jeju Air',
  'TW': "T'way Air",
  'ZG': 'ZIPAIR',
  'BC': 'Skymark Airlines',
  'IJ': 'Spring Airlines Japan',
};

export async function searchCheapFlights(
  origin: string,
  destination: string,
  departDate: string,
  returnDate?: string,
  currency = 'usd'
): Promise<CheapFlightData[]> {
  const token = process.env.TRAVELPAYOUTS_TOKEN;
  const departMonth = departDate.substring(0, 7);
  const returnMonth = returnDate ? returnDate.substring(0, 7) : '';

  let url = `${BASE_URL}/v1/prices/cheap?origin=${origin}&destination=${destination}&depart_date=${departMonth}&currency=${currency}&token=${token}`;
  if (returnMonth) {
    url += `&return_date=${returnMonth}`;
  }

  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return [];

  const data = await res.json();
  if (!data?.success || !data?.data) return [];

  // API may return results under a different IATA code (e.g., KIX -> OSA)
  // So we collect all results from all destination keys
  const allFlights: CheapFlightData[] = [];
  for (const [destKey, stops] of Object.entries(data.data)) {
    if (typeof stops === 'object' && stops !== null) {
      for (const flight of Object.values(stops as Record<string, CheapFlightData>)) {
        allFlights.push({ ...flight, actual_destination: destKey });
      }
    }
  }

  return allFlights;
}

export function getAirlineName(code: string): string {
  return AIRLINE_NAMES[code] || code;
}

export function getAirlineLogoUrl(code: string): string {
  return `https://pics.avs.io/200/80/${code}.png`;
}

export function buildFlightAffiliateUrl(
  origin: string,
  destination: string,
  departDate: string,
  returnDate: string | undefined,
  adults: number,
  marker: string
): string {
  const departDDMM = departDate.substring(8, 10) + departDate.substring(5, 7);

  let searchPath = `${origin}${departDDMM}${destination}`;

  if (returnDate) {
    const returnDDMM = returnDate.substring(8, 10) + returnDate.substring(5, 7);
    searchPath += returnDDMM;
  }

  searchPath += adults.toString();

  return `https://www.aviasales.com/search/${searchPath}?marker=${marker}`;
}
