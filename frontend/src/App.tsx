import { RouterProvider } from "react-router-dom";
import { router } from "./router/index.tsx";
import { useEffect } from "react";
import { useAuth } from "./stores/authStore";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  const auth = useAuth();
  const { hasToken, user, getCurrentUser, updateTokenState } = auth;

  // Initialize auth state on app start
  useEffect(() => {
    // Update token state on app start (only once)
    updateTokenState();
  }, [updateTokenState]);

  // Handle user session restoration when tokens exist
  useEffect(() => {
    console.log("🔍 App.tsx useEffect: hasToken:", hasToken, "user:", !!user);
    if (hasToken && !user) {
      console.log("🔄 App.tsx: Calling getCurrentUser to restore session");
      getCurrentUser().catch((error) => {
        console.warn("Failed to restore user session:", error);
        // If token is invalid, it will be cleared automatically
      });
    }
  }, [hasToken, user, getCurrentUser]);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}
