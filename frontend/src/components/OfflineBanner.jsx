import React, { useState, useEffect } from "react";
import socketService from "../socketService";

export default function OfflineBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState(socketService.getConnectionStatus());

  useEffect(() => {
    const handleConnectionStatus = (connectionStatus) => {
      setStatus(socketService.getConnectionStatus());
    };

    const handleDisconnection = (reason) => {
      setStatus(socketService.getConnectionStatus());
    };

    // Set up listeners
    socketService.onConnectionStatus(handleConnectionStatus);
    socketService.onDisconnection(handleDisconnection);

    // Update status periodically
    const interval = setInterval(() => {
      setStatus(socketService.getConnectionStatus());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    // Show banner when offline or reconnecting
    setIsVisible(!status.isOnline || status.isReconnecting);
  }, [status.isOnline, status.isReconnecting]);

  if (!isVisible) return null;

  const getBannerContent = () => {
    if (!status.isOnline) {
      return {
        message:
          "You're offline. Messages will be sent when connection is restored.",
        bgColor: "bg-red-500",
        textColor: "text-white",
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
              clipRule="evenodd"
            />
          </svg>
        ),
      };
    }

    if (status.isReconnecting) {
      return {
        message: `Reconnecting to server... (${status.reconnectAttempts}/5)`,
        bgColor: "bg-yellow-500",
        textColor: "text-white",
        icon: (
          <svg
            className="w-5 h-5 animate-spin"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
              clipRule="evenodd"
            />
          </svg>
        ),
      };
    }

    return null;
  };

  const bannerContent = getBannerContent();
  if (!bannerContent) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 ${bannerContent.bgColor} ${bannerContent.textColor} py-2 px-4 text-center text-sm font-medium`}
    >
      <div className="flex items-center justify-center space-x-2">
        {bannerContent.icon}
        <span>{bannerContent.message}</span>
        {status.pendingMessages > 0 && (
          <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
            {status.pendingMessages} message
            {status.pendingMessages !== 1 ? "s" : ""} pending
          </span>
        )}
      </div>
    </div>
  );
}
