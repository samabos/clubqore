import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Bell } from "lucide-react";
import { Alert } from "../types/component-types";

const alerts: Alert[] = [
  {
    id: 1,
    type: "warning",
    title: "Payment Overdue",
    message: "3 members have overdue payments",
    time: "2 hours ago",
  },
  {
    id: 2,
    type: "info",
    title: "Session Reminder",
    message: "Youth training starts in 30 minutes",
    time: "30 minutes ago",
  },
  {
    id: 3,
    type: "success",
    title: "New Registration",
    message: "Alex Thompson completed registration",
    time: "1 hour ago",
  },
];

export function AlertsPanel() {
  return (
    <Card className="border-0 shadow-lg rounded-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id} className="p-3 bg-gray-50 rounded-xl">
            <div className="flex items-start gap-3">
              <div
                className={`w-2 h-2 rounded-full mt-2 ${
                  alert.type === "warning"
                    ? "bg-yellow-500"
                    : alert.type === "success"
                    ? "bg-green-500"
                    : "bg-blue-500"
                }`}
              ></div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">
                  {alert.title}
                </p>
                <p className="text-sm text-gray-600 mb-1">{alert.message}</p>
                <p className="text-xs text-gray-500">{alert.time}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
