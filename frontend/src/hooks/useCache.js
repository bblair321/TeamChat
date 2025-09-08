import { useState, useRef, useCallback } from "react";

/**
 * Custom hook for caching API responses
 * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
 * @returns {Object} Cache utilities
 */
export function useCache(ttl = 5 * 60 * 1000) {
  const cacheRef = useRef(new Map());
  const timestampsRef = useRef(new Map());

  const get = useCallback(
    (key) => {
      const timestamp = timestampsRef.current.get(key);
      if (!timestamp) return null;

      // Check if cache entry has expired
      if (Date.now() - timestamp > ttl) {
        cacheRef.current.delete(key);
        timestampsRef.current.delete(key);
        return null;
      }

      return cacheRef.current.get(key);
    },
    [ttl]
  );

  const set = useCallback((key, value) => {
    cacheRef.current.set(key, value);
    timestampsRef.current.set(key, Date.now());
  }, []);

  const has = useCallback(
    (key) => {
      return get(key) !== null;
    },
    [get]
  );

  const clear = useCallback(() => {
    cacheRef.current.clear();
    timestampsRef.current.clear();
  }, []);

  const remove = useCallback((key) => {
    cacheRef.current.delete(key);
    timestampsRef.current.delete(key);
  }, []);

  const size = cacheRef.current.size;

  return {
    get,
    set,
    has,
    clear,
    remove,
    size,
  };
}

/**
 * Custom hook for cached API calls
 * @param {Function} apiCall - The API function to call
 * @param {number} ttl - Time to live in milliseconds
 * @returns {Object} Cached API call utilities
 */
export function useCachedApi(apiCall, ttl = 5 * 60 * 1000) {
  const cache = useCache(ttl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const call = useCallback(
    async (...args) => {
      const cacheKey = JSON.stringify(args);

      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Make API call
      setLoading(true);
      setError(null);

      try {
        const result = await apiCall(...args);
        cache.set(cacheKey, result);
        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiCall, cache]
  );

  return {
    call,
    loading,
    error,
    cache,
  };
}
