export const fetchNearbyRestaurants = async (location: google.maps.LatLngLiteral, filterType: 'all' | 'restaurant' | 'cafe' = 'all'): Promise<any[]> => {
    // Get API key from environment variable
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google Maps API key is not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your environment variables.');
    }

    // Use the new Places API (New) - REST API endpoint
    // The new API uses specific type constants
    // For 'all' filter, we'll make separate requests for restaurants and cafes to ensure we get both
    const includedTypes = filterType === 'all' 
      ? ['restaurant'] // Will make separate call for cafes too
      : filterType === 'restaurant'
      ? ['restaurant']
      : ['cafe'];
    
    // Map the location format - new API expects latitude/longitude in a specific format
    const locationRestriction = {
      circle: {
        center: {
          latitude: location.lat,
          longitude: location.lng,
        },
        radius: 1000.0, // in meters
      },
    };

    // Field mask for the fields we want to retrieve
    // CRITICAL: For Nearby Search (New), all fields must be prefixed with 'places.'
    const fieldMask = [
      'places.name',
      'places.displayName',
      'places.formattedAddress',
      'places.types',
      'places.rating',
      'places.userRatingCount',
      'places.primaryType',
      'places.reviews',
    ].join(',');

    // Helper function to map a place from API response to app format
    const mapPlace = (place: any) => {
      const placeId = place.name ? place.name.replace('places/', '') : null;
      
      // Handle displayName - new API returns { text: "..." }
      let mappedDisplayName: any = place.displayName;
      if (place.displayName && typeof place.displayName === 'object' && place.displayName.text) {
        mappedDisplayName = {
          ...place.displayName,
          string: place.displayName.text
        };
      } else if (typeof place.displayName === 'string') {
        mappedDisplayName = place.displayName;
      }
      
      // Map reviews to match app expectations
      const mappedReviews = place.reviews ? place.reviews.map((review: any) => {
        const authorName = review.authorDisplayName || 
                         review.authorAttribution?.displayName || 
                         review.authorAttribution?.uri?.split('/').pop() || 
                         'Anonymous';
        
        // Use the API's relativePublishTimeDescription if available, otherwise calculate it
        let relativeTime = review.relativePublishTimeDescription || '';
        if (!relativeTime && review.publishTime) {
          // Fallback: calculate relative time from publishTime
          const publishDate = new Date(review.publishTime);
          const now = new Date();
          const diffMs = now.getTime() - publishDate.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          
          if (diffDays === 0) relativeTime = 'Today';
          else if (diffDays === 1) relativeTime = 'Yesterday';
          else if (diffDays < 7) relativeTime = `${diffDays} days ago`;
          else if (diffDays < 30) relativeTime = `${Math.floor(diffDays / 7)} weeks ago`;
          else if (diffDays < 365) relativeTime = `${Math.floor(diffDays / 30)} months ago`;
          else relativeTime = `${Math.floor(diffDays / 365)} years ago`;
        }
        
        // Extract timestamp for sorting (convert ISO string to Unix timestamp in seconds)
        let time = 0;
        if (review.publishTime) {
          const publishDate = new Date(review.publishTime);
          time = Math.floor(publishDate.getTime() / 1000); // Convert to Unix timestamp in seconds
        }
        
        return {
          author_name: authorName,
          rating: review.rating,
          relative_time_description: relativeTime,
          text: review.text?.text || review.text || '',
          time: time,
        };
      }) : [];
      
      return {
        ...place,
        displayName: mappedDisplayName,
        reviews: mappedReviews,
        id: place.name || placeId,
        place_id: placeId,
      };
    };

    // Helper function to make a single API request
    const makeRequest = async (types: string[]): Promise<any[]> => {
      const requestBody: any = {
        includedTypes: types,
        maxResultCount: 20,
        locationRestriction: locationRestriction,
      };

      const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': fieldMask,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: { message: response.statusText } };
        }
        
        console.error('Places API (New) error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorData,
          requestBody: requestBody,
        });
        
        const errorMessage = errorData.error?.message || errorData.message || response.statusText;
        throw new Error(
          `Places API (New) error: ${response.status} - ${errorMessage}. ` +
          `Make sure "Places API (New)" is enabled in Google Cloud Console and your API key has the correct permissions.`
        );
      }

      const data = await response.json();
      
      if (data.places && Array.isArray(data.places)) {
        // Map the response to be compatible with the app
        let mappedPlaces = data.places.map((place: any) => {
          return mapPlace(place);
        });
        
        // Filter out places with hair-related types (hair_salon, hair_care, etc.)
        const hairTypes = ['hair_salon', 'hair_care', 'beauty_salon', 'spa'];
        mappedPlaces = mappedPlaces.filter((place: any) => {
          const types = place.types || [];
          const primaryType = place.primaryType;
          
          // Exclude if it has any hair-related type
          const hasHairType = hairTypes.some(hairType => 
            types.includes(hairType) || primaryType === hairType
          );
          
          return !hasHairType;
        });
        
        return mappedPlaces;
      } else if (data.error) {
        throw new Error(`Places API (New) error: ${data.error.message || 'Unknown error'}`);
      } else {
        // No results
        return [];
      }
    };

    try {
      let allPlaces: any[] = [];
      const seenPlaceIds = new Set<string>();

      if (filterType === 'all') {
        // For 'all' filter, make separate requests for restaurants and cafes
        // This ensures we get a good mix of both types
        const [restaurants, cafes] = await Promise.all([
          makeRequest(['restaurant']),
          makeRequest(['cafe']),
        ]);

        // Combine and deduplicate results
        [...restaurants, ...cafes].forEach((place: any) => {
          const placeId = place.place_id || place.id;
          if (placeId && !seenPlaceIds.has(placeId)) {
            seenPlaceIds.add(placeId);
            allPlaces.push(place);
          } else if (!placeId) {
            // Include places without IDs (shouldn't happen, but just in case)
            allPlaces.push(place);
          }
        });

        console.log(`Combined ${allPlaces.length} unique places (${restaurants.length} restaurants, ${cafes.length} cafes)`);
      } else {
        // For specific filters, make a single request
        allPlaces = await makeRequest(includedTypes);
        console.log(`Found ${allPlaces.length} places`);
      }

      return allPlaces;
    } catch (error: any) {
      // Re-throw if it's already our formatted error
      if (error.message && error.message.includes('Places API (New)')) {
        throw error;
      }
      // Handle network errors or other issues
      console.error('Failed to fetch places:', error);
      throw new Error(`Failed to fetch places: ${error.message || 'Unknown error'}`);
    }
  }
  