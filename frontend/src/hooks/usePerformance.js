import { useEffect, useRef } from "react";

/**
 * Custom hook for performance monitoring
 * @param {string} componentName - Name of the component for logging
 * @returns {Object} Performance utilities
 */
export function usePerformance(componentName) {
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef(Date.now());

  useEffect(() => {
    renderCountRef.current += 1;

    if (import.meta.env.DEV) {
      console.log(`${componentName} rendered ${renderCountRef.current} times`);
    }
  });

  useEffect(() => {
    const mountTime = Date.now() - mountTimeRef.current;

    if (import.meta.env.DEV) {
      console.log(`${componentName} mounted in ${mountTime}ms`);
    }

    return () => {
      if (import.meta.env.DEV) {
        console.log(
          `${componentName} unmounted after ${renderCountRef.current} renders`
        );
      }
    };
  }, [componentName]);

  const measureRender = (callback) => {
    const start = performance.now();
    const result = callback();
    const end = performance.now();

    if (import.meta.env.DEV) {
      console.log(`${componentName} render took ${end - start}ms`);
    }

    return result;
  };

  return {
    renderCount: renderCountRef.current,
    measureRender,
  };
}

/**
 * Custom hook for measuring component performance
 * @param {string} componentName - Name of the component
 * @returns {Function} Function to measure performance
 */
export function useMeasurePerformance(componentName) {
  const startTimeRef = useRef(null);

  const startMeasure = () => {
    startTimeRef.current = performance.now();
  };

  const endMeasure = (operation = "operation") => {
    if (startTimeRef.current) {
      const duration = performance.now() - startTimeRef.current;

      if (import.meta.env.DEV) {
        console.log(
          `${componentName} ${operation} took ${duration.toFixed(2)}ms`
        );
      }

      startTimeRef.current = null;
      return duration;
    }
    return 0;
  };

  return {
    startMeasure,
    endMeasure,
  };
}
