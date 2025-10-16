// Example: Backend Integration Demo Component
import { useState, useEffect } from "react";
import {
  authAPI,
  onboardingAPI,
  roleAPI,
  emailVerificationAPI,
  healthAPI,
} from "../api/auth";
import type { AuthUser, UserRolesResponse } from "../types/auth";

export function BackendIntegrationDemo() {
  const [health, setHealth] = useState<{
    status: string;
    timestamp: string;
    version: string;
  } | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [roles, setRoles] = useState<UserRolesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  // Test health check on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const healthData = await healthAPI.check();
        setHealth(healthData);
        setMessage("✅ Backend is healthy!");
      } catch (error) {
        setMessage("❌ Backend health check failed");
        console.error("Health check failed:", error);
      }
    };

    checkHealth();
  }, []);

  const handleGetCurrentUser = async () => {
    setLoading(true);
    try {
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
      setMessage("✅ User profile loaded successfully");
    } catch (error) {
      setMessage(
        `❌ Failed to get user: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const updatedUser = await authAPI.updateProfile({
        name: `${user.name} (Updated)`,
        primaryRole: user.primaryRole === "member" ? "parent" : "member",
      });
      setUser(updatedUser);
      setMessage("✅ Profile updated successfully");
    } catch (error) {
      setMessage(
        `❌ Failed to update profile: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGetRoles = async () => {
    setLoading(true);
    try {
      const rolesData = await roleAPI.getUserRoles();
      setRoles(rolesData);
      setMessage("✅ User roles loaded successfully");
    } catch (error) {
      setMessage(
        `❌ Failed to get roles: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    setLoading(true);
    try {
      await emailVerificationAPI.sendVerification();
      setMessage("✅ Verification email sent successfully");
    } catch (error) {
      setMessage(
        `❌ Failed to send verification email: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStartOnboarding = async () => {
    setLoading(true);
    try {
      const result = await onboardingAPI.startOnboarding("profile");
      setMessage(`✅ Onboarding started: ${result.message}`);
    } catch (error) {
      setMessage(
        `❌ Failed to start onboarding: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Backend Integration Demo
      </h1>

      {/* Health Status */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Backend Health</h2>
        {health ? (
          <div className="text-sm">
            <p>
              <strong>Status:</strong> {health.status}
            </p>
            <p>
              <strong>Version:</strong> {health.version}
            </p>
            <p>
              <strong>Timestamp:</strong> {health.timestamp}
            </p>
          </div>
        ) : (
          <p className="text-gray-500">Checking health...</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={handleGetCurrentUser}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Get User Profile
        </button>

        <button
          onClick={handleUpdateProfile}
          disabled={loading || !user}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Update Profile
        </button>

        <button
          onClick={handleGetRoles}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Get User Roles
        </button>

        <button
          onClick={handleSendVerificationEmail}
          disabled={loading}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
        >
          Send Verification
        </button>

        <button
          onClick={handleStartOnboarding}
          disabled={loading}
          className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50"
        >
          Start Onboarding
        </button>
      </div>

      {/* Status Message */}
      {message && (
        <div className="mb-6 p-4 border rounded-lg bg-blue-50">
          <p className="text-sm">{message}</p>
        </div>
      )}

      {/* User Data Display */}
      {user && (
        <div className="mb-6 p-4 border rounded-lg bg-green-50">
          <h3 className="text-lg font-semibold mb-2">Current User</h3>
          <div className="text-sm space-y-1">
            <p>
              <strong>ID:</strong> {user.id}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Name:</strong> {user.name || "Not set"}
            </p>
            <p>
              <strong>Primary Role:</strong> {user.primaryRole}
            </p>
            <p>
              <strong>Roles:</strong> {user.roles.join(", ")}
            </p>
            <p>
              <strong>Email Verified:</strong>{" "}
              {user.emailVerified ? "✅" : "❌"}
            </p>
            <p>
              <strong>Onboarded:</strong> {user.isOnboarded ? "✅" : "❌"}
            </p>
            <p>
              <strong>Account Type:</strong> {user.accountType || "Not set"}
            </p>
          </div>
        </div>
      )}

      {/* Roles Data Display */}
      {roles && (
        <div className="mb-6 p-4 border rounded-lg bg-purple-50">
          <h3 className="text-lg font-semibold mb-2">User Roles</h3>
          <div className="text-sm space-y-1">
            <p>
              <strong>Current Roles:</strong> {roles.roles.join(", ")}
            </p>
            <p>
              <strong>Primary Role:</strong> {roles.primaryRole}
            </p>
            <p>
              <strong>Available Roles:</strong>{" "}
              {roles.availableRoles.join(", ")}
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-4">
          <p className="text-gray-500">Loading...</p>
        </div>
      )}
    </div>
  );
}

export default BackendIntegrationDemo;
