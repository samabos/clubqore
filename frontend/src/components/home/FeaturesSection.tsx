import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
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
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    icon: Building2,
    title: "Club Administration",
    description:
      "Comprehensive club management system for multiple football academies and training centers.",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    icon: Calendar,
    title: "Event Scheduling",
    description:
      "Organize matches, training sessions, and tournaments with intelligent calendar management.",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    icon: CreditCard,
    title: "Billing & Payments",
    description:
      "Automated payment processing, subscription management, and financial reporting.",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    icon: MessageSquare,
    title: "Communication Hub",
    description:
      "Connect coaches, parents, and members with built-in messaging and notification systems.",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
  {
    icon: CheckCircle,
    title: "Attendance Tracking",
    description:
      "Monitor participation rates and generate detailed attendance reports for all activities.",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    icon: Baby,
    title: "Parent Portal",
    description:
      "Dedicated parent dashboard to track their child's progress, payments, and communications.",
    color: "text-pink-600",
    bgColor: "bg-pink-50",
  },
  {
    icon: Shield,
    title: "Data Security",
    description:
      "Enterprise-grade security with encryption, backup, and compliance with data protection laws.",
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Manage Your Football Club
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our comprehensive platform provides all the tools you need to
            streamline operations, engage with members, and grow your football
            club.
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
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed">
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
