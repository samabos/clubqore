import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Check } from "lucide-react";

const pricingPlans = [
  {
    name: "Starter",
    price: "49",
    period: "month",
    description: "Perfect for small clubs and academies",
    features: [
      "Up to 50 members",
      "Basic event scheduling",
      "Member management",
      "Email support",
      "Basic reporting",
    ],
    popular: false,
    color: "border-gray-200",
  },
  {
    name: "Professional",
    price: "99",
    period: "month",
    description: "Ideal for growing football clubs",
    features: [
      "Up to 200 members",
      "Advanced scheduling",
      "Payment processing",
      "Parent portal",
      "Advanced analytics",
      "Priority support",
      "Mobile app access",
    ],
    popular: true,
    color: "border-primary",
  },
  {
    name: "Enterprise",
    price: "199",
    period: "month",
    description: "For large clubs and organizations",
    features: [
      "Unlimited members",
      "Multi-club management",
      "Custom branding",
      "API access",
      "Advanced integrations",
      "24/7 dedicated support",
      "Training & onboarding",
    ],
    popular: false,
    color: "border-gray-200",
  },
];

interface PricingSectionProps {
  onGetStarted: () => void;
}

export function PricingSection({ onGetStarted }: PricingSectionProps) {
  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600">
            Choose the perfect plan for your football club's needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <Card
              key={index}
              className={`border-2 ${
                plan.color
              } shadow-lg rounded-2xl relative ${
                plan.popular ? "scale-105" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-white rounded-xl px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-6">
                <CardTitle className="text-xl font-semibold text-gray-900">
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {plan.description}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-gray-600">/{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full rounded-xl py-3 ${
                    plan.popular
                      ? "gradient-primary text-white hover:opacity-90"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                  onClick={onGetStarted}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
