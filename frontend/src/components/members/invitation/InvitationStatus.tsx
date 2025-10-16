import { Badge } from "../../ui/badge";
import { Clock, CheckCircle, XCircle } from "lucide-react";

interface InvitationStatusProps {
  status: "pending" | "accepted" | "expired" | "cancelled";
  className?: string;
}

export function InvitationStatus({
  status,
  className = "",
}: InvitationStatusProps) {
  const configs = {
    pending: {
      variant: "secondary" as const,
      icon: Clock,
      label: "Pending",
      className: "bg-orange-50 text-orange-700 border-orange-200",
    },
    accepted: {
      variant: "default" as const,
      icon: CheckCircle,
      label: "Accepted",
      className: "bg-green-50 text-green-700 border-green-200",
    },
    expired: {
      variant: "destructive" as const,
      icon: XCircle,
      label: "Expired",
      className: "bg-red-50 text-red-700 border-red-200",
    },
    cancelled: {
      variant: "outline" as const,
      icon: XCircle,
      label: "Cancelled",
      className: "bg-gray-50 text-gray-700 border-gray-200",
    },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={`rounded-lg ${config.className} ${className}`}
    >
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}
