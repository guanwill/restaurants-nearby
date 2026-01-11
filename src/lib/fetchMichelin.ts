export interface MichelinRestaurant {
  Name: string;
  Address: string;
  Location: string;
  Price: string;
  Cuisine: string;
  Longitude: number;
  Latitude: number;
  PhoneNumber?: string;
  Url?: string;
  WebsiteUrl?: string;
  Award?: string;
  GreenStar?: number;
  FacilitiesAndServices?: string;
  Description?: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);
  const lat1 = toRad(coord1.lat);
  const lat2 = toRad(coord2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Fetch and parse Michelin restaurants from CSV
 * Uses local CSV file for faster loading (served from public folder)
 */
export async function fetchMichelinRestaurants(): Promise<MichelinRestaurant[]> {
  try {
    const response = await fetch('/michelin.csv');

    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText}`);
    }

    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error: any) {
    throw new Error(`Failed to fetch Michelin restaurants: ${error.message}`);
  }
}

/**
 * Parse CSV text into MichelinRestaurant array
 */
function parseCSV(csvText: string): MichelinRestaurant[] {
  const lines = csvText.split('\n').filter((line) => line.trim());
  if (lines.length < 2) {
    return [];
  }

  // Parse header
  const headers = parseCSVLine(lines[0]);
  const restaurants: MichelinRestaurant[] = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || !values[0]) continue; // Skip empty rows

    const restaurant: Partial<MichelinRestaurant> = {};

    headers.forEach((header, index) => {
      const rawValue = values[index]?.trim() || '';
      const value = rawValue || undefined;
      
      switch (header) {
        case 'Longitude':
        case 'Latitude':
          if (value) {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              restaurant[header as keyof MichelinRestaurant] = numValue as any;
            }
          }
          break;
        case 'GreenStar':
          if (value) {
            const numValue = parseInt(value, 10);
            if (!isNaN(numValue)) {
              restaurant[header] = numValue;
            }
          }
          break;
        default:
          (restaurant as any)[header] = value;
      }
    });

    // Only add if we have required fields (Name, coordinates)
    if (
      restaurant.Name &&
      typeof restaurant.Latitude === 'number' &&
      typeof restaurant.Longitude === 'number' &&
      !isNaN(restaurant.Latitude) &&
      !isNaN(restaurant.Longitude)
    ) {
      restaurants.push(restaurant as MichelinRestaurant);
    }
  }

  return restaurants;
}

/**
 * Parse a CSV line handling quoted fields and escaped quotes
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = i + 1 < line.length ? line[i + 1] : null;

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote (double quote within quoted field)
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state (start or end of quoted field)
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field (comma outside of quotes)
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current);
  return result.map(field => field.trim());
}

/**
 * Filter Michelin restaurants by distance from user location
 */
export function filterNearbyMichelinRestaurants(
  restaurants: MichelinRestaurant[],
  userLocation: Coordinates,
  radiusKm: number
): Array<MichelinRestaurant & { distance: number }> {
  const nearby = restaurants
    .map((restaurant) => {
      const distance = calculateDistance(userLocation, {
        lat: restaurant.Latitude,
        lng: restaurant.Longitude,
      });

      return {
        ...restaurant,
        distance,
      };
    })
    .filter((restaurant) => restaurant.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance); // Sort by distance (closest first)

  return nearby;
}

/**
 * Generate Google Maps URL for a restaurant
 */
export function getGoogleMapsUrl(restaurant: MichelinRestaurant): string {
  // Use coordinates directly in the URL for precise location
  // Format: https://www.google.com/maps/@lat,lng,zoom
  // Or use search with coordinates: https://www.google.com/maps/search/?api=1&query=lat,lng
  const lat = restaurant.Latitude;
  const lng = restaurant.Longitude;
  
  // Try using the place name and coordinates together for better results
  if (restaurant.Name && restaurant.Address) {
    const query = `${restaurant.Name}, ${restaurant.Address}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }
  
  // Fallback to coordinates
  return `https://www.google.com/maps/@${lat},${lng},15z`;
}

