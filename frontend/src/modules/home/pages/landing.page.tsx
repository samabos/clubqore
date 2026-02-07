import {
  LandingNavigation,
  HeroSection,
  StatsSection,
  FeaturesSection,
  PricingSection,
  ContactSection,
  LandingFooter,
} from "../components";

interface LandingPageProps {
  onGetStarted?: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const handleGetStarted = () => {
    // Scroll to contact section
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
    // Also call the optional callback if provided
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
