/**
 * Utility functions for time formatting
 */

export const formatRelativeTime = (timestamp) => {
  const now = new Date();
  const messageTime = new Date(timestamp);
  const diffInSeconds = Math.floor((now - messageTime) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  } else {
    // For older messages, show the date
    return messageTime.toLocaleDateString();
  }
};

export const formatMessageTime = (timestamp, showRelative = true) => {
  const messageTime = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now - messageTime) / (1000 * 60 * 60);

  // Show relative time for messages less than 24 hours old
  if (showRelative && diffInHours < 24) {
    return formatRelativeTime(timestamp);
  }

  // Show full time for older messages
  return messageTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const shouldShowTimestamp = (currentMessage, previousMessage) => {
  if (!previousMessage) return true;

  const currentTime = new Date(currentMessage.time);
  const previousTime = new Date(previousMessage.time);
  const diffInMinutes = (currentTime - previousTime) / (1000 * 60);

  // Show timestamp if more than 5 minutes have passed
  return diffInMinutes > 5;
};
