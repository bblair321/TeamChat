import { useState } from "react";
import EmojiPicker from "./EmojiPicker";

export default function MessageReactions({
  messageId,
  reactions = {},
  onReactionAdd,
  onReactionRemove,
}) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleReactionClick = (emoji) => {
    if (reactions[emoji] && reactions[emoji].includes("You")) {
      // Remove reaction if user already reacted
      onReactionRemove(messageId, emoji);
    } else {
      // Add reaction
      onReactionAdd(messageId, emoji);
    }
  };

  const handleEmojiSelect = (emoji) => {
    onReactionAdd(messageId, emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="flex items-center gap-1 relative">
      {/* Reaction buttons */}
      {Object.entries(reactions).map(([emoji, users]) => (
        <button
          key={emoji}
          onClick={() => handleReactionClick(emoji)}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all duration-200 hover:scale-105 ${
            users.includes("You")
              ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
          }`}
        >
          <span className="text-sm">{emoji}</span>
          <span className="font-medium">{users.length}</span>
        </button>
      ))}

      {/* Add reaction button */}
      <button
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 hover:scale-110 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        title="Add reaction"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-0 mb-2 z-50">
          <EmojiPicker
            isOpen={showEmojiPicker}
            onEmojiSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}
    </div>
  );
}
