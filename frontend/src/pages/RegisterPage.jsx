import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../api";
import ThemeToggle from "../components/ThemeToggle";
import ErrorMessage from "../components/ErrorMessage";
import EnhancedErrorMessage from "../components/EnhancedErrorMessage";
import SuccessMessage from "../components/SuccessMessage";
import {
  validateUsername,
  validatePassword,
  sanitizeInput,
  getErrorMessage,
} from "../utils/validation";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  const validateForm = () => {
    const errors = {};

    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      if (!usernameValidation.minLength) {
        errors.username = "Username must be at least 3 characters";
      } else if (!usernameValidation.maxLength) {
        errors.username = "Username must be 20 characters or less";
      } else if (!usernameValidation.validChars) {
        errors.username =
          "Username can only contain letters, numbers, and underscores";
      }
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      if (!passwordValidation.minLength) {
        errors.password =
          "Password must be at least 8 characters of any combination";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("Form submitted on mobile:", { username, password: "***" });

    // Clear previous messages
    setError("");
    setSuccess("");
    setFieldErrors({});

    // Validate form
    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }

    try {
      setLoading(true);
      console.log("Starting registration process...");

      // Sanitize inputs
      const sanitizedUsername = sanitizeInput(username);
      const sanitizedPassword = sanitizeInput(password);

      console.log("Calling register API...");
      const response = await register({
        username: sanitizedUsername,
        password: sanitizedPassword,
      });

      console.log("Registration successful:", response);
      setSuccess("Account created successfully! Please log in.");

      // Clear form and redirect to login after a short delay
      setUsername("");
      setPassword("");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error("Registration error:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config,
      });
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);

    // Clear field error when user starts typing
    if (fieldErrors.username) {
      setFieldErrors((prev) => ({ ...prev, username: undefined }));
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);

    // Clear field error when user starts typing
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Theme Toggle */}
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-lg w-full"
          noValidate
        >
          <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-white">
            TeamChat
          </h1>
          <h2 className="text-xl text-center mb-6 text-gray-600 dark:text-gray-300">
            Create Account
          </h2>

          <EnhancedErrorMessage
            error={error}
            onDismiss={() => setError("")}
            className="mb-4"
            context="Registration"
          />
          <SuccessMessage
            message={success}
            onDismiss={() => setSuccess("")}
            className="mb-4"
          />

          <div className="mb-4">
            <input
              className={`border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 p-3 w-full rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                fieldErrors.username
                  ? "border-red-300 dark:border-red-600 focus:ring-red-500"
                  : "border-gray-300 dark:border-gray-600 focus:ring-green-500"
              }`}
              placeholder="Username (3-20 characters, letters, numbers, underscores)"
              value={username}
              onChange={handleUsernameChange}
              disabled={loading}
              autoComplete="username"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />
            {fieldErrors.username && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {fieldErrors.username}
              </p>
            )}
          </div>

          <div className="mb-6">
            <input
              className={`border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 p-3 w-full rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                fieldErrors.password
                  ? "border-red-300 dark:border-red-600 focus:ring-red-500"
                  : "border-gray-300 dark:border-gray-600 focus:ring-green-500"
              }`}
              type="password"
              placeholder="Password (8+ characters)"
              value={password}
              onChange={handlePasswordChange}
              disabled={loading}
              autoComplete="new-password"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {fieldErrors.password}
              </p>
            )}
          </div>
          <button
            className={`w-full px-4 py-3 rounded-md text-white font-medium transition-colors touch-manipulation ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 active:bg-green-700"
            }`}
            type="submit"
            disabled={loading}
            style={{ minHeight: "44px" }} // iOS minimum touch target
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
          <div className="mt-4 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline touch-manipulation"
                disabled={loading}
                style={{ minHeight: "44px", minWidth: "44px" }} // iOS minimum touch target
              >
                Login here
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
