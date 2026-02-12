// Address search service using Nominatim API (OpenStreetMap)

export interface NominatimSearchResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  address: {
    country?: string;
    country_code?: string;
    state?: string;
    province?: string;
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    postcode?: string;
  };
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// User-Agent is required by Nominatim API terms of service
const USER_AGENT = 'heat-load-calc-app/1.0';

/**
 * Search for addresses using Nominatim API
 * @param query Search query (e.g., "東京都渋谷区", "大阪市北区")
 * @param countryCode Optional country code (e.g., "jp" for Japan)
 * @returns Array of search results
 */
export async function searchAddress(
  query: string,
  countryCode: string = 'jp'
): Promise<NominatimSearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      countrycodes: countryCode,
      limit: '10',
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const results: NominatimSearchResult[] = await response.json();
    return results;
  } catch (error) {
    console.error('Address search error:', error);
    return [];
  }
}

/**
 * Reverse geocoding: Get address from coordinates
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<NominatimSearchResult | null> {
  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      format: 'json',
      addressdetails: '1',
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params}`, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const result: NominatimSearchResult = await response.json();
    return result;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Format address for display
 */
export function formatAddress(result: NominatimSearchResult): string {
  const addr = result.address;
  const parts: string[] = [];

  if (addr.postcode) parts.push(addr.postcode);
  if (addr.province || addr.state) parts.push(addr.province || addr.state!);
  if (addr.city || addr.town || addr.village) {
    parts.push(addr.city || addr.town || addr.village!);
  }
  if (addr.suburb) parts.push(addr.suburb);

  return parts.join(' ');
}

/**
 * Extract location name for building location field
 */
export function extractLocationName(result: NominatimSearchResult): string {
  const addr = result.address;

  // Prefer city/town/village
  if (addr.city) return addr.city;
  if (addr.town) return addr.town;
  if (addr.village) return addr.village;

  // Fall back to state/province
  if (addr.state) return addr.state;
  if (addr.province) return addr.province;

  // Last resort: use display name
  return result.display_name.split(',')[0];
}
