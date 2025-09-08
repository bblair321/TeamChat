import React from "react";
import UserAvatar from "./UserAvatar";

const TypingIndicator = React.memo(function TypingIndicator({
  typingUsers = [],
  allUsers = [],
}) {
  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      const user = allUsers.find((u) => u.username === typingUsers[0]);
      const displayName = user?.display_name || typingUsers[0];
      return `${displayName} is typing...`;
    } else if (typingUsers.length === 2) {
      const user1 = allUsers.find((u) => u.username === typingUsers[0]);
      const user2 = allUsers.find((u) => u.username === typingUsers[1]);
      const name1 = user1?.display_name || typingUsers[0];
      const name2 = user2?.display_name || typingUsers[1];
      return `${name1} and ${name2} are typing...`;
    } else {
      return `${typingUsers.length} people are typing...`;
    }
  };

  return (
    <div className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 animate-pulse">
      {/* Typing avatars */}
      <div className="flex -space-x-2">
        {typingUsers.slice(0, 3).map((username, index) => {
          const user = allUsers.find((u) => u.username === username);
          return (
            <div key={username} className="relative">
              <UserAvatar
                user={user}
                size="xs"
                className="border-2 border-white dark:border-gray-800"
              />
              {/* Typing animation dot */}
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
              </div>
            </div>
          );
        })}
        {typingUsers.length > 3 && (
          <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white dark:border-gray-800">
            +{typingUsers.length - 3}
          </div>
        )}
      </div>

      {/* Typing text with animated dots */}
      <div className="flex items-center space-x-1">
        <span>{getTypingText()}</span>
        <div className="flex space-x-1">
          <div
            className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          ></div>
          <div
            className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          ></div>
        </div>
      </div>
    </div>
  );
});

export default TypingIndicator;
