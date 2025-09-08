import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api";
import ThemeToggle from "../components/ThemeToggle";
import ErrorMessage from "../components/ErrorMessage";
import EnhancedErrorMessage from "../components/EnhancedErrorMessage";
import {
  validateUsername,
  sanitizeInput,
  getErrorMessage,
} from "../utils/validation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  const validateForm = () => {
    const errors = {};

    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      errors.username = usernameValidation.errors[0];
    }

    // Validate password
    if (!password.trim()) {
      errors.password = "Password is required";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setError("");
    setFieldErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Sanitize inputs
      const sanitizedUsername = sanitizeInput(username);
      const sanitizedPassword = sanitizeInput(password);

      const response = await login({
        username: sanitizedUsername,
        password: sanitizedPassword,
      });
      localStorage.setItem("token", response.data.token);

      // Dispatch custom event to notify App component of token update
      window.dispatchEvent(new CustomEvent("tokenUpdated"));

      navigate("/chat");
    } catch (err) {
      console.error("Login error:", err);
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
        >
          <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-white">
            TeamChat
          </h1>
          <h2 className="text-xl text-center mb-6 text-gray-600 dark:text-gray-300">
            Sign In
          </h2>

          <EnhancedErrorMessage
            error={error}
            onDismiss={() => setError("")}
            className="mb-4"
            context="Login"
          />

          <div className="mb-4">
            <input
              className={`border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 p-3 w-full rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                fieldErrors.username
                  ? "border-red-300 dark:border-red-600 focus:ring-red-500"
                  : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
              }`}
              placeholder="Username"
              value={username}
              onChange={handleUsernameChange}
              disabled={loading}
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
                  : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
              }`}
              type="password"
              placeholder="Password"
              value={password}
              onChange={handlePasswordChange}
              disabled={loading}
            />
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {fieldErrors.password}
              </p>
            )}
          </div>
          <button
            className={`w-full px-4 py-3 rounded-md text-white font-medium transition-colors ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Sign In"}
          </button>

          <div className="mt-4 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                disabled={loading}
              >
                Register here
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
