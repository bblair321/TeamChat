import React, { useMemo } from "react";
import { useVirtualScroll } from "../hooks/useVirtualScroll";

const VirtualizedMessageList = React.memo(function VirtualizedMessageList({
  messages,
  renderMessage,
  itemHeight = 80,
  containerHeight = 400,
  className = "",
}) {
  const { containerRef, visibleItems, totalHeight, offsetY } = useVirtualScroll(
    messages,
    itemHeight,
    containerHeight
  );

  const containerStyle = useMemo(
    () => ({
      height: containerHeight,
      overflow: "auto",
    }),
    [containerHeight]
  );

  const innerStyle = useMemo(
    () => ({
      height: totalHeight,
      position: "relative",
    }),
    [totalHeight]
  );

  const itemsStyle = useMemo(
    () => ({
      transform: `translateY(${offsetY}px)`,
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
    }),
    [offsetY]
  );

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      className={`virtual-scroll-container ${className}`}
    >
      <div style={innerStyle}>
        <div style={itemsStyle}>
          {visibleItems.map((message) => (
            <div
              key={message.id}
              style={{ height: itemHeight }}
              className="virtual-scroll-item"
            >
              {renderMessage(message)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default VirtualizedMessageList;
