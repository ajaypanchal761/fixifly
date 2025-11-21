import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface RepairService {
  id: string;
  name: string;
  image: string;
}

const RepairServicesModal = ({ isOpen, onClose, serviceType = "repair" }: { isOpen: boolean; onClose: () => void; serviceType?: "repair" | "appliance" }) => {
  const repairServices: RepairService[] = [
    {
      id: "1",
      name: "Laptop Repair",
      image: "/laptop.avif"
    },
    {
      id: "2", 
      name: "Desktop Repair",
      image: "/desktop.jpg"
    },
    {
      id: "3",
      name: "Mac Repair",
      image: "/laptop.avif"
    },
    {
      id: "4",
      name: "Printer Repair",
      image: "/printer.png"
    },
    {
      id: "5",
      name: "CCTV Installation",
      image: "/cardImage.png"
    },
    {
      id: "6",
      name: "Data Recovery",
      image: "/cardImage.png"
    },
    {
      id: "7",
      name: "Phone Repair",
      image: "/cardImage.png"
    },
    {
      id: "8",
      name: "Tablet Repair",
      image: "/cardImage.png"
    },
    {
      id: "9",
      name: "PC Repair",
      image: "/desktop.jpg"
    }
  ];

  const applianceServices: RepairService[] = [
    {
      id: "1",
      name: "TV Repair",
      image: "/cardImage.png"
    },
    {
      id: "2", 
      name: "AC Repair",
      image: "/cardImage.png"
    },
    {
      id: "3",
      name: "Fridge Repair",
      image: "/cardImage.png"
    },
    {
      id: "4",
      name: "Washing Machine Repair",
      image: "/cardImage.png"
    },
    {
      id: "5",
      name: "Electrician",
      image: "/cardImage.png"
    },
    {
      id: "6",
      name: "Plumber",
      image: "/cardImage.png"
    }
  ];

  const services = serviceType === "appliance" ? applianceServices : repairServices;
  const title = serviceType === "appliance" ? "Choose Your Appliance Service" : "Choose Your Repair Service";

  const handleServiceSelect = (service: RepairService) => {
    // Here you can add logic to handle service selection
    console.log("Selected service:", service);
    // You might want to navigate to a booking page or show more details
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-md mx-auto sm:max-w-lg md:max-w-2xl max-h-[66vh] overflow-y-auto rounded-xl flex flex-col">
        <DialogHeader className="relative flex-shrink-0">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center pr-8">
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6">
          {/* IT Needs Section */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-left mb-4">IT Needs</h2>
            <div className="grid grid-cols-3 gap-3">
              {repairServices.map((service) => (
                <Card 
                  key={service.id}
                  className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-2 hover:border-primary/20 rounded-xl overflow-hidden"
                  onClick={() => handleServiceSelect(service)}
                >
                  <CardContent className="p-2 text-center">
                    <div className="mb-1">
                      <img 
                        src={service.image} 
                        alt={service.name}
                        className="w-8 h-8 mx-auto rounded-lg object-contain"
                      />
                    </div>
                    <h3 className="font-semibold text-xs leading-tight">{service.name}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Home Appliance Section */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-left mb-4">Home Appliance</h2>
            <div className="grid grid-cols-3 gap-3">
              {applianceServices.map((service) => (
                <Card 
                  key={service.id}
                  className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-2 hover:border-primary/20 rounded-xl overflow-hidden"
                  onClick={() => handleServiceSelect(service)}
                >
                  <CardContent className="p-2 text-center">
                    <div className="mb-1">
                      <img 
                        src={service.image} 
                        alt={service.name}
                        className="w-8 h-8 mx-auto rounded-lg object-contain"
                      />
                    </div>
                    <h3 className="font-semibold text-xs leading-tight">{service.name}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto px-8"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RepairServicesModal;
