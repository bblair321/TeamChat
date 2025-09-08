import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  getChannels,
  createChannel,
  getMessages,
  addReaction,
  removeReaction,
  deleteChannel,
  getProfile,
  getUsers,
  updateOnlineStatus,
} from "../api";
import { useNavigate } from "react-router-dom";
import socketService from "../socketService";
import ThemeToggle from "../components/ThemeToggle";
import MessageReactions from "../components/MessageReactions";
import EmojiPicker from "../components/EmojiPicker";
import UserAvatar from "../components/UserAvatar";
import MessageFormatter from "../components/MessageFormatter";
import { MessageSkeletonList } from "../components/MessageSkeleton";
import { formatMessageTime, shouldShowTimestamp } from "../utils/timeUtils";
import TypingIndicator from "../components/TypingIndicator";
import LoadingSpinner, { LoadingDots } from "../components/LoadingSpinner";
import { EmptyMessages, EmptyChannels } from "../components/EmptyState";
import ChannelList from "../components/ChannelList";
import ErrorMessage from "../components/ErrorMessage";
import EnhancedErrorMessage from "../components/EnhancedErrorMessage";
import SuccessMessage from "../components/SuccessMessage";
import ConnectionStatus from "../components/ConnectionStatus";
import OfflineBanner from "../components/OfflineBanner";
import PerformanceDashboard from "../components/PerformanceDashboard";
import {
  validateMessage,
  validateChannelName,
  sanitizeInput,
  getErrorMessage,
} from "../utils/validation";
import { useDebouncedCallback } from "../hooks/useDebounce";
import { usePerformance } from "../hooks/usePerformance";
import { useToast } from "../contexts/ToastContext";

const ChatPage = React.memo(function ChatPage() {
  const navigate = useNavigate();

  // State
  const [channels, setChannels] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [newChannelName, setNewChannelName] = useState("");
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    channelId: null,
    channelName: "",
  });
  const [sendingMessage, setSendingMessage] = useState(false);
  const [onlineStatuses, setOnlineStatuses] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [messageError, setMessageError] = useState("");
  const [channelError, setChannelError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [showPerformanceDashboard, setShowPerformanceDashboard] =
    useState(false);

  // Refs
  const messagesContainerRef = useRef(null);

  // Auto-scroll function
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, []);

  // Memoized values for performance
  const currentChannelData = useMemo(() => {
    return Array.isArray(channels)
      ? channels.find((channel) => channel.id === currentChannel)
      : null;
  }, [channels, currentChannel]);

  const filteredMessages = useMemo(() => {
    if (!Array.isArray(messages)) {
      return [];
    }
    return messages.filter((message) => message.channel_id === currentChannel);
  }, [messages, currentChannel]);

  const channelCount = useMemo(() => {
    return Array.isArray(channels) ? channels.length : 0;
  }, [channels]);

  // Performance monitoring
  usePerformance("ChatPage");

  // Toast notifications
  const { showSuccess, showError, showNetworkError } = useToast();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + Shift + P to open performance dashboard
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "P") {
        e.preventDefault();
        setShowPerformanceDashboard(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Debounced typing indicator
  const debouncedTypingIndicator = useDebouncedCallback((isTyping) => {
    if (currentChannel && getToken()) {
      socketService.sendTypingIndicator(currentChannel, isTyping, getToken());
    }
  }, 300);

  // Get token from localStorage
  const getToken = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return null;
    }
    return token;
  }, [navigate]);

  // Initialize WebSocket connection and event listeners
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    // Connect to WebSocket
    socketService.connect(token);

    // Set up event listeners
    socketService.onNewMessage((messageData) => {
      setMessages((prevMessages) => {
        // Remove any optimistic messages with the same content
        const filteredMessages = prevMessages.filter(
          (msg) =>
            !(
              msg.isOptimistic &&
              msg.content === messageData.content &&
              msg.channel_id === messageData.channel_id
            )
        );

        // Add the real message
        return [...filteredMessages, messageData];
      });
    });

    socketService.onUserTyping((data) => {
      if (data.is_typing) {
        setTypingUsers((prev) => [...new Set([...prev, data.user])]);
      } else {
        setTypingUsers((prev) => prev.filter((user) => user !== data.user));
      }
    });

    socketService.onStatus((data) => {
      // Status updates can be used for connection status if needed
    });

    socketService.onError((error) => {
      console.error("WebSocket error:", error);
    });

    // Set up online status listener
    socketService.onOnlineStatus((data) => {
      console.log("Online status update:", data);
      setOnlineStatuses((prev) => ({
        ...prev,
        [data.channel_id]: {
          online: data.online_count > 0,
          count: data.online_count,
        },
      }));
    });

    // Set up connection status listener
    socketService.onConnectionStatus((status) => {
      console.log("Connection status:", status);
      if (status === "connected") {
        setSuccess("Connected to chat server");
        setTimeout(() => setSuccess(""), 3000);
      } else if (status === "offline") {
        setError(
          "You're offline. Messages will be queued until connection is restored."
        );
      }
    });

    // Set up disconnection listener
    socketService.onDisconnection((reason) => {
      console.log("Disconnected:", reason);
      if (reason !== "io client disconnect") {
        setError("Connection lost. Attempting to reconnect...");
      }
    });

    // Cleanup function
    return () => {
      socketService.removeAllListeners();
      socketService.disconnect();
      // Set user offline when component unmounts
      updateOnlineStatus(false).catch(console.error);
    };
  }, [getToken]);

  // Fetch user data and channels on load
  useEffect(() => {
    const fetchInitialData = async () => {
      const token = getToken();
      if (!token) return;

      try {
        setLoading(true);

        // Fetch user profile and all users in parallel
        const [profileResponse, usersResponse, channelsResponse] =
          await Promise.all([getProfile(), getUsers(), getChannels()]);

        setCurrentUser(profileResponse.data);
        setAllUsers(usersResponse.data);
        setChannels(channelsResponse.data);

        // Set online status
        await updateOnlineStatus(true);

        if (channelsResponse.data.length > 0) {
          setCurrentChannel(channelsResponse.data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
        if (err.response?.status === 401 || err.response?.status === 422) {
          // Token might be invalid, redirect to login
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          const errorMessage = getErrorMessage(err);
          setError(errorMessage);
          showError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [getToken, navigate]);

  // Join channel when currentChannel changes
  useEffect(() => {
    if (!currentChannel) return;

    const token = getToken();
    if (!token) return;

    // Join the channel via WebSocket
    const joinChannel = async () => {
      try {
        // Wait for WebSocket connection if not already connected
        if (!socketService.isConnected) {
          await socketService.waitForConnection();
        }
        socketService.joinChannel(currentChannel, token);
      } catch (error) {
        console.error("Failed to join channel:", error);
      }
    };

    joinChannel();

    // Fetch existing messages
    const fetchMessages = async () => {
      try {
        const data = await getMessages(currentChannel);
        setMessages(data.data);
        // Auto-scroll to bottom after loading messages
        setTimeout(scrollToBottom, 200);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
        alert("Failed to fetch messages");
      }
    };
    fetchMessages();
  }, [currentChannel, getToken, scrollToBottom]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (filteredMessages.length > 0) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(scrollToBottom, 100);
    }
  }, [filteredMessages, scrollToBottom]);

  // Send message
  const handleSend = async () => {
    // Clear previous errors
    setMessageError("");

    // Validate message
    const messageValidation = validateMessage(newMessage);
    if (!messageValidation.isValid) {
      setMessageError(messageValidation.errors[0]);
      return;
    }

    if (!currentChannel) {
      setMessageError("Please select a channel");
      return;
    }

    const token = getToken();
    if (!token) return;

    try {
      setSendingMessage(true);

      // Sanitize message content
      const sanitizedMessage = sanitizeInput(newMessage);

      // Create optimistic message (show immediately)
      const optimisticMessage = {
        id: `temp_${Date.now()}`, // Temporary ID
        content: sanitizedMessage,
        user: "You", // Will be replaced with actual username from server
        time: new Date().toISOString(),
        channel_id: currentChannel,
        isOptimistic: true, // Flag to identify optimistic messages
      };

      // Add to messages immediately for instant feedback
      setMessages((prevMessages) => [...prevMessages, optimisticMessage]);

      // Auto-scroll to bottom after adding optimistic message
      setTimeout(scrollToBottom, 100);

      // Clear input immediately
      setNewMessage("");

      // Send message via WebSocket
      socketService.sendMessage(currentChannel, newMessage, token);

      // Fallback: Remove optimistic message after 10 seconds if not confirmed
      setTimeout(() => {
        setMessages((prevMessages) => {
          const stillHasOptimistic = prevMessages.some(
            (msg) => msg.id === optimisticMessage.id
          );
          if (stillHasOptimistic) {
            return prevMessages.filter(
              (msg) => msg.id !== optimisticMessage.id
            );
          }
          return prevMessages;
        });
      }, 10000);
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  // Create channel
  const handleCreateChannel = async () => {
    // Clear previous errors
    setChannelError("");

    // Validate channel name
    const channelValidation = validateChannelName(newChannelName);
    if (!channelValidation.isValid) {
      setChannelError(channelValidation.errors[0]);
      return;
    }

    const token = getToken();
    if (!token) return;

    try {
      // Sanitize channel name
      const sanitizedChannelName = sanitizeInput(newChannelName);

      await createChannel({ name: sanitizedChannelName });
      const data = await getChannels();
      setChannels(data.data);
      setNewChannelName("");
      setSuccess("Channel created successfully!");
      showSuccess(`Channel "${sanitizedChannelName}" created successfully!`);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Failed to create channel:", err);
      const errorMessage = getErrorMessage(err);
      setChannelError(errorMessage);
      showError(errorMessage);
    }
  };

  // Handle reaction add
  const handleReactionAdd = async (messageId, emoji) => {
    const token = getToken();
    if (!token) return;

    try {
      await addReaction(messageId, emoji);
      // Refresh messages to show updated reactions
      const data = await getMessages(currentChannel);
      setMessages(data.data);
    } catch (err) {
      console.error("Failed to add reaction:", err);
      // Don't show error for duplicate reactions - this is expected behavior
      if (err.response?.data?.error !== "Already reacted with this emoji") {
        console.error("Error response:", err.response?.data);
      }
    }
  };

  // Handle reaction remove
  const handleReactionRemove = async (messageId, emoji) => {
    const token = getToken();
    if (!token) return;

    try {
      await removeReaction(messageId, emoji);
      // Refresh messages to show updated reactions
      const data = await getMessages(currentChannel);
      setMessages(data.data);
    } catch (err) {
      console.error("Failed to remove reaction:", err);
    }
  };

  // Handle channel deletion request (show confirmation)
  const handleDeleteChannel = (channelId) => {
    const channel = channels.find((c) => c.id === channelId);
    if (channel) {
      setDeleteConfirm({ show: true, channelId, channelName: channel.name });
    }
  };

  // Confirm channel deletion
  const confirmDeleteChannel = async () => {
    const { channelId } = deleteConfirm;
    const token = getToken();
    if (!token) return;

    try {
      await deleteChannel(channelId);

      // Refresh channels list
      const data = await getChannels();
      setChannels(data.data);

      // If we deleted the current channel, switch to the first available channel
      if (currentChannel === channelId) {
        if (data.data.length > 0) {
          setCurrentChannel(data.data[0].id);
        } else {
          setCurrentChannel(null);
          setMessages([]);
        }
      }

      setSuccess("Channel deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Failed to delete channel:", err);
      setChannelError(getErrorMessage(err));
    } finally {
      setDeleteConfirm({ show: false, channelId: null, channelName: "" });
    }
  };

  // Cancel channel deletion
  const cancelDeleteChannel = () => {
    setDeleteConfirm({ show: false, channelId: null, channelName: "" });
  };

  // Handle emoji selection for message input
  const handleInputEmojiSelect = (emoji) => {
    setNewMessage((prev) => prev + emoji);
    setShowInputEmojiPicker(false);
  };

  // Handle key down events for message input
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showInputEmojiPicker &&
        !event.target.closest(".emoji-picker-container")
      ) {
        setShowInputEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showInputEmojiPicker]);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-xl text-gray-600 dark:text-gray-300 mb-4">
            Loading channels...
          </div>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // Show message if no channels exist
  if (!Array.isArray(channels) || channels.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-end mb-4">
            <ThemeToggle />
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-lg">
            <EmptyChannels />
            <div className="mt-6">
              {channelError && (
                <div className="mb-3">
                  <ErrorMessage
                    error={channelError}
                    onDismiss={() => setChannelError("")}
                  />
                </div>
              )}
              <div className="flex justify-center gap-2">
                <input
                  className={`border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 p-3 flex-1 rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                    channelError
                      ? "border-red-300 dark:border-red-600 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:ring-green-500"
                  }`}
                  placeholder="New channel name"
                  value={newChannelName}
                  onChange={(e) => {
                    setNewChannelName(e.target.value);
                    if (channelError) setChannelError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateChannel()}
                />
                <button
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-md transition-colors font-medium"
                  onClick={handleCreateChannel}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Delete Confirmation Dialog */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Delete Channel
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Are you sure you want to delete the channel{" "}
                <strong>"{deleteConfirm.channelName}"</strong>? This action
                cannot be undone and will delete all messages in this channel.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelDeleteChannel}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteChannel}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offline Banner */}
      <OfflineBanner />

      {/* Global Error and Success Messages */}
      {error && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <EnhancedErrorMessage
            error={error}
            onDismiss={() => setError("")}
            onRetry={() => window.location.reload()}
            showRetry={true}
            context="Chat application"
          />
        </div>
      )}
      {success && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <SuccessMessage message={success} onDismiss={() => setSuccess("")} />
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed lg:relative lg:translate-x-0 z-40 lg:z-auto
        w-72 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        flex flex-col
      `}
      >
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.369 4.369 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  TeamChat
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {Array.isArray(channels) ? channels.length : 0} channel
                  {Array.isArray(channels) && channels.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ConnectionStatus />
              <ThemeToggle />
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Create channel */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 px-1">
              Create Channel
            </h3>
            <div className="flex gap-2">
              <input
                className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 p-2 flex-1 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                placeholder="Channel name"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateChannel()}
              />
              <button
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors text-sm font-medium flex-shrink-0 whitespace-nowrap"
                onClick={handleCreateChannel}
              >
                Create
              </button>
            </div>
          </div>

          {/* Channel list */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 px-1">
                Channels
              </h3>
              <ChannelList
                channels={channels}
                currentChannel={currentChannel}
                onlineStatuses={onlineStatuses}
                onChannelSelect={async (channelId) => {
                  const token = getToken();
                  if (!token) return;

                  // Leave current channel if switching
                  if (currentChannel && currentChannel !== channelId) {
                    socketService.leaveChannel(currentChannel, token);
                  }

                  setCurrentChannel(channelId);
                  setIsSidebarOpen(false);
                  setMessagesLoading(true);

                  try {
                    const data = await getMessages(channelId);
                    setMessages(data.data);
                    // Auto-scroll to bottom after loading messages
                    setTimeout(scrollToBottom, 200);
                  } catch (err) {
                    console.error("Failed to fetch messages:", err);
                  } finally {
                    setMessagesLoading(false);
                  }
                }}
                onChannelDelete={handleDeleteChannel}
              />
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              className="w-full flex items-center space-x-3 px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all duration-200 group"
              onClick={handleLogout}
            >
              <div className="flex-shrink-0 p-1.5 rounded-md bg-gray-100 dark:bg-gray-600 group-hover:bg-red-100 dark:group-hover:bg-red-800 transition-colors">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 relative z-50">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg
              className="w-6 h-6 text-gray-600 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            #{" "}
            {Array.isArray(channels)
              ? channels.find((c) => c.id === currentChannel)?.name || "General"
              : "General"}
          </h3>
          <button
            onClick={() => navigate("/profile")}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Edit Profile"
          >
            <svg
              className="w-6 h-6 text-gray-600 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </button>
        </div>

        {/* Channel header - Desktop Only */}
        <div className="hidden lg:flex lg:items-center lg:justify-between bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 mb-4 rounded-t-lg">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            #{" "}
            {Array.isArray(channels)
              ? channels.find((c) => c.id === currentChannel)?.name || "General"
              : "General"}
          </h3>
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Edit Profile"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Profile
          </button>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 lg:p-6"
        >
          {messagesLoading ? (
            <MessageSkeletonList count={5} />
          ) : messages.length === 0 ? (
            <EmptyMessages />
          ) : (
            <div className="space-y-4">
              {messages.map((m, index) => {
                const isOptimistic = m.isOptimistic;
                const showAvatar =
                  index === 0 || messages[index - 1].user !== m.user;
                const showTimestamp = shouldShowTimestamp(
                  m,
                  messages[index - 1]
                );

                return (
                  <div
                    key={m.id}
                    className={`flex gap-3 transition-all duration-300 ease-in-out ${
                      showAvatar ? "mt-4" : "mt-1"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {showAvatar ? (
                        <UserAvatar
                          user={allUsers.find((u) => u.username === m.user)}
                          size="sm"
                          showOnlineStatus={true}
                        />
                      ) : (
                        <div className="w-8 h-8"></div>
                      )}
                    </div>

                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                      {/* Username and timestamp */}
                      {showAvatar && (
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                            {allUsers.find((u) => u.username === m.user)
                              ?.display_name || m.user}
                          </span>
                          <span
                            className="text-gray-500 dark:text-gray-400 text-xs"
                            title={new Date(m.time).toLocaleString()}
                          >
                            {formatMessageTime(m.time)}
                          </span>
                          {isOptimistic && (
                            <span className="text-gray-500 dark:text-gray-400 text-xs italic">
                              (sending...)
                            </span>
                          )}
                        </div>
                      )}

                      {/* Message bubble */}
                      <div
                        className={`relative max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl ${
                          isOptimistic ? "opacity-70" : ""
                        }`}
                      >
                        <div
                          className={`px-4 py-2 rounded-2xl shadow-sm transition-all duration-200 ease-in-out ${
                            isOptimistic
                              ? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600"
                          }`}
                        >
                          <div className="text-sm leading-relaxed break-words">
                            <MessageFormatter content={m.content} />
                          </div>
                        </div>

                        {/* Message tail */}
                        {!isOptimistic && (
                          <div className="absolute -left-1 top-3 w-3 h-3 bg-white dark:bg-gray-800 border-l border-b border-gray-200 dark:border-gray-600 transform rotate-45"></div>
                        )}
                      </div>

                      {/* Message reactions */}
                      {!isOptimistic && (
                        <div className="mt-2 ml-2">
                          <MessageReactions
                            messageId={m.id}
                            reactions={m.reactions || {}}
                            onReactionAdd={handleReactionAdd}
                            onReactionRemove={handleReactionRemove}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Enhanced Typing Indicator */}
              <TypingIndicator typingUsers={typingUsers} allUsers={allUsers} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="p-4 lg:p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          {messageError && (
            <div className="mb-3">
              <ErrorMessage
                error={messageError}
                onDismiss={() => setMessageError("")}
              />
            </div>
          )}
          <div className="relative">
            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    if (messageError) setMessageError("");
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className={`
                    w-full px-4 py-3 pr-12 border rounded-2xl
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                    placeholder-gray-500 dark:placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:border-transparent
                    resize-none min-h-[44px] max-h-32 transition-colors
                    ${
                      messageError
                        ? "border-red-300 dark:border-red-600 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                    }
                  `}
                  rows="1"
                />
                <button
                  onClick={() => setShowInputEmojiPicker(!showInputEmojiPicker)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-500 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              </div>
              <button
                onClick={handleSend}
                disabled={!newMessage.trim() || sendingMessage}
                className="
                  px-4 py-3 bg-blue-600 text-white rounded-2xl
                  hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center
                "
              >
                {sendingMessage ? (
                  <LoadingSpinner size="sm" className="border-white" />
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* Emoji Picker for Input */}
            {showInputEmojiPicker && (
              <div className="emoji-picker-container absolute bottom-full right-0 mb-2 z-50">
                <EmojiPicker
                  onEmojiSelect={handleInputEmojiSelect}
                  isOpen={showInputEmojiPicker}
                  onClose={() => setShowInputEmojiPicker(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Dashboard */}
      <PerformanceDashboard
        isVisible={showPerformanceDashboard}
        onClose={() => setShowPerformanceDashboard(false)}
      />
    </div>
  );
});

export default ChatPage;
