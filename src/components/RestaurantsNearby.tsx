import { useEffect, useState, useCallback } from 'react';
import type { MouseEvent } from 'react';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import { fetchNearbyRestaurants } from '../lib/fetchPlaces';

const RestaurantsNearby = () => {
  const { location, error: locationError, isLoading: locationLoading, retry: retryLocation } = useCurrentLocation();
  
  const handleRefresh = () => {
    // Re-request location first, then load places
    retryLocation();
  };
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPlaceId, setExpandedPlaceId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'restaurant' | 'cafe'>('restaurant');
  const [minRating, setMinRating] = useState<4.2 | 4.5>(4.5);

  const loadPlaces = useCallback(async () => {
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
        const rating = typeof p.rating === 'number' ? p.rating : undefined;
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
  }, [location, filterType, minRating]);


  // Fetch places on first load or when filter changes or location updates
  useEffect(() => {
    if (location && !locationLoading) {
      loadPlaces();
    }
  }, [location, filterType, minRating, locationLoading, loadPlaces]);

  if (locationError) return (
    <div style={{ 
      padding: 40, 
      textAlign: 'center', 
      color: '#d32f2f',
      fontSize: '16px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: 600,
      margin: '0 auto'
    }}>
      <div style={{ marginBottom: 20 }}>
        {locationError}
      </div>
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
          transition: 'all 0.2s ease'
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
      <div style={{ marginTop: 20, fontSize: '14px', color: '#666' }}>
        <p>To enable location access:</p>
        <ul style={{ textAlign: 'left', display: 'inline-block', marginTop: 10 }}>
          <li>Click the location icon in your browser's address bar</li>
          <li>Select "Allow" for location permissions</li>
          <li>Refresh the page or click "Try Again" above</li>
        </ul>
      </div>
    </div>
  );
  if (!location && locationLoading) return (
    <div style={{ 
      padding: 40, 
      textAlign: 'center', 
      color: '#666',
      fontSize: '16px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      Getting your location…
    </div>
  );
  if (loading) return (
    <div style={{ 
      padding: 40, 
      textAlign: 'center', 
      color: '#d97706',
      fontSize: '16px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      Finding restaurants near you…
    </div>
  );
  if (error) return (
    <div style={{ 
      padding: 40, 
      textAlign: 'center', 
      color: '#d32f2f',
      fontSize: '16px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {error}
    </div>
  );

  return (
    <div style={{ 
      padding: '24px 20px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      backgroundColor: '#fefefe',
      minHeight: '100vh'
    }}>
      <h1 style={{ 
        fontSize: '32px',
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: '8px',
        letterSpacing: '-0.5px'
      }}>
        <span style={{ color: '#d97706' }}>best</span>foodhere
      </h1>
      <h2 style={{
        fontSize: '18px',
        fontWeight: '500',
        color: '#666',
        marginBottom: '24px',
        marginTop: 0,
      }}>
        Top restaurants nearby
      </h2>
      <div style={{ 
        display: 'flex', 
        gap: 12, 
        alignItems: 'center', 
        marginBottom: 24,
        flexWrap: 'wrap'
      }}>
        <button 
          onClick={handleRefresh} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6,
            padding: '10px 16px',
            backgroundColor: '#d97706',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(217, 119, 6, 0.2)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#b45309';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(217, 119, 6, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#d97706';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(217, 119, 6, 0.2)';
          }}
        >
          Refresh <i className="bi bi-geo-alt-fill"></i>
        </button>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as 'all' | 'restaurant' | 'cafe')}
          style={{
            padding: '10px 14px',
            fontSize: '14px',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            cursor: 'pointer',
            backgroundColor: 'white',
            color: '#1a1a1a',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#d97706';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
          }}
        >
          <option value="all">All</option>
          <option value="restaurant">Restaurants</option>
          <option value="cafe">Cafes</option>
        </select>
        <select
          value={minRating === 4.2 ? "4.2" : "4.5"}
          onChange={(e) => {
            const newRating = parseFloat(e.target.value) as 4.2 | 4.5;
            setMinRating(newRating);
          }}
          style={{
            padding: '10px 14px',
            fontSize: '14px',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            cursor: 'pointer',
            backgroundColor: 'white',
            color: '#1a1a1a',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#d97706';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
          }}
        >
          <option value="4.5">4.5+</option>
          <option value="4.2">4.2+</option>
        </select>
      </div>
      <div style={{
        fontSize: '13px',
        color: '#666',
        marginTop: '-14px',
        marginBottom: '24px',
        fontStyle: 'normal',
        fontWeight: '400',
      }}>
        Distance: ~1.0km radius
      </div>
      {places.length === 0 && (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: '#666',
          fontSize: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          No high-rated restaurants nearby
        </div>
      )}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {places.map((p: any) => {
          const name = p.displayName?.string || p.displayName || p.name || 'Unknown';
          const address = p.formattedAddress || p.vicinity || 'Address not available';
          const rating = p.rating || 'N/A';
          const reviewCount = p.userRatingCount || p.user_ratings_total || 0;
          const id = p.id || p.place_id || Math.random().toString();
          
          // Generate Google Maps URL
          const getGoogleMapsUrl = (): string => {
            // Use name and address for better mobile compatibility
            // This format works more reliably across all devices
            const query = encodeURIComponent(`${name}, ${address}`);
            return `https://www.google.com/maps/search/?api=1&query=${query}`;
          };
          
          const handleRowClick = (e: MouseEvent<HTMLLIElement>) => {
            // Don't open maps if clicking on the reviews section or button
            const target = e.target as HTMLElement;
            if (target.closest('.reviews-section') || target.tagName === 'BUTTON' || target.closest('button')) {
              return;
            }
            window.open(getGoogleMapsUrl(), '_blank', 'noopener,noreferrer');
          };

          const handleReviewsToggle = () => {
            const newExpandedId = expandedPlaceId === id ? null : id;
            setExpandedPlaceId(newExpandedId);
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
                padding: '20px',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fff7ed';
                e.currentTarget.style.borderColor = '#d97706';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(217, 119, 6, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
              }}
            >
              <div style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#1a1a1a',
                marginBottom: '8px'
              }}>
                {name}
              </div>
              <div style={{ 
                marginTop: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#666',
                fontSize: '15px'
              }}>
                <span style={{ color: '#f59e0b', fontSize: '18px' }}>⭐</span>
                <span style={{ fontWeight: '600', color: '#d97706' }}>{rating}</span>
                <span style={{ color: '#9ca3af' }}>•</span>
                <span>{reviewCount} reviews</span>
              </div>
              <div style={{
                marginTop: 8,
                fontSize: '14px',
                color: '#6b7280'
              }}>
                {address}
              </div>
              {hasReviews && (
                <div className="reviews-section" style={{ marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      console.log('Button clicked!', id);
                      e.preventDefault();
                      e.stopPropagation();
                      handleReviewsToggle();
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#d97706',
                      cursor: 'pointer',
                      padding: '8px 4px',
                      fontSize: '14px',
                      fontWeight: '600',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#b45309';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#d97706';
                    }}
                  >
                    {isExpanded ? 'Hide' : 'Show'} reviews <i className="bi bi-chat-dots-fill" style={{ fontSize: '14px' }}></i>
                  </button>
                  {isExpanded && (
                    <div style={{ 
                      marginTop: 12, 
                      paddingLeft: 20, 
                      paddingRight: 20, 
                      paddingTop: 16, 
                      paddingBottom: 16, 
                      borderLeft: '3px solid #fbbf24',
                      backgroundColor: '#fffbeb',
                      borderRadius: '8px'
                    }}>
                      {displayReviews.map((review: any, idx: number) => (
                        <div key={idx} style={{ 
                          marginBottom: 16, 
                          paddingBottom: 16, 
                          borderBottom: idx < displayReviews.length - 1 ? '1px solid #fde68a' : 'none' 
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                            <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a1a1a' }}>
                              {review.author_name || 'Anonymous'}
                            </div>
                            {review.rating && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f59e0b' }}>
                                <span style={{ fontSize: '14px' }}>{'⭐'.repeat(Math.round(review.rating))}</span>
                                <span style={{ fontWeight: '600', color: '#d97706' }}>{review.rating}</span>
                              </div>
                            )}
                            {review.relative_time_description && (
                              <div style={{ marginLeft: 'auto', fontSize: '13px', color: '#9ca3af' }}>
                                {review.relative_time_description}
                              </div>
                            )}
                          </div>
                          {review.text && (
                            <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
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

export default RestaurantsNearby;

