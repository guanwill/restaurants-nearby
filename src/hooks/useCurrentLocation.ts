import { useEffect, useState } from 'react';

export interface Coordinates {
  lat: number;
  lng: number;
}

export const useCurrentLocation = () => {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        setError('Location permission denied');
      },
      { enableHighAccuracy: true }
    );
  }, []);

  return { location, error };
}
