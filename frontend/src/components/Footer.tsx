import { Button } from "@/components/ui/button";
import { 
  Wrench, 
  Phone, 
  Mail, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin 
} from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    services: [
      "Laptop Repair",
      "Desktop Repair", 
      "Mac Repair",
      "Data Recovery",
      "CCTV Installation",
      "Phone Repair"
    ],
    company: [
      "About Us",
      "Our Team", 
      "Careers",
      "Press Kit",
      "Contact Us"
    ],
    support: [
      "Help Center",
      "FAQs",
      "Warranty",
      "Track Repair",
      "Book Service"
    ]
  };

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" }
  ];

  return (
    <footer className="bg-black text-white pb-20 hidden md:block">
      {/* Main Footer */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <img 
                src="/logofixifly.png" 
                alt="FixiFly Logo" 
                className="h-28 w-auto"
              />
            </div>
            
            <p className="text-gray-300 mb-6 max-w-md">
              Your trusted partner for all IT and electronics repair services. 
              Professional, reliable, and guaranteed quality repairs.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-blue-400" />
                <span className="text-gray-300">022-6964-7030</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-blue-400" />
                <span className="text-gray-300">9931-354-354</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-blue-400" />
                <span className="text-gray-300">info@fixfly.in</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-blue-400" />
                <span className="text-gray-300">SHOP NO 43, -A, F GRD W P, WELFARE CENTRE HUTMENTS, Mumbai, Mumbai- 400022, Maharashtra</span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Services</h3>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link}>
                  <a 
                    href="#" 
                    className="text-gray-300 hover:text-blue-400 transition-colors duration-200"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link}>
                  <a 
                    href="#" 
                    className="text-gray-300 hover:text-blue-400 transition-colors duration-200"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link}>
                  <a 
                    href="#" 
                    className="text-gray-300 hover:text-blue-400 transition-colors duration-200"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Button 
                variant="secondary" 
                className="bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300"
              >
                Emergency Support
              </Button>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="text-gray-300 text-sm">
              © {currentYear} FixFly. All rights reserved.
            </div>
            <div className="text-gray-300 text-sm">
              <a href="#" className="hover:text-blue-400 transition-colors duration-200">Privacy Policy</a> | <a href="/terms-conditions" className="hover:text-blue-400 transition-colors duration-200">Terms & Conditions</a>
            </div>
            
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="text-gray-300 hover:text-blue-400 transition-colors duration-200"
                  >
                    <IconComponent className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;