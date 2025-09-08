import React from "react";
import ChannelItem from "./ChannelItem";

const ChannelList = React.memo(function ChannelList({
  channels,
  currentChannel,
  onChannelSelect,
  onChannelDelete,
  onlineStatuses = {},
  className = "",
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      {channels.map((channel) => {
        const status = onlineStatuses[channel.id] || {
          online: false,
          count: 0,
        };
        return (
          <ChannelItem
            key={channel.id}
            channel={channel}
            isActive={currentChannel === channel.id}
            onClick={() => onChannelSelect(channel.id)}
            onDelete={() => onChannelDelete(channel.id)}
            onlineStatus={status}
          />
        );
      })}
    </div>
  );
});

export default ChannelList;
