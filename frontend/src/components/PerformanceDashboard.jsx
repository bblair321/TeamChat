import React, { useState, useEffect } from "react";

const PerformanceDashboard = React.memo(function PerformanceDashboard({
  isVisible = false,
  onClose,
}) {
  const [metrics, setMetrics] = useState({});
  const [memoryUsage, setMemoryUsage] = useState(null);

  useEffect(() => {
    if (!isVisible) return;

    const updateMetrics = () => {
      // Performance metrics
      const navigation = performance.getEntriesByType("navigation")[0];
      const paint = performance.getEntriesByType("paint");

      const newMetrics = {
        loadTime: navigation
          ? navigation.loadEventEnd - navigation.loadEventStart
          : 0,
        domContentLoaded: navigation
          ? navigation.domContentLoadedEventEnd -
            navigation.domContentLoadedEventStart
          : 0,
        firstPaint: paint.find((p) => p.name === "first-paint")?.startTime || 0,
        firstContentfulPaint:
          paint.find((p) => p.name === "first-contentful-paint")?.startTime ||
          0,
      };

      setMetrics(newMetrics);

      // Memory usage
      if (performance.memory) {
        setMemoryUsage({
          used: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
          total: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2),
          limit: (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2),
        });
      }
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Performance Dashboard
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Performance Metrics
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-300">
                    Load Time
                  </span>
                  <span className="font-mono text-sm text-gray-900 dark:text-white">
                    {metrics.loadTime?.toFixed(2)}ms
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-300">
                    DOM Content Loaded
                  </span>
                  <span className="font-mono text-sm text-gray-900 dark:text-white">
                    {metrics.domContentLoaded?.toFixed(2)}ms
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-300">
                    First Paint
                  </span>
                  <span className="font-mono text-sm text-gray-900 dark:text-white">
                    {metrics.firstPaint?.toFixed(2)}ms
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-300">
                    First Contentful Paint
                  </span>
                  <span className="font-mono text-sm text-gray-900 dark:text-white">
                    {metrics.firstContentfulPaint?.toFixed(2)}ms
                  </span>
                </div>
              </div>
            </div>

            {/* Memory Usage */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Memory Usage
              </h3>

              {memoryUsage ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300">
                      Used
                    </span>
                    <span className="font-mono text-sm text-gray-900 dark:text-white">
                      {memoryUsage.used} MB
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300">
                      Total
                    </span>
                    <span className="font-mono text-sm text-gray-900 dark:text-white">
                      {memoryUsage.total} MB
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300">
                      Limit
                    </span>
                    <span className="font-mono text-sm text-gray-900 dark:text-white">
                      {memoryUsage.limit} MB
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          (parseFloat(memoryUsage.used) /
                            parseFloat(memoryUsage.limit)) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Memory usage not available in this browser
                </p>
              )}
            </div>
          </div>

          {/* Performance Tips */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
              Performance Tips
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Keep First Contentful Paint under 1.5s</li>
              <li>• Monitor memory usage to prevent leaks</li>
              <li>• Use React DevTools Profiler for component analysis</li>
              <li>• Enable service worker for offline caching</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PerformanceDashboard;
