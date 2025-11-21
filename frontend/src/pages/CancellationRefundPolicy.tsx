import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Mail, Phone, Globe, ArrowLeft, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CancellationRefundPolicy = () => {
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
            <RefreshCw className="w-8 h-8 text-primary" />
            <h1 className="text-4xl sm:text-5xl font-bold">
              Cancellation & <span className="text-gradient">Refund Policy</span>
            </h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg mb-4">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-gray-800">
                Cancellation & Refund Policy
              </CardTitle>
              <div className="text-center text-gray-600 mt-2">
                <p><strong>Last Updated:</strong> October 2025</p>
                <p><strong>Company Name:</strong> Pixfly Innovations Private Limited</p>
                <p><strong>Brand Name:</strong> Fixfly™</p>
                <p><strong>Websites:</strong> www.fixfly.in | www.getfixfly.com</p>
              </div>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <div className="space-y-8">
                {/* Support Information */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Support</h2>
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

                {/* Overview */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">1. Overview</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>
                      At Fixfly, we strive to provide our customers with a smooth and transparent service experience.
                    </p>
                    <p>
                      This Cancellation & Refund Policy outlines the terms under which customers can cancel their bookings and receive refunds for services booked through our platforms.
                    </p>
                  </div>
                </section>

                {/* Service Cancellations */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">2. Service Cancellations</h2>
                  <div className="space-y-4 text-gray-600">
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Customers can cancel any booking at any time before the assigned technician begins the visit.</li>
                      <li>Cancellations can be made through our website, mobile app, WhatsApp, or by calling our customer support.</li>
                      <li>There are no cancellation charges if the booking is canceled before service initiation.</li>
                    </ul>
                  </div>
                </section>

                {/* Refund Eligibility */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">3. Refund Eligibility</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>Refunds are applicable under the following conditions:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>The customer cancels a prepaid booking before technician visit or inspection.</li>
                      <li>The assigned technician is unavailable, and the service cannot be rescheduled.</li>
                      <li>The customer is unsatisfied with the initial diagnosis and decides not to proceed with the repair.</li>
                    </ul>
                  </div>
                </section>

                {/* Refund Process */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">4. Refund Process</h2>
                  <div className="space-y-4 text-gray-600">
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Once your cancellation is approved, the refund will be processed within 1–2 business days.</li>
                      <li>Refunds are credited back to the original payment method (UPI, card, wallet, or bank account).</li>
                      <li>For COD (cash) bookings, refunds (if applicable) will be transferred digitally upon confirmation.</li>
                    </ul>
                  </div>
                </section>

                {/* Inspection Charges */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">5. Inspection Charges</h2>
                  <div className="space-y-4 text-gray-600">
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>A standard inspection fee (usually ₹199 or as displayed during booking) is applicable for technician visits.</li>
                      <li>The inspection fee is adjustable with the total service cost if you proceed with the repair.</li>
                      <li>If you choose to cancel after inspection, the inspection fee is non-refundable.</li>
                    </ul>
                  </div>
                </section>

                {/* Rescheduling Policy */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">6. Rescheduling Policy</h2>
                  <div className="space-y-4 text-gray-600">
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Customers can reschedule bookings at no extra cost by contacting our support team.</li>
                      <li>If a technician is already on the way, rescheduling may be subject to availability.</li>
                    </ul>
                  </div>
                </section>

                {/* Exceptions */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">7. Exceptions</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>Refunds are not applicable if:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>The customer cancels the service after completion or part execution of work.</li>
                      <li>The issue reported was resolved as per the agreed service scope.</li>
                      <li>Any physical damage or third-party tampering occurs after the technician's visit.</li>
                    </ul>
                  </div>
                </section>

                {/* Refund for Digital & Online Services */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">8. Refund for Digital & Online Services</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>For digital or business services (like website, app development, SEO, marketing):</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Refunds are applicable only before project initiation or in case of non-delivery.</li>
                      <li>Once project work has started, refund eligibility will depend on the work completed.</li>
                    </ul>
                  </div>
                </section>

                {/* Contact for Cancellation/Refund */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">9. Contact for Cancellation/Refund</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>To cancel your booking or request a refund, please reach out to us:</p>
                    
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
                    </div>
                    
                    <p>Please include your Booking ID, registered phone number, and reason for cancellation in your message for faster processing.</p>
                  </div>
                </section>

                {/* Policy Updates */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">10. Policy Updates</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>Fixfly reserves the right to modify or update this policy at any time to ensure clarity and compliance.</p>
                    <p>Changes will be posted on this page with an updated "Last Updated" date.</p>
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

export default CancellationRefundPolicy;
