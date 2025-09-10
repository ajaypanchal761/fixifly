import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface RepairService {
  id: string;
  name: string;
 
}

const RepairServicesModal = ({ isOpen, onClose, serviceType = "repair" }: { isOpen: boolean; onClose: () => void; serviceType?: "repair" | "appliance" }) => {
  const repairServices: RepairService[] = [
    {
      id: "1",
      name: "Laptop Repair"
    },
    {
      id: "2", 
      name: "Desktop Repair"
    },
    {
      id: "3",
      name: "Mac Repair"
    },
    {
      id: "4",
      name: "Printer Repair"
    },
    {
      id: "5",
      name: "CCTV Installation"
    },
    {
      id: "6",
      name: "Data Recovery"
    },
    {
      id: "7",
      name: "Phone Repair"
    },
    {
      id: "8",
      name: "Tablet Repair"
    },
    {
      id: "9",
      name: "PC Repair"
    }
  ];

  const applianceServices: RepairService[] = [
    {
      id: "1",
      name: "TV Repair"
    },
    {
      id: "2", 
      name: "AC Repair"
    },
    {
      id: "3",
      name: "Fridge Repair"
    },
    {
      id: "4",
      name: "Washing Machine Repair"
    },
    {
      id: "5",
      name: "Electrician"
    },
    {
      id: "6",
      name: "Plumber"
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
      <DialogContent className="w-[95vw] max-w-md mx-auto sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl">
        <DialogHeader className="relative">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center pr-8">
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-3 gap-3 mt-8 sm:mt-4">
          {services.map((service) => (
            <Card 
              key={service.id}
              className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-2 hover:border-primary/20 rounded-xl overflow-hidden"
              onClick={() => handleServiceSelect(service)}
            >
              <CardContent className="p-2 text-center">
                <div className="mb-1">
                  <img 
                    src="/cardImage.png" 
                    alt={service.name}
                    className="w-8 h-8 mx-auto rounded-lg object-cover"
                  />
                </div>
                <h3 className="font-semibold text-xs leading-tight">{service.name}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-6 text-center">
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
