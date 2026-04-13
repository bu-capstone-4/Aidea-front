import LandingHeader from '@/components/landing/LandingHeader';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import WorkflowSection from '@/components/landing/WorkflowSection';
import CTASection from '@/components/landing/CTASection';
import LandingFooter from '@/components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <LandingHeader />
      <main>
        <HeroSection />
        <FeaturesSection />
        <WorkflowSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
