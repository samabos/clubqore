import { LandingNavigation } from "./LandingNavigation";
import { HeroSection } from "./HeroSection";
import { StatsSection } from "./StatsSection";
import { FeaturesSection } from "./FeaturesSection";
import { PricingSection } from "./PricingSection";
import { ContactSection } from "./ContactSection";
import { LandingFooter } from "./LandingFooter";

interface LandingPageProps {
  onGetStarted?: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <LandingNavigation onGetStarted={handleGetStarted} />

      <HeroSection onGetStarted={handleGetStarted} />
      <StatsSection />
      <FeaturesSection />
      <PricingSection onGetStarted={handleGetStarted} />
      <ContactSection />
      <LandingFooter />
    </div>
  );
}
