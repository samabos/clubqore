import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import {
  Plus,
  Calendar,
  DollarSign,
  MessageSquare,
  Activity,
} from "lucide-react";

export function QuickActions() {
  return (
    <Card className="border-0 shadow-lg rounded-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Quick Actions
        </CardTitle>
        <CardDescription className="text-gray-600">
          Common tasks and shortcuts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start rounded-xl border-gray-200 hover:border-gray-300"
        >
          <Plus className="w-4 h-4 mr-3" />
          Add New Member
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start rounded-xl border-gray-200 hover:border-gray-300"
        >
          <Calendar className="w-4 h-4 mr-3" />
          Schedule Session
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start rounded-xl border-gray-200 hover:border-gray-300"
        >
          <DollarSign className="w-4 h-4 mr-3" />
          Process Payments
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start rounded-xl border-gray-200 hover:border-gray-300"
        >
          <MessageSquare className="w-4 h-4 mr-3" />
          Send Announcement
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start rounded-xl border-gray-200 hover:border-gray-300"
        >
          <Activity className="w-4 h-4 mr-3" />
          View Reports
        </Button>
      </CardContent>
    </Card>
  );
}
