// Placeholder toast hook
// TODO: Replace with actual toast implementation

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function useToast() {
  const toast = ({ title, description, variant }: ToastProps) => {
    console.log(`[${variant === "destructive" ? "ERROR" : "INFO"}] ${title}:`, description);
    // TODO: Implement actual toast UI
  };

  return { toast };
}
