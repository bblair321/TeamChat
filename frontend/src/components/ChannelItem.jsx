import React from "react";
import ChannelIcon from "./ChannelIcon";

const ChannelItem = React.memo(function ChannelItem({
  channel,
  isActive,
  onClick,
  onDelete,
  onlineStatus = { online: false, count: 0 },
  className = "",
}) {
  return (
    <div
      className={`
        group relative w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 ease-in-out cursor-pointer
        ${
          isActive
            ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 shadow-sm"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
        }
        ${className}
      `}
      onClick={onClick}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full"></div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          {/* Channel Icon */}
          <div
            className={`
            flex-shrink-0 p-1.5 rounded-md transition-colors duration-200
            ${
              isActive
                ? "bg-blue-200 dark:bg-blue-800 text-blue-600 dark:text-blue-400"
                : "bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-500"
            }
          `}
          >
            <ChannelIcon channelName={channel.name} />
          </div>

          {/* Channel Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium truncate">
                {channel.name}
              </span>
              {isActive && (
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              )}
            </div>

            {/* Online status */}
            {onlineStatus.online && onlineStatus.count > 0 ? (
              <div className="flex items-center space-x-1 mt-0.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 dark:text-green-400">
                  {onlineStatus.count} online
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 mt-0.5">
                <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  offline
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 relative z-10">
          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
            title="Delete channel"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>

          {/* Arrow indicator */}
          <div className="flex-shrink-0">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ChannelItem;
