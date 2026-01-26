import React from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import { FileText, Shield, AlertTriangle, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import VendorHeader from '../components/VendorHeader';
import VendorBottomNav from '../components/VendorBottomNav';
import Footer from '../../components/Footer';
import NotFound from '../../pages/NotFound';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const VendorTermsConditions = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));


  // Show 404 error on desktop - must be before any other hooks
  // Show 404 error on desktop
  if (!isMobile) {
    return <NotFound />;
  }



  return (
    <div className="flex flex-col min-h-screen bg-background">
      <VendorHeader />
      <main className="flex-1 pb-24 pt-16 overflow-y-auto">
        <div className="container mx-auto px-4 py-4">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-3">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Fixfly Partner & Vendor Terms & Conditions</h1>
            <p className="text-muted-foreground text-sm">Last Updated: October 2025</p>
            <p className="text-muted-foreground text-xs">Company Name: Pixfly Innovations Pvt. Ltd.</p>
            <p className="text-muted-foreground text-xs">Brand Name: Fixfly™</p>
            <p className="text-muted-foreground text-xs">Applicable To: All Fixfly Service Providers, Technicians, Vendors & Business Partners</p>
          </div>

          {/* 1. Introduction */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                1. Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                These Terms & Conditions ("Terms") define the rules, responsibilities, and code of conduct for all Fixfly Partners and Vendors associated with Pixfly Innovations Pvt. Ltd. ("the Company").
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mt-2">
                By signing up or working as a Fixfly Partner, you agree to follow these rules strictly. Violation of these Terms may lead to penalties, suspension, or permanent termination from the platform.
              </p>
            </CardContent>
          </Card>

          {/* 2. Onboarding & Documentation */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                2. Onboarding & Documentation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-700 mb-3">All partners must complete full verification before activation:</p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Valid Aadhaar card and address proof</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Family details and alternate contact number</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Passport-size photo (for ID card)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Address verification by the Fixfly team</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 3. Security Deposit & Onboarding Fee */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-yellow-600" />
                </div>
                3. Security Deposit & Onboarding Fee
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Complete profile verification is required before activation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Premium Partner Benefits include:</span>
                </li>
              </ul>
              <p className="text-sm text-gray-700 mt-3 font-semibold">Includes:</p>
              <ul className="space-y-1 text-sm text-gray-700 ml-4">
                <li>• Fixfly Branded Bag</li>
                <li>• 2 T-shirts</li>
                <li>• Pen & Stickers</li>
                <li>• Partner ID Card</li>
                <li>• Certificate of Association</li>
                <li>• 2 Bill Books</li>
                <li>• Visiting Cards</li>
                <li>• ₹5,00,000 Accidental Insurance Coverage</li>
                <li>• Online Training Access</li>
              </ul>
            </CardContent>
          </Card>

          {/* 4. Task Allocation & Area */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-purple-600" />
                </div>
                4. Task Allocation & Area
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>You will receive service tasks only from your registered area or preferred pin code.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Do not accept tasks outside your area without company approval.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Always update the correct service status in the app.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 5. Payment & Settlement */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-indigo-600" />
                </div>
                5. Payment & Settlement
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Partners receive 50% of profit share on every completed task.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Payouts are processed every Sunday for eligible balances.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Minimum withdrawal amount: ₹5000.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>All payments must be made through Fixfly's official system only.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>All online payments from customers must go directly to the company's account.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 6. Partner Conduct & Code of Ethics */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                6. Partner Conduct & Code of Ethics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-700 mb-3">To maintain trust and brand reputation, all partners must:</p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Always be polite, professional, and punctual.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Never overcharge or quote unnecessary high prices to customers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Do not provide part quotations or pricing without company approval.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Never contact customers using your personal number or WhatsApp.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Do not distribute personal visiting cards, bills, or receipts.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Always ask the customer to leave a Google review after task completion.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>A 3-star rating or below will lead to strict disciplinary action.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Customer satisfaction and brand image must be your top priority.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 7. Cancellation & Penalty Rules */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-red-600" />
                </div>
                7. Cancellation & Penalty Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-700 mb-3">To ensure smooth operations, the following penalties apply:</p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Task Cancellation (from your side): ₹100</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Task Declined after assignment: ₹100</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Wrong update or false task closure: ₹100</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Fraudulent activity, wrong information, or misguiding customers: → Immediate ID block + legal action</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Incorrect payment or diversion of funds: → Permanent ID block and legal case</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 8. Service Quality & Warranty */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-cyan-600" />
                </div>
                8. Service Quality & Warranty
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>You are responsible for the service quality and warranty for your work.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Fixfly may inspect or review any completed task for quality assurance.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Repeated poor feedback or high complaint rates will lead to termination.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 9. Fraud & Misconduct */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-rose-50 to-red-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                </div>
                9. Fraud & Misconduct
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-700 mb-3">Strict action will be taken for:</p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-rose-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Fake updates or wrong service marking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-rose-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Misleading or threatening behavior toward customers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-rose-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Asking for direct payments or tips from customers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-rose-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Sharing company leads or data externally</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-rose-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Tampering with company pricing or communication</span>
                </li>
              </ul>
              <p className="text-sm text-gray-700 mt-3 font-semibold text-rose-600">
                Any fraudulent activity will result in legal action under Indian IT and contract laws.
              </p>
            </CardContent>
          </Card>

          {/* 10. Cancellation, Suspension & Termination */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-gray-600" />
                </div>
                10. Cancellation, Suspension & Termination
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>One written or verbal warning will be issued for minor issues.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Repeated violations or fraud will result in permanent termination.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Once terminated, all dues will be held for audit before release.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 11. Insurance & Safety */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-teal-600" />
                </div>
                11. Insurance & Safety
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>All verified Fixfly Premium Partners are covered under a ₹5,00,000 accidental insurance policy (conditions apply).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Partners must follow all safety and operational guidelines provided during training.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 12. Payment Settlement Example */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                </div>
                12. Payment Settlement Example
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Total Task Value: ₹1000</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Fixfly Commission: 50%</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Partner Share: ₹500 (credited after service completion)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Visit-only cases: No commission charged by Fixfly</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 13. Dispute & Escalation */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-violet-600" />
                </div>
                13. Dispute & Escalation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-700 mb-3">
                Any dispute regarding payments, penalties, or service issues must be reported to:
              </p>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Email:</strong> info@getfixfly.com or via official WhatsApp.</p>
                <p><strong>Jurisdiction:</strong> Unresolved disputes will be handled as per Mumbai jurisdiction under Indian law.</p>
              </div>
            </CardContent>
          </Card>

          {/* 14. Partner Acknowledgement */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-sky-600" />
                </div>
                14. Partner Acknowledgement
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-700 mb-3">By accepting these Terms, you confirm that:</p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-sky-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>You have read and understood all conditions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-sky-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>You agree to follow company processes, maintain professionalism, and ensure customer satisfaction.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-sky-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>You authorize Fixfly to deduct penalties or suspend accounts if policies are violated.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 15. Rights & Updates */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-lime-50 to-green-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-lime-100 rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-lime-600" />
                </div>
                15. Rights & Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                Fixfly reserves the right to update, modify, or add new rules at any time with prior notice.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mt-2">
                Continued use of the Fixfly Partner App or platform after updates implies your acceptance of the revised Terms.
              </p>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-indigo-600" />
                </div>
                Contact Support
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Phone:</strong> 022-6964-7030</p>
                <p><strong>WhatsApp:</strong> 99313-54354</p>
                <p><strong>Email:</strong> info@getfixfly.com</p>
                <p><strong>Address:</strong> Pixfly Innovations Pvt. Ltd., Sion, Mumbai – 400022, Maharashtra</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <div className="md:hidden">
        <Footer />
        <VendorBottomNav />
      </div>
    </div>
  );
};

export default VendorTermsConditions;
