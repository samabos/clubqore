import { cn } from "./utils";

interface LoadingProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  containerClassName?: string;
  showMessage?: boolean;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

const messageSizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export function Loading({
  message = "Loading...",
  size = "md",
  className,
  containerClassName,
  showMessage = true,
}: LoadingProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center min-h-[200px]",
        containerClassName
      )}
    >
      <div className="text-center">
        <div
          className={cn(
            "animate-spin rounded-full border-b-2 border-primary mx-auto mb-4",
            sizeClasses[size],
            className
          )}
        />
        {showMessage && (
          <p className={cn("text-gray-600", messageSizeClasses[size])}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

// Specialized loading components for different modules
export function ClubLoading({
  message = "Loading club data...",
}: {
  message?: string;
}) {
  return <Loading message={message} />;
}

export function TeamLoading({
  message = "Loading team data...",
}: {
  message?: string;
}) {
  return <Loading message={message} />;
}

export function PersonnelLoading({
  message = "Loading personnel data...",
}: {
  message?: string;
}) {
  return <Loading message={message} />;
}

export function MemberLoading({
  message = "Loading member data...",
}: {
  message?: string;
}) {
  return <Loading message={message} />;
}

// Full page loading with container
export function PageLoading({
  message = "Loading...",
  size = "md",
  className,
  containerClassName,
}: LoadingProps) {
  return (
    <div className={cn("container mx-auto p-6 max-w-4xl", containerClassName)}>
      <Loading
        message={message}
        size={size}
        className={className}
        containerClassName="min-h-[400px]"
      />
    </div>
  );
}
