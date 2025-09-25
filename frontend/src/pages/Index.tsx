import Hero from "@/components/Hero";
import ServicesGrid from "@/components/ServicesGrid";
import BannerAd from "@/components/BannerAd";
import HomeApplianceProducts from "@/components/HomeApplianceProducts";
import Blog from "@/components/Blog";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <ServicesGrid />
      <BannerAd />
      <HomeApplianceProducts />
      <Blog />
    </div>
  );
};

export default Index;
