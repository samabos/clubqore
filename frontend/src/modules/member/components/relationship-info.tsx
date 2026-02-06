import { Badge } from "@/components/ui/badge";
import { Users2, UserCheck, UserX, MapPin } from "lucide-react";
import { RelationshipInfoProps } from "../types/component-types";

export function RelationshipInfo({ member }: RelationshipInfoProps) {
  // Only show children for parents, not parents for players
  if (member.membershipType === "parent" && member.hasChildren) {
    return (
      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-center gap-2 text-sm text-blue-700 mb-2">
          <Users2 className="w-4 h-4" />
          <span className="font-semibold">
            Children ({member.children?.length || 0})
          </span>
        </div>
        <div className="space-y-2">
          {member.children?.map((child, index) => (
            <div
              key={child.id || `child-${index}`}
              className="bg-white rounded-md p-3 border border-blue-100"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-800">
                  {child.firstName} {child.lastName}
                </span>
                <div className="flex items-center gap-2">
                  {!child.isRegistered && (
                    <Badge
                      variant="secondary"
                      title="No Login Credential"
                      className="text-xs px-2 py-1 flex items-center gap-1 bg-orange-100 text-orange-700 border-orange-200"
                    >
                      <UserX className="w-3 h-3" />
                      No Login
                    </Badge>
                  )}
                  {child.isRegistered && (
                    <Badge
                      variant="default"
                      className="text-xs px-2 py-1 flex items-center gap-1 bg-green-100 text-green-700 border-green-200"
                    >
                      <UserCheck className="w-3 h-3" />
                      Registered
                    </Badge>
                  )}
                </div>
              </div>
              {child.position && (
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <MapPin className="w-3 h-3" />
                  <span>{child.position}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Don't show parent information for players
  return null;
}
