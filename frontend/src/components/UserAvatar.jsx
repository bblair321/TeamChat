import React from "react";

const UserAvatar = React.memo(function UserAvatar({
  user,
  size = "md",
  showOnlineStatus = false,
  className = "",
}) {
  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
    xl: "w-16 h-16 text-xl",
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = user?.display_name || user?.username || "Unknown";
  const initials = getInitials(displayName);

  return (
    <div className={`relative ${className}`}>
      {/* Avatar */}
      <div
        className={`
          ${sizeClasses[size]}
          rounded-full flex items-center justify-center font-semibold
          bg-gradient-to-br from-blue-500 to-purple-600 text-white
          shadow-sm border-2 border-white dark:border-gray-800
        `}
      >
        {user?.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={displayName}
            className="w-full h-full rounded-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        ) : null}
        <span
          className={`${
            user?.avatar_url ? "hidden" : "flex"
          } items-center justify-center w-full h-full`}
        >
          {initials}
        </span>
      </div>

      {/* Online status indicator */}
      {showOnlineStatus && (
        <div
          className={`
            absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800
            ${user?.is_online ? "bg-green-500" : "bg-gray-400"}
            ${size === "xs" ? "w-2 h-2" : ""}
          `}
        />
      )}
    </div>
  );
});

export default UserAvatar;
