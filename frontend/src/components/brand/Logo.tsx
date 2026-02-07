import { cn } from "@/components/ui/utils";

interface LogoProps {
  variant?: "full" | "icon" | "text";
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  showText?: boolean;
}

const sizes = {
  sm: { icon: 48, text: "text-lg" },
  md: { icon: 64, text: "text-xl" },
  lg: { icon: 80, text: "text-2xl" },
  xl: { icon: 96, text: "text-3xl" },
  "2xl": { icon: 128, text: "text-4xl" },
};

export function Logo({
  variant = "full",
  size = "sm",
  className,
  showText = true,
}: LogoProps) {
  const { icon: iconSize, text: textSize } = sizes[size];

  // SVG Icon component
  const LogoIcon = () => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
      style={{ minWidth: iconSize, minHeight: iconSize, width: iconSize, height: iconSize }}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1565c0" />
          <stop offset="100%" stopColor="#0d47a1" />
        </linearGradient>
      </defs>

      {/* Shield shape background */}
      <path
        d="M32 4 L56 14 L56 36 C56 48 44 58 32 62 C20 58 8 48 8 36 L8 14 Z"
        fill="url(#logoGradient)"
      />

      {/* Football in center */}
      <circle cx="32" cy="32" r="14" fill="#ffffff" stroke="#0d47a1" strokeWidth="1" />

      {/* Pentagon pattern */}
      <path d="M32 22 L36 27 L34 33 L30 33 L28 27 Z" fill="#1565c0" />
      <path d="M25 28 L28 27 L30 33 L27 36 L23 33 Z" fill="#1565c0" opacity="0.7" />
      <path d="M39 28 L36 27 L34 33 L37 36 L41 33 Z" fill="#1565c0" opacity="0.7" />
      <path d="M30 33 L34 33 L36 39 L32 42 L28 39 Z" fill="#1565c0" opacity="0.7" />

      {/* Green accent */}
      <path
        d="M14 50 Q32 46 50 50"
        stroke="#00c853"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );

  if (variant === "icon") {
    return (
      <div className={cn("inline-flex items-center", className)}>
        <LogoIcon />
      </div>
    );
  }

  if (variant === "text") {
    return (
      <span className={cn("font-bold text-primary", textSize, className)}>
        ClubQore
      </span>
    );
  }

  // Full variant (icon + text)
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <LogoIcon />
      {showText && (
        <span className={cn("font-bold", textSize)}>ClubQore</span>
      )}
    </div>
  );
}

// Export a simple football icon for use in other places
export function FootballIcon({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <path
        d="M12 4 L14.5 7.5 L13.5 12 L10.5 12 L9.5 7.5 Z"
        fill="currentColor"
      />
      <path
        d="M6 8 L9.5 7.5 L10.5 12 L8 14.5 L4.5 12 Z"
        fill="currentColor"
        opacity="0.6"
      />
      <path
        d="M18 8 L14.5 7.5 L13.5 12 L16 14.5 L19.5 12 Z"
        fill="currentColor"
        opacity="0.6"
      />
      <path
        d="M10.5 12 L13.5 12 L15 17 L12 20 L9 17 Z"
        fill="currentColor"
        opacity="0.6"
      />
    </svg>
  );
}
