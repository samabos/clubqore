import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { Play, ArrowRight } from "lucide-react";

interface HeroSectionProps {
  onGetStarted: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge className="bg-primary/10 text-primary border-primary/20 rounded-xl">
                #1 Football Club Management Platform
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
                Power Your
                <span className="text-primary"> Football Club</span>
                <br />
                with ClubQore
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Complete management solution for football clubs, academies, and
                training centers. Manage members, schedule events, process
                payments, and engage with parents - all in one platform.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="rounded-xl gradient-primary text-white hover:opacity-90 px-8 py-4"
                onClick={onGetStarted}
              >
                <Play className="w-5 h-5 mr-2" />
                Book Free Demo
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl border-gray-200 hover:border-gray-300 px-8 py-4"
              >
                Watch Video Tour
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-white bg-gray-200"
                  ></div>
                ))}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Trusted by 500+ clubs
                </p>
                <p className="text-sm text-gray-500">
                  Join thousands of satisfied customers
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative z-10">
              <Card className="border-0 shadow-2xl rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=600&fit=crop"
                    alt="ClubQore Dashboard"
                    className="w-full h-96 object-cover"
                  />
                </CardContent>
              </Card>
            </div>
            <div className="absolute top-4 -left-4 w-20 h-20 bg-yellow-400 rounded-2xl opacity-20"></div>
            <div className="absolute bottom-4 -right-4 w-16 h-16 bg-green-400 rounded-2xl opacity-20"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
