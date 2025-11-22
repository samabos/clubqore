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
    <section className="relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1920&h=1080&fit=crop&q=80"
          alt="Youth football academy"
          className="w-full h-full object-cover object-center"
        />
        {/* Gradient overlay for better text readability - stronger on left where text is */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/75 to-gray-900/30"></div>
        {/* Additional bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-transparent to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="max-w-3xl">
          <div className="space-y-7">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
                The Future of
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  Football Club
                </span>
                Management Starts Here
              </h1>
              <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
                A fresh approach to club management built for modern football clubs.
                Manage members, organise events, process payments, and engage with parents -
                all in one simple platform. <span className="font-semibold text-white">100% free for clubs.</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="rounded-xl gradient-primary text-white hover:opacity-90 px-8 py-4 text-base shadow-2xl shadow-blue-500/50"
                onClick={onGetStarted}
              >
                <Play className="w-5 h-5 mr-2" />
                Book Free Demo
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 px-8 py-4 text-base"
              >
                Watch Video Tour
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 right-10 w-32 h-32 bg-blue-500 rounded-full opacity-20 blur-3xl"></div>
      <div className="absolute bottom-20 left-10 w-40 h-40 bg-purple-500 rounded-full opacity-20 blur-3xl"></div>
    </section>
  );
}
