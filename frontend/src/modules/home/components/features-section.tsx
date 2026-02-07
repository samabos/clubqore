import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Building2,
  Calendar,
  CreditCard,
  MessageSquare,
  CheckCircle,
  Baby,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Member Management",
    description:
      "Streamline member registration, profiles, and tracking with advanced member management tools.",
    color: "text-primary",
    bgColor: "bg-blue-50",
  },
  {
    icon: Building2,
    title: "Club Administration",
    description:
      "Comprehensive club management system for multiple football academies and training centres.",
    color: "text-primary",
    bgColor: "bg-purple-50",
  },
  {
    icon: Calendar,
    title: "Event Scheduling",
    description:
      "Organise matches, training sessions, and tournaments with intelligent calendar management.",
    color: "text-primary",
    bgColor: "bg-blue-50",
  },
  {
    icon: CreditCard,
    title: "Billing & Payments",
    description:
      "Automated payment processing, subscription management, and financial reporting.",
    color: "text-primary",
    bgColor: "bg-purple-50",
  },
  {
    icon: MessageSquare,
    title: "Communication Hub",
    description:
      "Connect coaches, parents, and members with built-in messaging and notification systems.",
    color: "text-primary",
    bgColor: "bg-blue-50",
  },
  {
    icon: CheckCircle,
    title: "Attendance Tracking",
    description:
      "Monitor participation rates and generate detailed attendance reports for all activities.",
    color: "text-primary",
    bgColor: "bg-purple-50",
  },
  {
    icon: Baby,
    title: "Parent Portal",
    description:
      "Dedicated parent dashboard to track their child's progress, payments, and communications.",
    color: "text-primary",
    bgColor: "bg-blue-50",
  },
  {
    icon: Shield,
    title: "Data Security",
    description:
      "Enterprise-grade security with encryption, backup, and compliance with data protection laws.",
    color: "text-primary",
    bgColor: "bg-purple-50",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Built for Modern Football Clubs
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're creating a fresh, simple platform designed specifically for grassroots
            football clubs. All the essential tools you need, without the complexity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-0 shadow-lg rounded-2xl hover:shadow-xl transition-shadow"
            >
              <CardHeader className="pb-4">
                <div
                  className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4`}
                >
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <CardTitle className="text-base font-semibold text-gray-900">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
