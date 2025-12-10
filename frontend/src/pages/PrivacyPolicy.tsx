import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Mail, Phone, Globe, ArrowLeft, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16 sm:pt-16 pb-20 sm:pb-8 overflow-y-auto">
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
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-4xl sm:text-5xl font-bold">
              Privacy <span className="text-gradient">Policy</span>
            </h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg mb-4">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-gray-800">
                Privacy Policy
              </CardTitle>
              <div className="text-center text-gray-600 mt-2">
                <p><strong>Last Updated:</strong> October 2025</p>
                <p><strong>Company Name:</strong> Pixfly Innovations Pvt. Ltd.</p>
                <p><strong>Brand Name:</strong> Fixfly™</p>
                <p><strong>Website:</strong> www.getfixfly.com</p>
              </div>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <div className="space-y-8">
                {/* Contact Information */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Contact</h2>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-primary" />
                      <span className="text-gray-600">Call: 022-6964-7030</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-primary" />
                      <span className="text-gray-600">WhatsApp: 99313-54354</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-primary" />
                      <span className="text-gray-600">Email: info@getfixfly.com</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-primary" />
                      <span className="text-gray-600">Registered Address: Shop No. 43-A, F Grd W P, Welfare Centre Hutments, Sion, Mumbai – 400022, Maharashtra</span>
                    </div>
                  </div>
                </section>

                {/* Introduction */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">1. Introduction</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>
                      Fixfly ("we", "our", or "us") values your trust and is committed to protecting your personal information.
                    </p>
                    <p>
                      This Privacy Policy explains how we collect, use, store, and protect your information when you use our website, mobile app, or any of our services.
                    </p>
                    <p>
                      By using Fixfly's services, you agree to the practices described in this Privacy Policy.
                    </p>
                  </div>
                </section>

                {/* Information We Collect */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">2. Information We Collect</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>We collect the following types of information to provide and improve our services:</p>
                    
                    <h3 className="text-xl font-semibold text-gray-700 mb-3">a. Personal Information</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Name, phone number, email address, and location</li>
                      <li>Address and service preferences</li>
                      <li>Device details (for IT repair/insurance services)</li>
                      <li>Payment information (handled through secure third-party gateways)</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-gray-700 mb-3">b. Technical Information</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>IP address, browser type, operating system</li>
                      <li>Device information and app usage statistics</li>
                      <li>Cookies and analytics data for improving service experience</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-gray-700 mb-3">c. Communication Data</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Chat messages, call logs, and feedback shared with our support team</li>
                    </ul>
                  </div>
                </section>

                {/* How We Use Your Information */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">3. How We Use Your Information</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>Your information is used for:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Processing bookings, payments, and service delivery</li>
                      <li>Assigning nearby verified technicians</li>
                      <li>Sending updates, invoices, and notifications</li>
                      <li>Providing customer support and resolving issues</li>
                      <li>Improving user experience and app performance</li>
                      <li>Marketing offers and promotions (with consent)</li>
                    </ul>
                  </div>
                </section>

                {/* Data Sharing & Disclosure */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">4. Data Sharing & Disclosure</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>We do not sell or rent your personal information.</p>
                    <p>However, we may share limited data with:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Verified service partners or technicians (to complete your requested service)</li>
                      <li>Payment gateways for secure transactions</li>
                      <li>Law enforcement or regulatory authorities if required by law</li>
                    </ul>
                    <p>All third parties handling your data are bound by strict confidentiality agreements.</p>
                  </div>
                </section>

                {/* Data Security */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">5. Data Security</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>We use advanced security measures to protect your information:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>SSL encryption for all online transactions</li>
                      <li>Encrypted databases for personal data</li>
                      <li>Limited employee access on a need-to-know basis</li>
                    </ul>
                    <p>Despite our best efforts, no online platform is completely secure. Users are encouraged to keep login credentials private.</p>
                  </div>
                </section>

                {/* Cookies & Tracking */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">6. Cookies & Tracking</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>We use cookies and tracking tools to:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Enhance website performance</li>
                      <li>Remember user preferences</li>
                      <li>Analyze traffic and usage patterns</li>
                    </ul>
                    <p>You can disable cookies in your browser settings, but some site features may not function properly.</p>
                  </div>
                </section>

                {/* User Rights */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">7. User Rights</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>You have the right to:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Access and update your personal data</li>
                      <li>Request deletion of your information</li>
                      <li>Withdraw consent for marketing communications</li>
                    </ul>
                    <p>For such requests, contact us at info@getfixfly.com.</p>
                  </div>
                </section>

                {/* Retention of Information */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">8. Retention of Information</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>We retain your information only for as long as necessary to:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Complete your service or transaction</li>
                      <li>Comply with legal or tax obligations</li>
                      <li>Resolve disputes or enforce agreements</li>
                    </ul>
                  </div>
                </section>

                {/* Third-Party Links */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">9. Third-Party Links</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>Our website or app may contain links to third-party websites or services.</p>
                    <p>Fixfly is not responsible for their privacy practices, and we encourage you to review their policies separately.</p>
                  </div>
                </section>

                {/* Updates to This Policy */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">10. Updates to This Policy</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>We may update this Privacy Policy periodically. Any changes will be reflected on this page with an updated "Last Updated" date.</p>
                    <p>By continuing to use our services, you accept the revised policy.</p>
                  </div>
                </section>

                {/* Contact Us */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">11. Contact Us</h2>
                  <p className="text-gray-600 mb-4">
                    If you have questions or concerns about our Privacy Policy, please contact us:
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-primary" />
                      <span className="text-gray-600">022-6964-7030</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-primary" />
                      <span className="text-gray-600">WhatsApp: 99313-54354</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-primary" />
                      <span className="text-gray-600">info@getfixfly.com</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-primary" />
                      <span className="text-gray-600">Pixfly Innovations Pvt. Ltd., Sion, Mumbai – 400022, Maharashtra</span>
                    </div>
                  </div>
                </section>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
