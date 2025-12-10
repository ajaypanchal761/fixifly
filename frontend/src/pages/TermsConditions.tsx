import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Mail, Phone, Globe, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsConditions = () => {
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
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-4xl sm:text-5xl font-bold">
              Terms & <span className="text-gradient">Conditions</span>
            </h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg mb-4">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-gray-800">
                Service Terms and Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <div className="space-y-8">
                {/* Introduction */}
                <div>
                  <p className="text-gray-700 leading-relaxed">
                    Please read these terms and conditions carefully before using Fixfly services.
                  </p>
                </div>

                {/* Payment Terms */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">3. Payment Terms</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>
                      • Payments can be made online via UPI, credit/debit card, or wallet through secure payment gateways.
                    </p>
                  </div>
                </section>

                {/* Cancellations & Refunds */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">4. Cancellations & Refunds</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>
                      • You may cancel your booking anytime before the service visit by contacting support.
                    </p>
                    <p>
                      • Refunds (if applicable) will be processed within 1–2 business days to the original payment method.
                    </p>
                    <p>
                      • Refunds are subject to inspection and verification of the service request status.
                    </p>
                  </div>
                </section>

                {/* Service Execution */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">5. Service Execution</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>
                      • Fixfly assigns technicians based on location and service type.
                    </p>
                    <p>
                      • Technicians are verified and trained to deliver professional services.
                    </p>
                    <p>
                      • Service timelines depend on availability, location, and issue type.
                    </p>
                    <p>
                      • In case of delay or rescheduling, customers will be notified via call or message.
                    </p>
                  </div>
                </section>

                {/* Warranty on Services */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">6. Warranty on Services</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>
                      • Repairs and parts come with a limited service warranty (varies by product and issue).
                    </p>
                    <p>
                      • Warranty does not cover misuse, physical damage, or unauthorized repairs performed elsewhere.
                    </p>
                    <p>
                      • Replacement parts are subject to availability and manufacturer policy.
                    </p>
                  </div>
                </section>

                {/* User Responsibilities */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">7. User Responsibilities</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>By using Fixfly services, you agree to:</p>
                    <p>
                      • Provide accurate information during booking.
                    </p>
                    <p>
                      • Ensure safe and cooperative working conditions for our technicians.
                    </p>
                    <p>
                      • Avoid misuse or unauthorized recording of service personnel.
                    </p>
                  </div>
                </section>

                {/* Data Privacy & Security */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">8. Data Privacy & Security</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>We value your privacy.</p>
                    <p>
                      • Personal information shared with Fixfly is protected through SSL encryption and secure databases.
                    </p>
                    <p>
                      • Your data is used only for service delivery, communication, and support purposes.
                    </p>
                    <p>
                      • We do not sell or share customer data with third parties without consent.
                    </p>
                    <p>
                      Refer to our Privacy Policy for more details.
                    </p>
                  </div>
                </section>

                {/* Limitation of Liability */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">9. Limitation of Liability</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>Fixfly is not liable for:</p>
                    <p>
                      • Indirect or consequential damages arising from delays, third-party actions, or user negligence.
                    </p>
                    <p>
                      • Manufacturer defects or issues outside the service scope.
                    </p>
                    <p>
                      • Any data loss, hardware damage, or voided warranty resulting from prior unauthorized repairs.
                    </p>
                  </div>
                </section>

                {/* Third-Party Services */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">10. Third-Party Services</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>
                      Some services may be fulfilled by independent technicians or partner companies.
                    </p>
                    <p>
                      Fixfly ensures all partners are background-verified, but does not assume responsibility for damages caused by negligence beyond contractual terms.
                    </p>
                  </div>
                </section>

                {/* Changes to Terms */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">11. Changes to Terms</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>
                      Fixfly may modify these Terms periodically to improve user experience or comply with regulations.
                    </p>
                    <p>
                      Updated Terms will be posted on our websites, and continued use indicates acceptance.
                    </p>
                  </div>
                </section>

                {/* Contact Us */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">12. Contact Us</h2>
                  <p className="text-gray-600 mb-4">
                    For any queries, complaints, or support requests, please contact:
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

                {/* Governing Law */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">13. Governing Law</h2>
                  <p className="text-gray-600">
                    These Terms are governed by and construed in accordance with the laws of India, and any disputes shall be subject to the exclusive jurisdiction of Mumbai courts.
                  </p>
                </section>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
