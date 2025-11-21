import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  User, 
  ShoppingBag, 
  BookOpen, 
  CreditCard, 
  Users, 
  Award, 
  Notebook, 
  Tag, 
  Laptop, 
  Pen,
  Gift,
  Star,
  Shield
} from "lucide-react";

interface VendorBenefitsModalProps {
  children: React.ReactNode;
  hasInitialDeposit?: boolean;
}

const VendorBenefitsModal: React.FC<VendorBenefitsModalProps> = ({ children, hasInitialDeposit = false }) => {
  const benefits = [
    {
      id: 1,
      title: "Online Training",
      description: "Comprehensive training program to enhance your skills",
      icon: GraduationCap,
      color: "bg-blue-100 text-blue-600"
    },
    {
      id: 2,
      title: "2 T-shirts",
      description: "Professional branded t-shirts for your work",
      icon: User,
      color: "bg-green-100 text-green-600"
    },
    {
      id: 3,
      title: "1 Bag",
      description: "Durable work bag for carrying your tools",
      icon: ShoppingBag,
      color: "bg-purple-100 text-purple-600"
    },
    {
      id: 4,
      title: "2 Bill Books",
      description: "Professional billing books for your services",
      icon: BookOpen,
      color: "bg-orange-100 text-orange-600"
    },
    {
      id: 5,
      title: "ID Card",
      description: "Official Fixfly certified partner ID card",
      icon: CreditCard,
      color: "bg-indigo-100 text-indigo-600"
    },
    {
      id: 6,
      title: "Visiting Cards",
      description: "Professional visiting cards for networking",
      icon: Users,
      color: "bg-pink-100 text-pink-600"
    },
    {
      id: 7,
      title: "Certificate",
      description: "Official certification as Fixfly partner",
      icon: Award,
      color: "bg-yellow-100 text-yellow-600"
    },
    {
      id: 9,
      title: "Company Stickers",
      description: "Branded stickers for your vehicle/tools",
      icon: Tag,
      color: "bg-red-100 text-red-600"
    },
    {
      id: 12,
      title: "1 Year Insurance",
      description: "₹5,00,000 Accidental insurance for 1 year",
      icon: Shield,
      color: "bg-emerald-100 text-emerald-600"
    }
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-2">
            🎉 Fixfly Certified Partner Benefits
          </DialogTitle>
          <p className="text-center text-muted-foreground mb-6">
            {hasInitialDeposit 
              ? "You are now a certified partner! Here are all the benefits you have access to:"
              : "Become a certified partner and unlock these amazing benefits with your ₹3,999 deposit"
            }
          </p>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header Section */}
          <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border-2 border-dashed border-blue-200">
            <div className="flex items-center justify-center mb-3">
              <Star className="w-8 h-8 text-yellow-500 mr-2" />
              <h3 className="text-xl font-bold text-gray-800">Certified Partner Package</h3>
            </div>
            <p className="text-gray-600 mb-4">
              {hasInitialDeposit 
                ? "You have access to all these benefits as a certified partner!"
                : "All these benefits are included when you make your initial deposit of ₹3,999"
              }
            </p>
            <Badge variant="secondary" className="bg-green-100 text-green-800 text-lg px-4 py-2">
              Total Value: ₹3,999+ Worth of Benefits
            </Badge>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefits.map((benefit) => {
              const IconComponent = benefit.icon;
              return (
                <div
                  key={benefit.id}
                  className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className={`p-2 rounded-full ${benefit.color}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {benefit.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>


          {/* Benefits Validity Notice */}
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Shield className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Benefits Validity</h4>
                <p className="text-sm text-gray-600">
                  All benefits are valid for 1 year from the date of deposit. After 1 year, benefits will expire and you'll need to recharge with ₹3,999 to continue enjoying these benefits.
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          {!hasInitialDeposit && (
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h4 className="font-bold text-blue-900 mb-2">Ready to Become a Certified Partner?</h4>
              <p className="text-blue-700 text-sm">
                Make your ₹3,999 deposit now and start enjoying all these benefits immediately!
              </p>
            </div>
          )}
          
          {hasInitialDeposit && (
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h4 className="font-bold text-green-900 mb-2">Congratulations! You're a Certified Partner</h4>
              <p className="text-green-700 text-sm">
                You have access to all these benefits. Contact support if you need any assistance with your benefits.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VendorBenefitsModal;
