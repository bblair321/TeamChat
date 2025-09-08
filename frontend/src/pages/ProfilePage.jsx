import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, updateProfile } from "../api";
import ThemeToggle from "../components/ThemeToggle";
import UserAvatar from "../components/UserAvatar";
import ErrorMessage from "../components/ErrorMessage";
import SuccessMessage from "../components/SuccessMessage";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  validateUsername,
  sanitizeInput,
  getErrorMessage,
} from "../utils/validation";

export default function ProfilePage() {
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Profile data
  const [profile, setProfile] = useState({
    username: "",
    display_name: "",
    status_message: "",
    avatar_url: "",
    is_online: false,
    last_seen: null,
    created_at: null,
  });

  // Load user profile on component mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await getProfile();
      setProfile(response.data);
    } catch (err) {
      console.error("Error loading profile:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    // Validate display name
    if (profile.display_name && profile.display_name.length > 50) {
      errors.display_name = "Display name must be 50 characters or less";
    }

    // Validate status message
    if (profile.status_message && profile.status_message.length > 100) {
      errors.status_message = "Status message must be 100 characters or less";
    }

    // Validate avatar URL
    if (profile.avatar_url && profile.avatar_url.length > 500) {
      errors.avatar_url = "Avatar URL must be 500 characters or less";
    }

    // Basic URL validation for avatar
    if (profile.avatar_url && profile.avatar_url.trim()) {
      try {
        new URL(profile.avatar_url);
      } catch {
        errors.avatar_url = "Please enter a valid URL";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous messages
    setError("");
    setSuccess("");
    setFieldErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      // Prepare update data
      const updateData = {
        display_name: profile.display_name?.trim() || null,
        status_message: profile.status_message?.trim() || null,
        avatar_url: profile.avatar_url?.trim() || null,
      };

      const response = await updateProfile(updateData);
      setProfile(response.data);
      setSuccess("Profile updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBackToChat = () => {
    navigate("/chat");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBackToChat}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Chat
          </button>
          <ThemeToggle />
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            Edit Profile
          </h1>

          <ErrorMessage
            error={error}
            onDismiss={() => setError("")}
            className="mb-4"
          />
          <SuccessMessage
            message={success}
            onDismiss={() => setSuccess("")}
            className="mb-4"
          />

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Preview */}
            <div className="flex items-center gap-4">
              <UserAvatar
                user={profile}
                size="lg"
                className="border-4 border-gray-200 dark:border-gray-600"
              />
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {profile.display_name || profile.username}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {profile.is_online ? "Online" : "Offline"}
                </p>
              </div>
            </div>

            {/* Username (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={profile.username}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Username cannot be changed
              </p>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={profile.display_name || ""}
                onChange={(e) =>
                  handleInputChange("display_name", e.target.value)
                }
                placeholder="Enter your display name"
                maxLength={50}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  fieldErrors.display_name
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {fieldErrors.display_name && (
                <p className="text-red-500 text-sm mt-1">
                  {fieldErrors.display_name}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                How others will see your name (optional)
              </p>
            </div>

            {/* Status Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status Message
              </label>
              <textarea
                value={profile.status_message || ""}
                onChange={(e) =>
                  handleInputChange("status_message", e.target.value)
                }
                placeholder="What's on your mind?"
                maxLength={100}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none ${
                  fieldErrors.status_message
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {fieldErrors.status_message && (
                <p className="text-red-500 text-sm mt-1">
                  {fieldErrors.status_message}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {profile.status_message?.length || 0}/100 characters
              </p>
            </div>

            {/* Avatar URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Avatar URL
              </label>
              <input
                type="url"
                value={profile.avatar_url || ""}
                onChange={(e) =>
                  handleInputChange("avatar_url", e.target.value)
                }
                placeholder="https://example.com/avatar.jpg"
                maxLength={500}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  fieldErrors.avatar_url
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {fieldErrors.avatar_url && (
                <p className="text-red-500 text-sm mt-1">
                  {fieldErrors.avatar_url}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                URL to your profile picture (optional)
              </p>
            </div>

            {/* Account Info */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Account Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Member since:
                  </span>
                  <p className="text-gray-800 dark:text-gray-200">
                    {profile.created_at
                      ? new Date(profile.created_at).toLocaleDateString()
                      : "Unknown"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Last seen:
                  </span>
                  <p className="text-gray-800 dark:text-gray-200">
                    {profile.last_seen
                      ? new Date(profile.last_seen).toLocaleString()
                      : "Never"}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {saving ? (
                  <div className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" />
                    Saving...
                  </div>
                ) : (
                  "Save Changes"
                )}
              </button>
              <button
                type="button"
                onClick={handleBackToChat}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
