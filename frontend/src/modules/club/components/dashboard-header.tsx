import { Button } from "../../../components/ui/button";
import { Plus, MessageSquare } from "lucide-react";
import { useAuth } from "../../../stores/authStore";
import { useNavigate } from "react-router-dom";

export function DashboardHeader() {
  const { userClub } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-start">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          {userClub?.name || "Club"} Dashboard
        </h1>
        <p className="text-sm text-gray-500 hidden lg:block">
          Here's what's happening with your club today.
        </p>
      </div>
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="rounded-xl border-gray-200 hover:border-gray-300"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Messages
        </Button>
        <Button
          className="rounded-xl gradient-primary text-white hover:opacity-90"
          onClick={() => navigate("/app/club/member/manage")}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </div>
    </div>
  );
}
