import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Progress } from "../../../components/ui/progress";

export function MonthlyGoals() {
  return (
    <Card className="border-0 shadow-lg rounded-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Monthly Goals
        </CardTitle>
        <CardDescription className="text-gray-600">
          Track your club's progress
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium text-gray-700">
              Member Growth
            </p>
            <p className="text-sm text-gray-600">78/100</p>
          </div>
          <Progress value={78} className="h-2" />
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium text-gray-700">
              Revenue Target
            </p>
            <p className="text-sm text-gray-600">$13,890/$15,000</p>
          </div>
          <Progress value={92.6} className="h-2" />
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium text-gray-700">
              Session Attendance
            </p>
            <p className="text-sm text-gray-600">92%</p>
          </div>
          <Progress value={92} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
