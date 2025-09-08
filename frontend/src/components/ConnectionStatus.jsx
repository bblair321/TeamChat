import React, { useState, useEffect } from "react";
import socketService from "../socketService";

export default function ConnectionStatus({ className = "" }) {
  const [status, setStatus] = useState(socketService.getConnectionStatus());

  useEffect(() => {
    // Update status when connection changes
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

  const getStatusInfo = () => {
    if (!status.isOnline) {
      return {
        text: "Offline",
        color: "bg-red-500",
        icon: (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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
        text: `Reconnecting... (${status.reconnectAttempts}/5)`,
        color: "bg-yellow-500",
        icon: (
          <svg
            className="w-4 h-4 animate-spin"
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

    if (status.isConnected) {
      return {
        text: "Connected",
        color: "bg-green-500",
        icon: (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        ),
      };
    }

    return {
      text: "Disconnected",
      color: "bg-gray-500",
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
            clipRule="evenodd"
          />
        </svg>
      ),
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div
        className={`w-2 h-2 rounded-full ${statusInfo.color} animate-pulse`}
      ></div>
      <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400">
        {statusInfo.icon}
        <span>{statusInfo.text}</span>
        {status.pendingMessages > 0 && (
          <span className="text-yellow-600 dark:text-yellow-400">
            ({status.pendingMessages} pending)
          </span>
        )}
      </div>
    </div>
  );
}
