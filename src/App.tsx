import { useEffect, useState } from 'react';
import { useCurrentLocation } from './hooks/useCurrentLocation';
import { fetchNearbyRestaurants } from './lib/fetchPlaces';

function App() {
  const { location, error: locationError } = useCurrentLocation();
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPlaceId, setExpandedPlaceId] = useState<string | null>(null);

  const loadPlaces = async () => {
    if (!location) return;
    setLoading(true);
    setError(null);
    try {
      const results = await fetchNearbyRestaurants({
        lat: location.lat,
        lng: location.lng,
      });

      // Filter high-rating restaurants (heuristic for Michelin)
      // The new API should return places with rating information
      const filtered = results.filter((p: any) => {
        const rating = p.rating || (p.rating && typeof p.rating === 'number' ? p.rating : undefined);
        return rating !== undefined && rating >= 4.5;
      });
      setPlaces(filtered);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch places');
    } finally {
      setLoading(false);
    }
  };

  // Fetch places on first load
  useEffect(() => {
    if (location) {
      loadPlaces();
    }
  }, [location]);

  if (locationError) return <div>{locationError}</div>;
  if (!location) return <div>Getting your location…</div>;
  if (loading) return <div>Finding restaurants near you…</div>;
  if (error) return <div>{error}</div>;

  return (
    <div style={{ padding: 16 }}>
      <h1>Top Restaurants Nearby</h1>
      <button onClick={loadPlaces} style={{ marginBottom: 16 }}>
        Refresh Location
      </button>
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
                ⭐ {rating} ({reviewCount} reviews) — {address}
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
                      padding: '4px 0',
                      fontSize: '0.9em',
                      textDecoration: 'underline'
                    }}
                  >
                    {isExpanded ? 'Hide' : 'Show'} Reviews ({displayReviews.length})
                  </button>
                  {isExpanded && (
                    <div style={{ marginTop: 8, paddingLeft: 8, borderLeft: '2px solid #ddd' }}>
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
