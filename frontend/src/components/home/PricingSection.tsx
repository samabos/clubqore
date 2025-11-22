import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { Check } from "lucide-react";

const features = [
  "Unlimited members",
  "Complete member management",
  "Event scheduling & calendar",
  "Payment processing",
  "Parent portal access",
  "Team & squad management",
  "Attendance tracking",
  "Email notifications",
  "Mobile-friendly interface",
  "Advanced analytics & reporting",
  "Document storage",
  "Multi-user access",
];

interface PricingSectionProps {
  onGetStarted: () => void;
}

export function PricingSection({ onGetStarted }: PricingSectionProps) {
  return (
    <section id="pricing" className="py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-4 py-1.5 mb-4 text-sm font-medium">
            Early Access Available
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Join Us in Revolutionising Club Management
          </h2>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Be among the first clubs to experience the future of football club management. <span className="font-semibold text-gray-900">Forever free for clubs.</span>
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card className="border-0 bg-white shadow-lg rounded-2xl">
            <CardContent className="p-8 md:p-10">
              <div className="text-center mb-8">
                <div className="mb-4">
                  <span className="text-5xl md:text-6xl font-bold text-gray-900">£0</span>
                  <span className="text-xl text-gray-600 ml-2">forever</span>
                </div>
                <p className="text-gray-600">No credit card required</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                className="w-full rounded-xl py-5 gradient-primary text-white hover:opacity-90"
                onClick={onGetStarted}
              >
                Join Early Access
              </Button>

              <p className="text-center text-sm text-gray-600 mt-6">
                Forever free for clubs. We're building the future of grassroots football together.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
