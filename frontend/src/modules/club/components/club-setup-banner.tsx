import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ClubSetupBannerProps } from "../types/component-types";

export function ClubSetupBanner({ hasClubSetup }: ClubSetupBannerProps) {
  const navigate = useNavigate();

  if (hasClubSetup) {
    return null;
  }

  return (
    <Card className="border-0 shadow-lg rounded-xl bg-gradient-to-r from-blue-50 to-purple-50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Set Up Your Club
              </h3>
              <p className="text-gray-600">
                Complete your club profile to start managing members and
                activities
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/app/club/setup")}
            className="rounded-xl gradient-primary text-white hover:opacity-90"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Set Up Club
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
