import Hero from "@/components/Hero";
import ServicesGrid from "@/components/ServicesGrid";
import BannerAd from "@/components/BannerAd";
import ApplianceServices from "@/components/ApplianceServices";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <ServicesGrid />
      <BannerAd />
      <ApplianceServices />
    </div>
  );
};

export default Index;
