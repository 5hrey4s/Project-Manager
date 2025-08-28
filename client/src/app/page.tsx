import Footer from "@/components/ui/landing/Footer";
import HeroSection from "@/components/ui/landing/HeroSection";
import LandingNavbar from "@/components/ui/landing/LandingNavbar";


export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950">
      <LandingNavbar />
      <main className="flex-grow">
        <HeroSection />
        {/* We will add the other sections (Features, Pricing, etc.) here later */}
      </main>
      <Footer />
    </div>
  );
}