import React from "react";

const MessageFormatter = React.memo(function MessageFormatter({ content }) {
  // URL regex pattern
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // Formatting patterns
  const formattingPatterns = [
    // Code blocks (```code```)
    {
      pattern: /```([\s\S]*?)```/g,
      render: (match, code) => (
        <pre
          key={Math.random()}
          className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm font-mono overflow-x-auto my-2"
        >
          <code>{code.trim()}</code>
        </pre>
      ),
    },
    // Inline code (`code`)
    {
      pattern: /`([^`]+)`/g,
      render: (match, code) => (
        <code
          key={Math.random()}
          className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono"
        >
          {code}
        </code>
      ),
    },
    // Bold text (**text** or __text__)
    {
      pattern: /(\*\*|__)([^*_]+)\1/g,
      render: (match, delimiter, text) => (
        <strong key={Math.random()} className="font-bold">
          {text}
        </strong>
      ),
    },
    // Italic text (*text* or _text_)
    {
      pattern: /(\*|_)([^*_]+)\1/g,
      render: (match, delimiter, text) => (
        <em key={Math.random()} className="italic">
          {text}
        </em>
      ),
    },
    // Strikethrough text (~~text~~)
    {
      pattern: /~~([^~]+)~~/g,
      render: (match, text) => (
        <del key={Math.random()} className="line-through">
          {text}
        </del>
      ),
    },
  ];

  // Function to parse and format text
  const parseContent = (text) => {
    if (!text) return text;

    // First, handle URLs
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      // Check if this part is a URL
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline break-all"
          >
            {part}
          </a>
        );
      }

      // Apply formatting patterns to non-URL parts
      let formattedPart = part;
      const elements = [];

      formattingPatterns.forEach(({ pattern, render }) => {
        const matches = [...formattedPart.matchAll(pattern)];
        if (matches.length > 0) {
          let lastIndex = 0;
          matches.forEach((match) => {
            // Add text before the match
            if (match.index > lastIndex) {
              elements.push(
                <span key={`text-${index}-${lastIndex}`}>
                  {formattedPart.slice(lastIndex, match.index)}
                </span>
              );
            }

            // Add the formatted match
            elements.push(render(match[0], ...match.slice(1)));
            lastIndex = match.index + match[0].length;
          });

          // Add remaining text after the last match
          if (lastIndex < formattedPart.length) {
            elements.push(
              <span key={`text-${index}-${lastIndex}`}>
                {formattedPart.slice(lastIndex)}
              </span>
            );
          }

          formattedPart = elements;
        }
      });

      // If no formatting was applied, return the original part
      if (formattedPart === part) {
        return <span key={index}>{part}</span>;
      }

      return formattedPart;
    });
  };

  return <div className="message-content">{parseContent(content)}</div>;
});

export default MessageFormatter;
