// Comprehensive error message handling for better user experience

// Error categories for better handling
export const ERROR_TYPES = {
  NETWORK: "network",
  AUTHENTICATION: "authentication",
  VALIDATION: "validation",
  PERMISSION: "permission",
  NOT_FOUND: "not_found",
  SERVER: "server",
  UNKNOWN: "unknown",
};

// User-friendly error messages
export const ERROR_MESSAGES = {
  // Network errors
  [ERROR_TYPES.NETWORK]: {
    CONNECTION_LOST:
      "Connection lost. Please check your internet connection and try again.",
    TIMEOUT: "Request timed out. Please try again.",
    OFFLINE: "You're offline. Please check your connection.",
    SERVER_UNREACHABLE:
      "Unable to connect to the server. Please try again later.",
    WEBSOCKET_DISCONNECTED:
      "Real-time connection lost. Attempting to reconnect...",
  },

  // Authentication errors
  [ERROR_TYPES.AUTHENTICATION]: {
    INVALID_CREDENTIALS: "Invalid username or password. Please try again.",
    TOKEN_EXPIRED: "Your session has expired. Please log in again.",
    UNAUTHORIZED: "You don't have permission to perform this action.",
    ACCOUNT_NOT_FOUND: "Account not found. Please check your username.",
    LOGIN_REQUIRED: "Please log in to continue.",
  },

  // Validation errors
  [ERROR_TYPES.VALIDATION]: {
    USERNAME_TAKEN:
      "This username is already taken. Please choose a different one.",
    PASSWORD_WEAK: "Password is too weak. Please use a stronger password.",
    INVALID_EMAIL: "Please enter a valid email address.",
    REQUIRED_FIELD: "This field is required.",
    INVALID_FORMAT: "Please check the format and try again.",
    MESSAGE_TOO_LONG: "Message is too long. Please shorten it.",
    CHANNEL_NAME_TAKEN: "A channel with this name already exists.",
    INVALID_CHANNEL_NAME: "Channel name must be 3-50 characters long.",
  },

  // Permission errors
  [ERROR_TYPES.PERMISSION]: {
    CANNOT_DELETE_CHANNEL: "You don't have permission to delete this channel.",
    CANNOT_CREATE_CHANNEL: "You don't have permission to create channels.",
    CANNOT_SEND_MESSAGE:
      "You don't have permission to send messages in this channel.",
    CANNOT_ADD_REACTION: "You don't have permission to add reactions.",
    CANNOT_UPDATE_PROFILE: "You don't have permission to update this profile.",
  },

  // Not found errors
  [ERROR_TYPES.NOT_FOUND]: {
    CHANNEL_NOT_FOUND: "Channel not found. It may have been deleted.",
    MESSAGE_NOT_FOUND: "Message not found. It may have been deleted.",
    USER_NOT_FOUND: "User not found.",
    PROFILE_NOT_FOUND: "Profile not found.",
  },

  // Server errors
  [ERROR_TYPES.SERVER]: {
    INTERNAL_ERROR: "Something went wrong on our end. Please try again later.",
    DATABASE_ERROR: "Database error. Please try again.",
    SERVICE_UNAVAILABLE:
      "Service temporarily unavailable. Please try again later.",
    RATE_LIMITED:
      "Too many requests. Please wait a moment before trying again.",
  },

  // Generic fallback
  [ERROR_TYPES.UNKNOWN]: {
    DEFAULT: "Something went wrong. Please try again.",
    UNEXPECTED: "An unexpected error occurred. Please try again.",
  },
};

// HTTP status code mappings
export const HTTP_STATUS_MESSAGES = {
  400: ERROR_TYPES.VALIDATION,
  401: ERROR_TYPES.AUTHENTICATION,
  403: ERROR_TYPES.PERMISSION,
  404: ERROR_TYPES.NOT_FOUND,
  408: ERROR_TYPES.NETWORK,
  409: ERROR_TYPES.VALIDATION,
  422: ERROR_TYPES.VALIDATION,
  429: ERROR_TYPES.SERVER,
  500: ERROR_TYPES.SERVER,
  502: ERROR_TYPES.SERVER,
  503: ERROR_TYPES.SERVER,
  504: ERROR_TYPES.NETWORK,
};

// Specific error message mappings for common backend errors
export const BACKEND_ERROR_MESSAGES = {
  "User already exists": ERROR_MESSAGES[ERROR_TYPES.VALIDATION].USERNAME_TAKEN,
  "Invalid credentials":
    ERROR_MESSAGES[ERROR_TYPES.AUTHENTICATION].INVALID_CREDENTIALS,
  "User not found":
    ERROR_MESSAGES[ERROR_TYPES.AUTHENTICATION].ACCOUNT_NOT_FOUND,
  "Channel already exists":
    ERROR_MESSAGES[ERROR_TYPES.VALIDATION].CHANNEL_NAME_TAKEN,
  "Channel not found": ERROR_MESSAGES[ERROR_TYPES.NOT_FOUND].CHANNEL_NOT_FOUND,
  "Message not found": ERROR_MESSAGES[ERROR_TYPES.NOT_FOUND].MESSAGE_NOT_FOUND,
  "Already reacted with this emoji":
    "You've already reacted with this emoji. Click it again to remove your reaction.",
  "Missing username or password": "Please enter both username and password.",
  "Missing emoji in request": "Please select an emoji to react.",
  "Emoji cannot be empty": "Please select a valid emoji.",
  "No data provided": "Please provide the required information.",
  "Invalid JSON data": "Invalid data format. Please try again.",
};

/**
 * Get user-friendly error message from error object
 * @param {Error|Object} error - Error object from API or validation
 * @param {string} context - Additional context for the error
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(error, context = "") {
  // Handle string errors
  if (typeof error === "string") {
    return BACKEND_ERROR_MESSAGES[error] || error;
  }

  // Handle axios errors
  if (error?.response) {
    const status = error.response.status;
    const errorData = error.response.data;

    // Check for specific backend error messages
    if (errorData?.error && BACKEND_ERROR_MESSAGES[errorData.error]) {
      return BACKEND_ERROR_MESSAGES[errorData.error];
    }

    // Map HTTP status to error type
    const errorType = HTTP_STATUS_MESSAGES[status] || ERROR_TYPES.UNKNOWN;

    // Return appropriate message based on error type
    switch (errorType) {
      case ERROR_TYPES.NETWORK:
        return ERROR_MESSAGES[ERROR_TYPES.NETWORK].CONNECTION_LOST;
      case ERROR_TYPES.AUTHENTICATION:
        return ERROR_MESSAGES[ERROR_TYPES.AUTHENTICATION].INVALID_CREDENTIALS;
      case ERROR_TYPES.VALIDATION:
        return (
          errorData?.error ||
          ERROR_MESSAGES[ERROR_TYPES.VALIDATION].INVALID_FORMAT
        );
      case ERROR_TYPES.PERMISSION:
        return ERROR_MESSAGES[ERROR_TYPES.PERMISSION].UNAUTHORIZED;
      case ERROR_TYPES.NOT_FOUND:
        return ERROR_MESSAGES[ERROR_TYPES.NOT_FOUND].CHANNEL_NOT_FOUND;
      case ERROR_TYPES.SERVER:
        return ERROR_MESSAGES[ERROR_TYPES.SERVER].INTERNAL_ERROR;
      default:
        return errorData?.error || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN].DEFAULT;
    }
  }

  // Handle network errors (no response)
  if (
    error?.code === "NETWORK_ERROR" ||
    error?.message?.includes("Network Error")
  ) {
    return ERROR_MESSAGES[ERROR_TYPES.NETWORK].CONNECTION_LOST;
  }

  // Handle timeout errors
  if (error?.code === "ECONNABORTED" || error?.message?.includes("timeout")) {
    return ERROR_MESSAGES[ERROR_TYPES.NETWORK].TIMEOUT;
  }

  // Handle generic errors
  if (error?.message) {
    return BACKEND_ERROR_MESSAGES[error.message] || error.message;
  }

  // Fallback
  return ERROR_MESSAGES[ERROR_TYPES.UNKNOWN].DEFAULT;
}

/**
 * Get error type for styling and handling
 * @param {Error|Object} error - Error object
 * @returns {string} Error type
 */
export function getErrorType(error) {
  if (error?.response) {
    const status = error.response.status;
    return HTTP_STATUS_MESSAGES[status] || ERROR_TYPES.UNKNOWN;
  }

  if (
    error?.code === "NETWORK_ERROR" ||
    error?.message?.includes("Network Error")
  ) {
    return ERROR_TYPES.NETWORK;
  }

  return ERROR_TYPES.UNKNOWN;
}

/**
 * Check if error is retryable
 * @param {Error|Object} error - Error object
 * @returns {boolean} Whether the error is retryable
 */
export function isRetryableError(error) {
  const errorType = getErrorType(error);

  return [ERROR_TYPES.NETWORK, ERROR_TYPES.SERVER].includes(errorType);
}

/**
 * Get retry delay in milliseconds
 * @param {number} attempt - Current attempt number (0-based)
 * @returns {number} Delay in milliseconds
 */
export function getRetryDelay(attempt) {
  // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
  return Math.min(1000 * Math.pow(2, attempt), 30000);
}
