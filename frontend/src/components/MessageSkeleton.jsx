import React from "react";

export default function MessageSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      {/* Avatar skeleton */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>

      {/* Message content skeleton */}
      <div className="flex-1 min-w-0">
        {/* Username and timestamp skeleton */}
        <div className="flex items-baseline gap-2 mb-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
        </div>

        {/* Message bubble skeleton */}
        <div className="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
          <div className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-2xl">
            <div className="space-y-1">
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MessageSkeletonList({ count = 5 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <MessageSkeleton key={index} />
      ))}
    </div>
  );
}
