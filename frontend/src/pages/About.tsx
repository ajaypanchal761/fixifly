import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, Mail, Phone, Globe, MapPin, ArrowLeft, Star, Award, Users, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const About = () => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16 sm:pt-20 pb-20 sm:pb-8 overflow-y-auto">
      <div className="container mx-auto px-4 lg:px-8 py-8 min-h-full">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToHome}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </div>

        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Info className="w-8 h-8 text-primary" />
            <h1 className="text-4xl sm:text-5xl font-bold">
              About <span className="text-gradient">Fixfly</span>
            </h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Who is Fixfly */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-gray-800 flex items-center justify-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                Who is Fixfly
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed text-lg">
                Fixfly is a trusted IT service provider and a brand of Fixfly Innovations Pvt. Ltd., established in 2019. 
                Recognized as one of India's most reliable after-sales service providers, Fixfly specializes in offering 
                a wide range of IT services tailored to both individual and corporate clients.
              </p>
            </CardContent>
          </Card>

          {/* About Fixfly */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-gray-800 flex items-center justify-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                About Fixfly: Your Trusted IT Service Partner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Brand Authorization */}
              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Brand Authorization
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Fixfly Innovations Pvt. Ltd. is a trusted, brand-authorized service provider for laptops, printers, and electronics. 
                  Leading brands like HP recognize Fixfly as an authorized service partner, ensuring customers receive genuine and reliable services.
                </p>
              </section>

              {/* Comprehensive IT Services */}
              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Comprehensive IT Services
                </h3>
                <p className="text-gray-600 mb-4">Fixfly offers a wide array of IT services, including:</p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span><strong>Laptop and Printer Repairs:</strong> Expert solutions for various technical issues.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span><strong>IT Hardware Solutions:</strong> Providing quality hardware components and accessories.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span><strong>Maintenance Services:</strong> Ensuring optimal performance of your devices.</span>
                  </li>
                </ul>
              </section>
            </CardContent>
          </Card>

          {/* Customer Testimonials */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-gray-800 flex items-center justify-center gap-2">
                <Star className="w-6 h-6 text-primary" />
                Customer Testimonials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-600 mb-4">Clients have expressed high satisfaction with Fixfly's services:</p>
              
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <p className="text-gray-700 italic">
                    "I had an issue with my HP laptop, and Fixfly fixed it perfectly. Their team was professional and knowledgeable, 
                    and the fact that they are an authorized service partner for HP gave me complete peace of mind. Highly recommended!"
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                  <p className="text-gray-700 italic">
                    "Fixfly's customer support is outstanding! I took my Dell laptop there for repair, and the entire process was 
                    smooth and hassle-free. The team explained everything clearly and provided quick service. I wouldn't trust anyone 
                    else for my IT needs!"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ISO Certification */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-gray-800 flex items-center justify-center gap-2">
                <Award className="w-6 h-6 text-primary" />
                ISO Certification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed text-center">
                Fixfly Innovations Pvt. Ltd. is an <strong>ISO 9001:2015 certified company</strong>, reflecting its commitment to 
                quality management and customer satisfaction.
              </p>
            </CardContent>
          </Card>

          {/* Corporate Trust */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-gray-800 flex items-center justify-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                Corporate Trust
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed text-center">
                Renowned corporations, including <strong>Reliance, HP, and Lenovo</strong>, rely on Fixfly for dependable IT solutions, 
                underscoring its industry credibility.
              </p>
            </CardContent>
          </Card>

          {/* Online Presence */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-gray-800 flex items-center justify-center gap-2">
                <Globe className="w-6 h-6 text-primary" />
                Online Presence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed text-center">
                Fixfly maintains an informative website where clients can learn more about services, read articles, and book services online.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-gray-800 flex items-center justify-center gap-2">
                <Phone className="w-6 h-6 text-primary" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-gray-600">Phone:</p>
                      <a href="tel:022-6964-7030" className="text-primary hover:underline font-medium">
                        022-6964-7030
                      </a>
                      <span className="text-gray-500"> / </span>
                      <a href="tel:9931-354-354" className="text-primary hover:underline font-medium">
                        9931-354-354
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-gray-600">Email:</p>
                      <a href="mailto:info@fixfly.in" className="text-primary hover:underline font-medium">
                        info@fixfly.in
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-gray-600">Website:</p>
                      <a href="https://www.fixfly.in" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                        www.fixfly.in
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-gray-600">Address:</p>
                    <p className="text-gray-700">
                      Shop No 43, -A, F Grd W P, Sion,<br />
                      Mumbai, Maharashtra, India, 400022
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Final Message */}
          <Card className="shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 mb-4">
            <CardContent className="pt-6">
              <p className="text-gray-800 text-center text-lg font-medium">
                At Fixfly, we are dedicated to delivering exceptional IT services, ensuring your technology functions seamlessly.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default About;
