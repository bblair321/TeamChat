// Performance optimization configuration

export const PERFORMANCE_CONFIG = {
  // Debounce delays
  TYPING_INDICATOR_DELAY: 300,
  SEARCH_DELAY: 500,
  API_CACHE_TTL: 5 * 60 * 1000, // 5 minutes

  // Virtual scrolling
  MESSAGE_ITEM_HEIGHT: 60,
  VIRTUAL_SCROLL_BUFFER: 5,

  // Bundle optimization
  CHUNK_SIZE_LIMIT: 244 * 1024, // 244KB
  MAX_BUNDLE_SIZE: 1024 * 1024, // 1MB

  // Memory management
  MAX_MESSAGES_IN_MEMORY: 1000,
  CLEANUP_INTERVAL: 30 * 1000, // 30 seconds
};

// Performance monitoring
export const trackPerformance = (name, fn) => {
  if (import.meta.env.DEV) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  }
  return fn();
};

// Memory usage monitoring
export const logMemoryUsage = () => {
  if (process.env.NODE_ENV === "development" && performance.memory) {
    const memory = performance.memory;
    console.log("💾 Memory Usage:", {
      used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
      usage: `${(
        (memory.usedJSHeapSize / memory.jsHeapSizeLimit) *
        100
      ).toFixed(1)}%`,
    });
  }
};

// Bundle size monitoring
export const logBundleSize = () => {
  if (import.meta.env.DEV) {
    const scripts = document.querySelectorAll("script[src]");
    let totalSize = 0;

    scripts.forEach((script) => {
      const src = script.src;
      if (src.includes("static/js/")) {
        // This is a rough estimate - actual size would need to be fetched
        console.log(`📦 Script: ${src.split("/").pop()}`);
      }
    });

    console.log(
      `📦 Total estimated bundle size: ${(totalSize / 1024).toFixed(2)} KB`
    );
  }
};

// Component render tracking
export const trackRender = (componentName) => {
  if (import.meta.env.DEV) {
    console.log(`🔄 ${componentName} rendered at ${new Date().toISOString()}`);
  }
};

// API call performance tracking
export const trackApiCall = async (apiName, apiCall) => {
  if (import.meta.env.DEV) {
    const start = performance.now();
    try {
      const result = await apiCall();
      const end = performance.now();
      console.log(`🌐 ${apiName}: ${(end - start).toFixed(2)}ms`);
      return result;
    } catch (error) {
      const end = performance.now();
      console.log(`❌ ${apiName} failed: ${(end - start).toFixed(2)}ms`);
      throw error;
    }
  }
  return apiCall();
};
