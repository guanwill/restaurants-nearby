export async function fetchNearbyRestaurants(location: google.maps.LatLngLiteral): Promise<any[]> {
    if (!window.google?.maps?.places) {
      throw new Error('Google Maps Places API not loaded. Make sure the script is loaded correctly.');
    }

    const placesApi = window.google.maps.places as any;
    
    // First, try the new Places API (New) searchNearby
    // Note: The new API might not be available in the JS SDK yet, or might require different setup
    if (typeof placesApi.searchNearby === 'function') {
      const request = {
        includedTypes: ['restaurant'],
        maxResultCount: 20,
        locationRestriction: {
          center: location,
          radius: 500,
        },
        fields: ['id', 'displayName', 'formattedAddress', 'rating', 'userRatingCount', 'types', 'primaryType'],
      };

      return new Promise<any[]>((resolve, reject) => {
        placesApi.searchNearby(request, (results: any, status: any) => {
          if (status === 'OK' && results?.places) {
            resolve(results.places);
          } else if (status === 'ZERO_RESULTS') {
            resolve([]);
          } else {
            reject(new Error(`Places API (New) error: ${status}`));
          }
        });
      });
    }
    
    // Fallback to legacy PlacesService if new API is not available
    // This requires "Places API" (legacy) to be enabled in Google Cloud Console
    if (typeof placesApi.PlacesService === 'function') {
      return new Promise<any[]>((resolve, reject) => {
        const map = new google.maps.Map(document.createElement('div'));
        const service = new placesApi.PlacesService(map);

        const request: google.maps.places.PlaceSearchRequest = {
          location,
          radius: 500,
          type: 'restaurant',
        };

        service.nearbySearch(request, (results: any, status: any) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            // Fetch additional details for each place to get more information
            // Note: This makes additional API calls, but provides more detailed data
            const detailPromises = results.map((place: any) => {
              return new Promise<any>((detailResolve) => {
                if (!place.place_id) {
                  detailResolve(place);
                  return;
                }
                
                const detailRequest = {
                  placeId: place.place_id,
                  fields: ['name', 'rating', 'user_ratings_total', 'formatted_address', 'vicinity', 'types', 'editorial_summary', 'price_level', 'opening_hours', 'reviews'],
                };

                service.getDetails(detailRequest, (placeDetails: any, detailStatus: any) => {
                  if (detailStatus === google.maps.places.PlacesServiceStatus.OK && placeDetails) {
                    // Merge additional details with original result
                    detailResolve({ ...place, ...placeDetails });
                  } else {
                    detailResolve(place);
                  }
                });
              });
            });

            Promise.all(detailPromises).then((enrichedResults) => {
              resolve(enrichedResults);
            });
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            resolve([]);
          } else {
            reject(new Error(`PlacesService error: ${status}. Make sure "Places API" (legacy) is enabled in Google Cloud Console.`));
          }
        });
      });
    }
    
    // If neither is available, log what's available and throw helpful error
    console.log('Available on google.maps.places:', Object.keys(placesApi));
    console.log('Type of placesApi:', typeof placesApi);
    
    throw new Error(
      'Neither Places API (New) nor PlacesService is available. ' +
      'Please enable one of the following in Google Cloud Console: ' +
      '1. "Places API (New)" for the new API, or ' +
      '2. "Places API" (legacy) for PlacesService. ' +
      'Check the browser console for available methods.'
    );
  }
  