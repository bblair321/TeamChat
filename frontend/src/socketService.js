import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentChannel = null;
    this.token = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.isReconnecting = false;
    this.isOnline = navigator.onLine;
    this.pendingMessages = []; // Queue for messages when offline
    this.connectionListeners = [];
    this.disconnectionListeners = [];
    this.errorListeners = [];

    // Set up online/offline detection
    this.setupOnlineDetection();
  }

  // Set up online/offline detection
  setupOnlineDetection() {
    window.addEventListener("online", () => {
      console.log("Network connection restored");
      this.isOnline = true;
      this.notifyConnectionListeners("online");

      // Attempt to reconnect if we were disconnected
      if (!this.isConnected && this.token) {
        this.connect(this.token);
      }
    });

    window.addEventListener("offline", () => {
      console.log("Network connection lost");
      this.isOnline = false;
      this.notifyConnectionListeners("offline");
    });
  }

  // Connect to the WebSocket server
  connect(token) {
    console.log("Attempting to connect to WebSocket server...");

    // Don't connect if offline
    if (!this.isOnline) {
      console.log("Cannot connect: device is offline");
      return;
    }

    // Don't connect if already connected
    if (this.socket && this.isConnected) {
      return;
    }

    // Store token for reconnection
    this.token = token;
    this.reconnectAttempts = 0;
    this.isReconnecting = false;

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

    // Disconnect existing socket if any
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(API_URL, {
      auth: {
        token: token,
      },
      transports: ["polling"],
      upgrade: false,
      timeout: 20000,
      forceNew: true,
      reconnection: false, // We'll handle reconnection manually
    });

    this.setupSocketListeners();
  }

  // Set up all socket event listeners
  setupSocketListeners() {
    this.socket.on("connect", () => {
      console.log("Connected to WebSocket server");
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.isReconnecting = false;

      console.log("Socket connected state:", this.socket.connected);
      console.log("Socket ID:", this.socket.id);

      // Notify connection listeners
      this.notifyConnectionListeners("connected");

      // Rejoin current channel if we have one
      if (this.currentChannel && this.token) {
        this.joinChannel(this.currentChannel, this.token);
      }

      // Send any pending messages
      this.sendPendingMessages();
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Disconnected from WebSocket server:", reason);
      this.isConnected = false;

      // Notify disconnection listeners
      this.notifyDisconnectionListeners(reason);

      // Attempt to reconnect if it wasn't a manual disconnect
      if (reason !== "io client disconnect" && this.isOnline) {
        this.attemptReconnection();
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      this.notifyErrorListeners(error);

      // Attempt to reconnect
      if (this.isOnline) {
        this.attemptReconnection();
      }
    });

    this.socket.on("error", (error) => {
      console.error("WebSocket error:", error);
      this.notifyErrorListeners(error);
    });
  }

  // Attempt to reconnect with exponential backoff
  attemptReconnection() {
    if (
      this.isReconnecting ||
      this.reconnectAttempts >= this.maxReconnectAttempts
    ) {
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    console.log(
      `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay}ms`
    );

    setTimeout(() => {
      if (this.isOnline && this.token) {
        this.connect(this.token);
      }
      this.isReconnecting = false;
    }, this.reconnectDelay);

    // Exponential backoff with jitter
    this.reconnectDelay = Math.min(
      this.reconnectDelay * 2 + Math.random() * 1000,
      this.maxReconnectDelay
    );
  }

  // Send pending messages when reconnected
  sendPendingMessages() {
    if (this.pendingMessages.length > 0) {
      console.log(`Sending ${this.pendingMessages.length} pending messages`);

      this.pendingMessages.forEach(({ channelId, content, token }) => {
        this.sendMessage(channelId, content, token);
      });

      this.pendingMessages = [];
    }
  }

  // Notify connection listeners
  notifyConnectionListeners(status) {
    this.connectionListeners.forEach((callback) => {
      try {
        callback(status);
      } catch (error) {
        console.error("Error in connection listener:", error);
      }
    });
  }

  // Notify disconnection listeners
  notifyDisconnectionListeners(reason) {
    this.disconnectionListeners.forEach((callback) => {
      try {
        callback(reason);
      } catch (error) {
        console.error("Error in disconnection listener:", error);
      }
    });
  }

  // Notify error listeners
  notifyErrorListeners(error) {
    this.errorListeners.forEach((callback) => {
      try {
        callback(error);
      } catch (error) {
        console.error("Error in error listener:", error);
      }
    });
  }

  // Disconnect from the WebSocket server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentChannel = null;
      this.token = null;
      this.reconnectAttempts = 0;
      this.isReconnecting = false;
      this.pendingMessages = [];
    }
  }

  // Join a channel
  joinChannel(channelId, token) {
    if (!this.socket || !this.isConnected) {
      console.error("Socket not connected");
      return;
    }

    // Leave current channel if any
    if (this.currentChannel) {
      this.leaveChannel(this.currentChannel);
    }

    this.socket.emit("join_channel", {
      channel_id: channelId,
      token: token,
    });

    this.currentChannel = channelId;
    console.log(`Joined channel ${channelId}`);
  }

  // Leave a channel
  leaveChannel(channelId, token = null) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit("leave_channel", {
      channel_id: channelId,
      token: token,
    });

    if (this.currentChannel === channelId) {
      this.currentChannel = null;
    }
    console.log(`Left channel ${channelId}`);
  }

  // Send a message
  sendMessage(channelId, content, token) {
    if (!this.isOnline) {
      console.log("Device is offline, queuing message");
      this.pendingMessages.push({ channelId, content, token });
      return;
    }

    if (!this.socket || !this.isConnected) {
      console.log("Socket not connected, queuing message");
      this.pendingMessages.push({ channelId, content, token });

      // Attempt to reconnect if we have a token
      if (this.token && !this.isReconnecting) {
        this.attemptReconnection();
      }
      return;
    }

    this.socket.emit("send_message", {
      channel_id: channelId,
      content: content,
      token: token,
    });
  }

  // Set up message listener
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on("new_message", callback);
    }
  }

  // Set up typing indicator listener
  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on("user_typing", callback);
    }
  }

  // Set up status listener
  onStatus(callback) {
    if (this.socket) {
      this.socket.on("status", callback);
    }
  }

  // Set up error listener
  onError(callback) {
    this.errorListeners.push(callback);
    if (this.socket) {
      this.socket.on("error", callback);
    }
  }

  // Set up online status listener
  onOnlineStatus(callback) {
    if (this.socket) {
      this.socket.on("online_status", callback);
    }
  }

  // Set up connection status listener
  onConnectionStatus(callback) {
    this.connectionListeners.push(callback);
  }

  // Set up disconnection listener
  onDisconnection(callback) {
    this.disconnectionListeners.push(callback);
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isOnline: this.isOnline,
      isReconnecting: this.isReconnecting,
      reconnectAttempts: this.reconnectAttempts,
      pendingMessages: this.pendingMessages.length,
    };
  }

  // Wait for connection to be established
  waitForConnection() {
    return new Promise((resolve) => {
      if (this.isConnected) {
        resolve();
        return;
      }

      this.socket.on("connect", () => {
        resolve();
      });
    });
  }

  // Remove all listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  // Send typing indicator
  sendTypingIndicator(channelId, isTyping, token) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit("typing", {
      channel_id: channelId,
      is_typing: isTyping,
      token: token,
    });
  }
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService;
