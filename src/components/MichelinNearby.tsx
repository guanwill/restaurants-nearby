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

  return (
    <div
      style={{
        padding: '24px 20px',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        backgroundColor: '#fefefe',
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
        marginBottom: '24px',
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
            gap: 6,
            padding: '10px 16px',
            backgroundColor: location ? '#d97706' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: location ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            boxShadow: location ? '0 2px 4px rgba(217, 119, 6, 0.2)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (location) {
              e.currentTarget.style.backgroundColor = '#b45309';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(217, 119, 6, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (location) {
              e.currentTarget.style.backgroundColor = '#d97706';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(217, 119, 6, 0.2)';
            }
          }}
        >
          Refresh <i className="bi bi-geo-alt-fill"></i>
        </button>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '14px',
            color: '#1a1a1a',
            fontWeight: '500',
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
              fontSize: '14px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              width: '80px',
              backgroundColor: 'white',
              color: '#1a1a1a',
              fontWeight: '500',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#d97706';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          />
          <span style={{ color: '#666' }}>km</span>
        </label>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '14px',
            color: '#1a1a1a',
            fontWeight: '500',
            cursor: 'pointer',
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
              accentColor: '#d97706',
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
            fontSize: '14px',
            color: '#1a1a1a',
            fontWeight: '500',
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
            fontSize: '14px',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: 'white',
            color: '#1a1a1a',
            fontFamily: 'monospace',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#d97706';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
          }}
        />
        {location && (
          <div
            style={{
              fontSize: '12px',
              color: '#666',
              fontStyle: 'italic',
            }}
          >
            Using: lat: {location.lat.toFixed(7)}, lng: {location.lng.toFixed(7)}
          </div>
        )}
      </div>

      {restaurants.length === 0 && !loading && (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#666',
            fontSize: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
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
              marginBottom: 16,
              padding: '20px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fff7ed';
              e.currentTarget.style.borderColor = '#d97706';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow =
                '0 4px 12px rgba(217, 119, 6, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
            }}
          >
            <div
              style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#1a1a1a',
                marginBottom: '8px',
              }}
            >
              {restaurant.Name}
            </div>

            {restaurant.Award && (
              <div
                style={{
                  marginTop: 6,
                  marginBottom: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#d97706',
                  fontSize: '15px',
                }}
              >
                <span style={{ fontWeight: '600' }}>
                  🏆 {restaurant.Award}
                </span>
                {restaurant.GreenStar === 1 && (
                  <span style={{ color: '#10b981', fontWeight: '600' }}>
                    🌱 Green Star
                  </span>
                )}
              </div>
            )}

            <div
              style={{
                marginTop: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#666',
                fontSize: '15px',
              }}
            >
              <span style={{ color: '#9ca3af' }}>📍</span>
              <span>
                {restaurant.distance.toFixed(1)} km away
              </span>
              {restaurant.Price && (
                <>
                  <span style={{ color: '#9ca3af' }}>•</span>
                  <span>{restaurant.Price}</span>
                </>
              )}
            </div>

            <div
              style={{
                marginTop: 8,
                fontSize: '14px',
                color: '#6b7280',
              }}
            >
              {restaurant.Address || restaurant.Location}
            </div>

            {restaurant.Cuisine && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: '14px',
                  color: '#9ca3af',
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

