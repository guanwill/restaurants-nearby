import { useEffect, useState } from 'react';
import { useCurrentLocation } from './hooks/useCurrentLocation';
import { fetchNearbyRestaurants } from './lib/fetchPlaces';

const App = () => {
  const { location, error: locationError } = useCurrentLocation();
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPlaceId, setExpandedPlaceId] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'restaurant' | 'cafe'>('all');
  const [minRating, setMinRating] = useState<4.0 | 4.5>(4.5);

  const loadPlaces = async () => {
    if (!location) return;
    setLoading(true);
    setError(null);
    try {
      const results = await fetchNearbyRestaurants({
        lat: location.lat,
        lng: location.lng,
      }, filterType);

      // Filter by minimum rating
      const filtered = results.filter((p: any) => {
        const rating = p.rating || (p.rating && typeof p.rating === 'number' ? p.rating : undefined);
        return rating !== undefined && rating >= minRating;
      });
      
      // Sort by rating (highest to lowest)
      const sorted = filtered.sort((a: any, b: any) => {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return ratingB - ratingA; // Descending order (highest first)
      });
      
      setPlaces(sorted);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch places');
    } finally {
      setLoading(false);
    }
  };

  // Get location name from coordinates
  useEffect(() => {
    if (!location || !window.google?.maps) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode(
      { location: { lat: location.lat, lng: location.lng } },
      (results, status) => {
        if (status === 'OK' && results && results.length > 0) {
          // Try to get locality (city/town) or sublocality, fallback to formatted address
          const result = results[0];
          const locality = result.address_components.find((component: any) =>
            component.types.includes('locality')
          );
          const sublocality = result.address_components.find((component: any) =>
            component.types.includes('sublocality') || component.types.includes('sublocality_level_1')
          );
          
          if (locality) {
            setLocationName(locality.long_name);
          } else if (sublocality) {
            setLocationName(sublocality.long_name);
          } else if (result.formatted_address) {
            // Fallback to first part of formatted address
            const parts = result.formatted_address.split(',');
            setLocationName(parts[0] || 'your location');
          } else {
            setLocationName('your location');
          }
        } else {
          setLocationName('your location');
        }
      }
    );
  }, [location]);

  // Fetch places on first load or when filter changes
  useEffect(() => {
    if (location) {
      loadPlaces();
    }
  }, [location, filterType, minRating]);

  if (locationError) return <div>{locationError}</div>;
  if (!location) return <div>Getting your location…</div>;
  if (loading) return <div>Finding restaurants near you…</div>;
  if (error) return <div>{error}</div>;

  return (
    <div style={{ padding: 16 }}>
      <h1>Top Restaurants Nearby</h1>
      {locationName && (
        <div style={{ color: '#666', marginTop: 4, marginBottom: 16 }}>
          Restaurants near {locationName}
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <button onClick={loadPlaces}>
          Refresh Location
        </button>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as 'all' | 'restaurant' | 'cafe')}
          style={{
            padding: '6px 12px',
            fontSize: '14px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          <option value="all">All</option>
          <option value="restaurant">Restaurants</option>
          <option value="cafe">Cafes</option>
        </select>
        <select
          value={minRating}
          onChange={(e) => setMinRating(parseFloat(e.target.value) as 4.0 | 4.5)}
          style={{
            padding: '6px 12px',
            fontSize: '14px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          <option value="4.5">4.5+ Rating</option>
          <option value="4.0">4.0+ Rating</option>
        </select>
      </div>
      {places.length === 0 && <div>No high-rated restaurants nearby</div>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {places.map((p: any) => {
          const name = p.displayName?.string || p.displayName || p.name || 'Unknown';
          const address = p.formattedAddress || p.vicinity || 'Address not available';
          const rating = p.rating || 'N/A';
          const reviewCount = p.userRatingCount || p.user_ratings_total || 0;
          const id = p.id || p.place_id || Math.random().toString();
          const placeId = p.place_id || p.id;
          
          // Generate Google Maps URL
          const getGoogleMapsUrl = (): string => {
            // Prefer place_id if available (most accurate)
            if (placeId) {
              return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
            }
            // Fallback to search query with name and address
            const query = encodeURIComponent(`${name} ${address}`);
            return `https://www.google.com/maps/search/?api=1&query=${query}`;
          };
          
          const handleRowClick = (e: React.MouseEvent) => {
            // Don't open maps if clicking on the reviews section
            if ((e.target as HTMLElement).closest('.reviews-section')) {
              return;
            }
            window.open(getGoogleMapsUrl(), '_blank', 'noopener,noreferrer');
          };

          const handleReviewsToggle = (e: React.MouseEvent) => {
            e.stopPropagation();
            setExpandedPlaceId(expandedPlaceId === id ? null : id);
          };

          const reviews = p.reviews || [];
          // Sort reviews by time (most recent first)
          // Reviews have a 'time' field which is a Unix timestamp in seconds
          const sortedReviews = [...reviews].sort((a: any, b: any) => {
            // Handle both 'time' (Unix timestamp) and check for missing values
            const timeA = a.time || 0;
            const timeB = b.time || 0;
            // Sort in descending order (newest/highest timestamp first)
            return timeB - timeA;
          });
          const hasReviews = sortedReviews.length > 0;
          const isExpanded = expandedPlaceId === id;
          const displayReviews = sortedReviews.slice(0, 5); // Limit to 5 reviews, most recent first
          
          return (
            <li 
              key={id} 
              onClick={handleRowClick}
              style={{ 
                marginBottom: 16, 
                paddingBottom: 16, 
                borderBottom: '1px solid #eee',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div>
                <strong>{name}</strong>
              </div>
              <div style={{ marginTop: 4 }}>
                ⭐ {rating} ({reviewCount} reviews)
              </div>
              {hasReviews && (
                <div className="reviews-section" style={{ marginTop: 12 }}>
                  <button
                    onClick={handleReviewsToggle}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0066cc',
                      cursor: 'pointer',
                      padding: '8px 4px',
                      fontSize: '0.9em',
                      textDecoration: 'none'
                    }}
                  >
                    {isExpanded ? 'Hide' : 'Show'} reviews
                  </button>
                  {isExpanded && (
                    <div style={{ marginTop: 8, paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 8, borderLeft: '2px solid #ddd' }}>
                      {displayReviews.map((review: any, idx: number) => (
                        <div key={idx} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: idx < displayReviews.length - 1 ? '1px solid #eee' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                            <div style={{ fontWeight: 'bold', marginRight: 8 }}>
                              {review.author_name || 'Anonymous'}
                            </div>
                            {review.rating && (
                              <div style={{ color: '#666' }}>
                                {'⭐'.repeat(Math.round(review.rating))} {review.rating}
                              </div>
                            )}
                            {review.relative_time_description && (
                              <div style={{ marginLeft: 'auto', fontSize: '0.85em', color: '#999' }}>
                                {review.relative_time_description}
                              </div>
                            )}
                          </div>
                          {review.text && (
                            <div style={{ fontSize: '0.9em', color: '#333', lineHeight: '1.5' }}>
                              {review.text}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default App;
