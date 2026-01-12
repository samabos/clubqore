import { RouterProvider } from "react-router-dom";
import { router } from "./router/index.tsx";
import { useEffect } from "react";
import { useAuth } from "./stores/authStore";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  const auth = useAuth();
  const { hasToken, user, scopes, getCurrentUser, updateTokenState, restoreScopesFromToken } = auth;

  // Initialize auth state on app start
  useEffect(() => {
    // Update token state on app start (only once)
    updateTokenState();

    // Restore scopes from JWT token if user exists from persistence but scopes are empty
    // This happens on page refresh when user is persisted but scopes are not
    restoreScopesFromToken();
  }, [updateTokenState, restoreScopesFromToken]);

  // Handle user session restoration when tokens exist
  useEffect(() => {
    console.log("🔍 App.tsx useEffect: hasToken:", hasToken, "user:", !!user, "scopes:", scopes.length);
    if (hasToken && !user) {
      console.log("🔄 App.tsx: Calling getCurrentUser to restore session");
      getCurrentUser().catch((error) => {
        console.warn("Failed to restore user session:", error);
        // If token is invalid, it will be cleared automatically
      });
    }
  }, [hasToken, user, scopes.length, getCurrentUser]);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}
