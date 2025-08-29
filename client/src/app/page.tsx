import BenefitsSection from "@/components/ui/landing/BenefitsSection";
import FeatureShowcase from "@/components/ui/landing/FeatureShowcase";
import FinalCTA from "@/components/ui/landing/FinalCTA";
import Footer from "@/components/ui/landing/Footer";
import HeroSection from "@/components/ui/landing/HeroSection";
import PricingSection from "@/components/ui/landing/PricingSection";
import SocialProof from "@/components/ui/landing/SocialProof";


export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950">
      <main className="flex-grow">
        <HeroSection />
        <SocialProof /> 
        <FeatureShowcase /> 
        <BenefitsSection />
        <PricingSection />  {/* <<< Add Pricing */}
        <FinalCTA /> 
      </main>
      <Footer />
    </div>
  );
}   