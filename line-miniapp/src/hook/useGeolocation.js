
import { useState, useEffect, useRef } from "react";

export function useGeolocation(enabled, options = {}) {
  const [geo, setGeo] = useState(null);       // { lat, lon }
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const watchIdRef = useRef(null);

  const mergedOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 10000,
    ...options,
  };

  useEffect(() => {
    if (!enabled) {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      setError("อุปกรณ์ไม่รองรับการใช้ตำแหน่งที่ตั้ง");
      return;
    }

    setLoading(true);

    const handleSuccess = (pos) => {
      const { latitude, longitude } = pos.coords;
      const newGeo = { lat: latitude, lon: longitude };
      setGeo(newGeo);
      setLoading(false);
    };

    const handleError = (err) => {
      console.warn("Geo error:", err);
      setError(err.message);
      setLoading(false);
    };

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      mergedOptions
    );

    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      mergedOptions
    );
    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled, mergedOptions.enableHighAccuracy, mergedOptions.timeout, mergedOptions.maximumAge]);

  return { geo, error, loading };
}
