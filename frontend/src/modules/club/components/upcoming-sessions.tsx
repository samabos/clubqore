import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Calendar, Users } from "lucide-react";
import { Session } from "../types/component-types";

const upcomingSessions: Session[] = [
  {
    id: 1,
    title: "Youth Training Session",
    time: "10:00 AM - 12:00 PM",
    date: "Today",
    participants: 18,
    coach: "Sarah Johnson",
  },
  {
    id: 2,
    title: "Advanced Skills Workshop",
    time: "2:00 PM - 4:00 PM",
    date: "Today",
    participants: 12,
    coach: "Mike Roberts",
  },
  {
    id: 3,
    title: "Match Preparation",
    time: "9:00 AM - 11:00 AM",
    date: "Tomorrow",
    participants: 22,
    coach: "David Wilson",
  },
];

export function UpcomingSessions() {
  return (
    <Card className="border-0 shadow-lg rounded-xl lg:col-span-2">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Upcoming Sessions
            </CardTitle>
            <CardDescription className="text-gray-600">
              Training sessions and activities
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg border-gray-200 hover:border-gray-300"
          >
            <Calendar className="w-4 h-4 mr-2" />
            View Calendar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {upcomingSessions.map((session) => (
            <div key={session.id} className="p-4 bg-gray-50 rounded-xl">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900">{session.title}</h4>
                  <p className="text-sm text-gray-600">{session.time}</p>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="rounded-lg">
                    {session.date}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    {session.participants}
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Coach:</span> {session.coach}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
