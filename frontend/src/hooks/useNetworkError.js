import { useState, useEffect, useCallback } from "react";
import {
  getErrorType,
  isRetryableError,
  getRetryDelay,
} from "../utils/errorMessages";

/**
 * Custom hook for handling network errors with retry logic
 */
export function useNetworkError() {
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  const handleError = useCallback((err, context = "") => {
    const errorType = getErrorType(err);
    const canRetry = isRetryableError(err);

    setError({
      ...err,
      type: errorType,
      canRetry,
      context,
      timestamp: Date.now(),
    });
  }, []);

  const retry = useCallback(
    async (retryFn) => {
      if (!retryFn || !error?.canRetry) return;

      setIsRetrying(true);
      const delay = getRetryDelay(retryCount);

      try {
        // Wait for the delay
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Attempt the retry
        await retryFn();

        // Success - clear error
        clearError();
      } catch (err) {
        // Retry failed - increment count and update error
        setRetryCount((prev) => prev + 1);
        handleError(err, error.context);
      } finally {
        setIsRetrying(false);
      }
    },
    [error, retryCount, clearError, handleError]
  );

  // Auto-retry for network errors (with exponential backoff)
  useEffect(() => {
    if (error?.canRetry && retryCount < 3) {
      const timer = setTimeout(() => {
        // Auto-retry logic could be implemented here
        // For now, we'll let the user manually retry
      }, getRetryDelay(retryCount));

      return () => clearTimeout(timer);
    }
  }, [error, retryCount]);

  return {
    error,
    retryCount,
    isRetrying,
    clearError,
    handleError,
    retry,
  };
}

/**
 * Hook for handling API errors with automatic retry
 */
export function useApiError() {
  const networkError = useNetworkError();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (networkError.error?.type === "network") {
        networkError.clearError();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      networkError.handleError(
        new Error("You are offline. Please check your connection."),
        "Network connection"
      );
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [networkError]);

  const executeWithRetry = useCallback(
    async (apiCall, maxRetries = 3) => {
      let lastError;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await apiCall();
          networkError.clearError();
          return result;
        } catch (err) {
          lastError = err;

          // Don't retry on authentication errors
          if (err.response?.status === 401 || err.response?.status === 403) {
            break;
          }

          // Don't retry on validation errors
          if (err.response?.status === 400 || err.response?.status === 422) {
            break;
          }

          // Retry on network/server errors
          if (attempt < maxRetries && isRetryableError(err)) {
            const delay = getRetryDelay(attempt);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }

          // Max retries reached or non-retryable error
          break;
        }
      }

      // All retries failed
      networkError.handleError(lastError, "API request");
      throw lastError;
    },
    [networkError]
  );

  return {
    ...networkError,
    isOnline,
    executeWithRetry,
  };
}
