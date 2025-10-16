import { toast as sonnerToast } from "sonner";

export const toast = {
  success: (message: string, options?: { description?: string; duration?: number }) => {
    return sonnerToast.success(message, {
      duration: options?.duration || 4000,
      description: options?.description,
    });
  },

  error: (message: string, options?: { description?: string; duration?: number }) => {
    return sonnerToast.error(message, {
      duration: options?.duration || 6000,
      description: options?.description,
    });
  },

  info: (message: string, options?: { description?: string; duration?: number }) => {
    return sonnerToast.info(message, {
      duration: options?.duration || 4000,
      description: options?.description,
    });
  },

  warning: (message: string, options?: { description?: string; duration?: number }) => {
    return sonnerToast.warning(message, {
      duration: options?.duration || 5000,
      description: options?.description,
    });
  },

  loading: (message: string, options?: { description?: string }) => {
    return sonnerToast.loading(message, {
      description: options?.description,
    });
  },

  dismiss: (toastId?: string | number) => {
    return sonnerToast.dismiss(toastId);
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return sonnerToast.promise(promise, messages);
  },
};

// Auth-specific toast messages
export const authToasts = {
  loginSuccess: () => toast.success("Welcome back!", { description: "Successfully signed in" }),
  loginError: (error: string) => toast.error("Sign in failed", { description: error }),
  
  signupSuccess: () => toast.success("Account created!", { description: "Check your email to verify your account" }),
  signupError: (error: string) => toast.error("Sign up failed", { description: error }),
  
  emailVerificationSent: () => toast.success("Verification email sent!", { description: "Check your inbox and spam folder" }),
  emailAlreadyVerified: () => toast.success("Email already verified!", { description: "Redirecting to onboarding..." }),
  emailVerificationError: (error: string) => toast.error("Verification failed", { description: error }),
  
  passwordResetSent: () => toast.success("Password reset link sent!", { description: "Check your email for instructions" }),
  passwordResetError: (error: string) => toast.error("Password reset failed", { description: error }),
  
  logoutSuccess: () => toast.info("Signed out", { description: "You have been successfully signed out" }),
};