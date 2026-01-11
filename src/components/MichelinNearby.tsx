import { useEffect, useState, useMemo } from 'react';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import {
  fetchMichelinRestaurants,
  filterNearbyMichelinRestaurants,
  getGoogleMapsUrl,
} from '../lib/fetchMichelin';
import type { MichelinRestaurant } from '../lib/fetchMichelin';

interface Coordinates {
  lat: number;
  lng: number;
}

const MichelinNearby = () => {
  const {
    location: currentLocation,
    error: locationError,
    isLoading: locationLoading,
    retry: retryLocation,
  } = useCurrentLocation();
  
  const [manualLocationInput, setManualLocationInput] = useState<string>('');
  const [restaurants, setRestaurants] = useState<
    Array<MichelinRestaurant & { distance: number }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(1); // Default 1km
  const [starsOnly, setStarsOnly] = useState<boolean>(true); // Filter for starred restaurants only (default: enabled)

  // Parse manual location input or use current location - memoized to prevent infinite loops
  // Format: "lat, lng" (e.g., "37.5256734, 127.0410846")
  const location = useMemo((): Coordinates | null => {
    if (manualLocationInput.trim()) {
      try {
        const cleaned = manualLocationInput.trim();
        // Split by comma and parse as lat, lng
        const parts = cleaned.split(',').map(part => part.trim());
        
        if (parts.length === 2) {
          const lat = parseFloat(parts[0]);
          const lng = parseFloat(parts[1]);
          if (!isNaN(lat) && !isNaN(lng)) {
            return { lat, lng };
          }
        }
      } catch (e) {
        // If parsing fails, return null to use current location
        return null;
      }
    }
    
    return currentLocation;
  }, [manualLocationInput, currentLocation]);

  const loadRestaurants = async () => {
    if (!location) return;
    
    setLoading(true);
    setError(null);

    try {
      // Fetch all Michelin restaurants
      const allRestaurants = await fetchMichelinRestaurants();
      console.log('All Michelin restaurants:', allRestaurants);

      // Filter by distance
      let nearby = filterNearbyMichelinRestaurants(
        allRestaurants,
        location,
        radiusKm
      );

      // Filter for starred restaurants only if starsOnly is enabled
      if (starsOnly) {
        nearby = nearby.filter((restaurant) => {
          const award = restaurant.Award || '';
          // Check if Award contains "Star" (e.g., "1 Star", "2 Stars", "3 Stars")
          return award.toLowerCase().includes('star');
        });
      }

      console.log('Nearby Michelin restaurants (filtered):', nearby);
      setRestaurants(nearby);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch Michelin restaurants');
    } finally {
      setLoading(false);
    }
  };

  // Load restaurants when current location, radius, or star filter changes (not manual input)
  // Manual input requires pressing Enter to trigger search
  useEffect(() => {
    if (currentLocation && !manualLocationInput.trim()) {
      loadRestaurants();
    }
  }, [currentLocation, radiusKm, starsOnly]);

  if (locationError && !manualLocationInput)
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          color: '#d32f2f',
          fontSize: '16px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          maxWidth: 600,
          margin: '0 auto',
        }}
      >
        <div style={{ marginBottom: 20 }}>{locationError}</div>
        <button
          onClick={retryLocation}
          disabled={locationLoading}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#d97706',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: locationLoading ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            opacity: locationLoading ? 0.6 : 1,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!locationLoading) {
              e.currentTarget.style.backgroundColor = '#b45309';
            }
          }}
          onMouseLeave={(e) => {
            if (!locationLoading) {
              e.currentTarget.style.backgroundColor = '#d97706';
            }
          }}
        >
          {locationLoading ? 'Requesting location...' : 'Try Again'}
        </button>
        <div
          style={{
            marginTop: 20,
            fontSize: '14px',
            color: '#666',
          }}
        >
          <p>Or enter coordinates manually below</p>
        </div>
      </div>
    );

  if (!location && locationLoading && !manualLocationInput)
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          color: '#666',
          fontSize: '16px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        Getting your location…
      </div>
    );

  if (loading)
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          color: '#d97706',
          fontSize: '16px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        Finding Michelin restaurants near you…
      </div>
    );

  if (error)
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          color: '#d32f2f',
          fontSize: '16px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {error}
      </div>
    );

  const handleRestaurantClick = (restaurant: MichelinRestaurant) => {
    const url = getGoogleMapsUrl(restaurant);
    console.log('Opening Google Maps URL:', url);
    console.log('Restaurant data:', restaurant);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Extract number of stars from Award text (e.g., "1 Star" -> 1, "2 Stars" -> 2, "3 Stars" -> 3)
  const getStarCount = (award: string): number => {
    const match = award.match(/\b([123])\s*Star/i);
    return match ? parseInt(match[1], 10) : 0;
  };

  return (
    <div
      style={{
        padding: '24px 20px',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        backgroundColor: '#ffffff',
        minHeight: '100vh',
      }}
    >
      <h1
        style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#1a1a1a',
          marginBottom: '8px',
          letterSpacing: '-0.5px',
        }}
      >
        <span style={{ color: '#d97706' }}>best</span>foodhere
      </h1>
      <h2 style={{
        fontSize: '18px',
        fontWeight: '500',
        color: '#666',
        marginBottom: '32px',
        marginTop: 0,
      }}>
        Michelin restaurants nearby
      </h2>

      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={loadRestaurants}
          disabled={!location}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            backgroundColor: location ? '#bd2333' : '#b8a99a',
            color: '#faf5f3',
            border: 'none',
            borderRadius: '8px',
            cursor: location ? 'pointer' : 'not-allowed',
            fontSize: '13px',
            fontWeight: '500',
            transition: 'all 0.3s ease',
            boxShadow: location ? '0 4px 12px rgba(189, 35, 51, 0.25)' : 'none',
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
          }}
          onMouseEnter={(e) => {
            if (location) {
              e.currentTarget.style.backgroundColor = '#a01e2a';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(189, 35, 51, 0.35)';
            }
          }}
          onMouseLeave={(e) => {
            if (location) {
              e.currentTarget.style.backgroundColor = '#bd2333';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(189, 35, 51, 0.25)';
            }
          }}
        >
          Refresh <i className="bi bi-geo-alt-fill"></i>
        </button>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '13px',
            color: '#5a3a3a',
            fontWeight: '400',
            letterSpacing: '0.3px',
          }}
        >
          Radius:
          <input
            type="number"
            min="0.5"
            max="50"
            step="0.5"
            value={radiusKm}
            onChange={(e) => setRadiusKm(parseFloat(e.target.value) || 2)}
            style={{
              padding: '8px 12px',
              fontSize: '13px',
              border: '1px solid #D4C2BD',
              borderRadius: '0px',
              width: '70px',
              backgroundColor: '#ffffff',
              color: '#2c1810',
              fontWeight: '400',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#8B2635';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#D4C2BD';
            }}
          />
          <span style={{ color: '#8B2635', fontSize: '12px' }}>km</span>
        </label>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '13px',
            color: '#5a3a3a',
            fontWeight: '400',
            cursor: 'pointer',
            letterSpacing: '0.3px',
          }}
        >
          <input
            type="checkbox"
            checked={starsOnly}
            onChange={(e) => setStarsOnly(e.target.checked)}
            style={{
              width: '18px',
              height: '18px',
              cursor: 'pointer',
              accentColor: '#bd2333',
            }}
          />
          <span>⭐ Stars only</span>
        </label>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          marginBottom: 24,
        }}
      >
        <label
          style={{
            fontSize: '13px',
            color: '#5a3a3a',
            fontWeight: '400',
            letterSpacing: '0.2px',
          }}
        >
          Manual Location (optional - leave empty to use current location):
        </label>
        <input
          type="text"
          placeholder='37.5256734, 127.0410846'
          value={manualLocationInput}
          onChange={(e) => setManualLocationInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (location) {
                loadRestaurants();
              }
            }
          }}
          style={{
            padding: '10px 14px',
            fontSize: '13px',
            border: '1px solid #D4C2BD',
            borderRadius: '0px',
            backgroundColor: '#ffffff',
            color: '#2c1810',
            fontFamily: 'monospace',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#8B2635';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#D4C2BD';
          }}
        />
        {location && (
          <div
            style={{
              fontSize: '11px',
              color: '#8B2635',
              fontStyle: 'italic',
              letterSpacing: '0.2px',
            }}
          >
            Using: lat: {location.lat.toFixed(7)}, lng: {location.lng.toFixed(7)} (eg. 37.5256734, 127.0410846)
          </div>
        )}
      </div>

      {restaurants.length === 0 && !loading && (
        <div
          style={{
            padding: '48px 32px',
            textAlign: 'center',
            color: '#8B2635',
            fontSize: '15px',
            backgroundColor: '#ffffff',
            borderRadius: '0px',
            border: '1px solid #E8D8D3',
          }}
        >
          No Michelin restaurants found within {radiusKm}km
        </div>
      )}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {restaurants.map((restaurant, index) => (
          <li
            key={index}
            onClick={() => handleRestaurantClick(restaurant)}
            style={{
              marginBottom: 28,
              padding: '32px 36px',
              backgroundColor: '#ffffff',
              border: '1px solid #E8D8D3',
              borderRadius: '0px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(139, 38, 53, 0.08)',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#faf5f3';
              e.currentTarget.style.borderColor = '#8B2635';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow =
                '0 8px 24px rgba(139, 38, 53, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#E8D8D3';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 38, 53, 0.08)';
            }}
          >
            <div
              style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#2c1810',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {restaurant.Name}
              {restaurant.Award && (() => {
                const starCount = getStarCount(restaurant.Award);
                if (starCount > 0) {
                  return <span>{'⭐'.repeat(starCount)}</span>;
                }
                return null;
              })()}
            </div>

            {restaurant.Award && (
              <div
                style={{
                  marginTop: 10,
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  fontSize: '14px',
                }}
              >
                <span style={{ 
                  fontWeight: '700',
                  color: '#bd2333',
                  letterSpacing: '0.5px',
                }}>
                  🏆 {restaurant.Award}
                </span>
                {restaurant.GreenStar === 1 && (
                  <span style={{ 
                    color: '#6b8e6b', 
                    fontWeight: '500',
                    letterSpacing: '0.5px',
                  }}>
                    🌱 Green Star
                  </span>
                )}
              </div>
            )}

            <div
              style={{
                marginTop: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                color: '#5a3a3a',
                fontSize: '14px',
              }}
            >
              <span style={{ color: '#8B2635', fontSize: '12px' }}>📍</span>
              <span style={{ letterSpacing: '0.2px' }}>
                {restaurant.distance.toFixed(1)} km away
              </span>
              {restaurant.Price && (
                <>
                  <span style={{ color: '#D4C2BD', margin: '0 6px' }}>•</span>
                  <span style={{ color: '#8B2635' }}>{restaurant.Price}</span>
                </>
              )}
            </div>

            <div
              style={{
                marginTop: 14,
                fontSize: '14px',
                color: '#5a3a3a',
                lineHeight: '1.7',
                letterSpacing: '0.1px',
              }}
            >
              {restaurant.Address || restaurant.Location}
            </div>

            {restaurant.Cuisine && (
              <div
                style={{
                  marginTop: 12,
                  fontSize: '14px',
                  color: '#666',
                  fontStyle: 'italic',
                }}
              >
                {restaurant.Cuisine}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MichelinNearby;

