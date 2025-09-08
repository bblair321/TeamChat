// Validation utilities for forms
import { getErrorMessage as getEnhancedErrorMessage } from "./errorMessages";

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  const minLength = 8;

  return {
    isValid: password.length >= minLength,
    minLength: password.length >= minLength,
  };
};

export const validateUsername = (username) => {
  const minLength = 3;
  const maxLength = 20;
  const validChars = /^[a-zA-Z0-9_]+$/;

  return {
    isValid:
      username.length >= minLength &&
      username.length <= maxLength &&
      validChars.test(username),
    minLength: username.length >= minLength,
    maxLength: username.length <= maxLength,
    validChars: validChars.test(username),
  };
};

export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;

  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .substring(0, 1000); // Limit length
};

export const validateMessage = (message) => {
  const sanitized = sanitizeInput(message);
  return {
    isValid: sanitized.length > 0 && sanitized.length <= 1000,
    message: sanitized,
  };
};

export const validateChannelName = (name) => {
  const sanitized = sanitizeInput(name);
  return {
    isValid: sanitized.length >= 3 && sanitized.length <= 50,
    name: sanitized,
  };
};

export const getErrorMessage = (error) => {
  return getEnhancedErrorMessage(error);
};
