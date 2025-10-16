import { RouterProvider } from "react-router-dom";
import { router } from "./router/index.tsx";
import { useAuthInitialization } from "./hooks/useAuthInitialization";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  useAuthInitialization();

  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}
