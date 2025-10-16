import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Users, UserPlus, Mail, ClipboardList } from "lucide-react";

// Import components (we'll create these)
import { MemberDirectory } from "./MemberDirectory.tsx";
import { InvitationForm } from "./invitation/InvitationForm.tsx";
import { InvitationList } from "./invitation/InvitationList.tsx";
import { DirectRegistration } from "./registration/DirectRegistration.tsx";

export function MembersLayout() {
  const [activeTab, setActiveTab] = useState("directory");

  // Mock stats for invitation badge
  const pendingInvitations = 8;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>{/* Header content removed */}</div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 rounded-xl bg-gray-50 p-1 h-14 mb-0">
          <TabsTrigger
            value="directory"
            className="rounded-lg data-[state=active]:bg-gray-100 data-[state=active]:shadow-sm data-[state=active]:rounded-b-none data-[state=active]:border-b-0 transition-all duration-200 hover:bg-white/60 font-medium text-gray-600 data-[state=active]:text-gray-900 py-3 px-4"
          >
            <Users className="w-4 h-4 mr-2" />
            Directory
          </TabsTrigger>
          <TabsTrigger
            value="invite"
            className="rounded-lg data-[state=active]:bg-gray-100 data-[state=active]:shadow-sm data-[state=active]:rounded-b-none data-[state=active]:border-b-0 transition-all duration-200 hover:bg-white/60 font-medium text-gray-600 data-[state=active]:text-gray-900 py-3 px-4"
          >
            <Mail className="w-4 h-4 mr-2" />
            Send Invite
          </TabsTrigger>
          <TabsTrigger
            value="register"
            className="rounded-lg data-[state=active]:bg-gray-100 data-[state=active]:shadow-sm data-[state=active]:rounded-b-none data-[state=active]:border-b-0 transition-all duration-200 hover:bg-white/60 font-medium text-gray-600 data-[state=active]:text-gray-900 py-3 px-4"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Direct Register
          </TabsTrigger>
          <TabsTrigger
            value="invitations"
            className="rounded-lg data-[state=active]:bg-gray-100 data-[state=active]:shadow-sm data-[state=active]:rounded-b-none data-[state=active]:border-b-0 transition-all duration-200 hover:bg-white/60 font-medium text-gray-600 data-[state=active]:text-gray-900 py-3 px-4"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Invitations
            {pendingInvitations > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 h-5 px-2 text-xs bg-gray-100 text-gray-700 border-0"
              >
                {pendingInvitations}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="directory"
          className="mt-0 bg-white rounded-xl rounded-tl-none shadow-sm border-t-0"
        >
          <MemberDirectory />
        </TabsContent>

        <TabsContent
          value="invite"
          className="mt-0 bg-white rounded-xl rounded-tl-none shadow-sm border-t-0"
        >
          <InvitationForm />
        </TabsContent>

        <TabsContent
          value="register"
          className="mt-0 bg-white rounded-xl rounded-tl-none shadow-sm border-t-0"
        >
          <DirectRegistration />
        </TabsContent>

        <TabsContent
          value="invitations"
          className="mt-0 bg-white rounded-xl rounded-tl-none shadow-sm border-t-0"
        >
          <InvitationList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
