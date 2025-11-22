import { Card, CardContent } from "@/components/ui/card";
import { Users, UserPlus, Mail, ClipboardList } from "lucide-react";
import { MemberStatsProps } from "../types/component-types";

export function MemberStats({ stats }: MemberStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="border-0 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalMembers}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <UserPlus className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Members</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.activeMembers}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-xl">
              <Mail className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Invites</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.pendingInvitations}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <ClipboardList className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">New This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.newThisMonth}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
