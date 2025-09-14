import VendorHeader from "../components/VendorHeader";
import VendorBottomNav from "../components/VendorBottomNav";
import Footer from "../../components/Footer";
import NotFound from "../../pages/NotFound";
import { useMediaQuery, useTheme } from "@mui/material";
import { Phone, Mail, HelpCircle } from "lucide-react";

const VendorSupport = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Show 404 error on desktop
  if (!isMobile) {
    return <NotFound />;
  }

  const supportOptions = [
    { 
      title: "Phone Support", 
      description: "Call us for immediate assistance", 
      icon: Phone, 
      action: "Call Now",
      color: "bg-green-500"
    },
    { 
      title: "Email Support", 
      description: "Send us your queries via email", 
      icon: Mail, 
      action: "Send Email",
      color: "bg-purple-500"
    },
  ];


  const recentTickets = [
    { id: "TKT001", subject: "Payment Issue", status: "Resolved", date: "2024-01-15" },
    { id: "TKT002", subject: "Order Management", status: "In Progress", date: "2024-01-14" },
    { id: "TKT003", subject: "Account Verification", status: "Resolved", date: "2024-01-13" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <VendorHeader />
      <main className="flex-1 pb-24 md:pb-0 pt-20 md:pt-0">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8 md:hidden text-center">FixFly <span className="text-3xl font-bold text-gradient mb-8 md:hidden text-center"> Support</span></h1>
          
          {/* Support Options */}
          <div className="grid grid-cols-1 gap-4 mb-8 md:hidden">
            {supportOptions.map((option, index) => {
              const IconComponent = option.icon;
              return (
                <div key={index} className="service-card">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${option.color} rounded-full flex items-center justify-center`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-1">{option.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{option.description}</p>
                      <button 
                        className="btn-tech text-sm px-4 py-2"
                        onClick={() => {
                          if (option.title === "Phone Support") {
                            window.open("tel:+919876543210", "_self");
                          } else if (option.title === "Email Support") {
                            window.open("mailto:support@fixifly.com?subject=Vendor Support Request", "_self");
                          }
                        }}
                      >
                        {option.action}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>


          {/* Recent Support Tickets */}
          <div className="service-card overflow-hidden md:hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Recent Support Tickets</h2>
            </div>
            <div className="divide-y divide-border">
              {recentTickets.map((ticket) => (
                <div key={ticket.id} className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{ticket.subject}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      ticket.status === 'Resolved' 
                        ? 'bg-accent/20 text-accent-foreground' 
                        : 'bg-primary/20 text-primary-foreground'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>#{ticket.id}</span>
                    <span>{ticket.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          <div className="card-gradient rounded-xl p-6 mt-8 md:hidden">
            <h2 className="text-xl font-semibold text-foreground mb-4">Contact Information</h2>
            <div className="space-y-3 text-sm">
              <div 
                className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                onClick={() => window.open("tel:+919876543210", "_self")}
              >
                <Phone className="w-4 h-4 text-primary" />
                <span className="text-foreground">+91 98765 43210</span>
              </div>
              <div 
                className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                onClick={() => window.open("mailto:support@fixifly.com?subject=Vendor Support Request", "_self")}
              >
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-foreground">support@fixifly.com</span>
              </div>
              <div className="flex items-center gap-3">
                <HelpCircle className="w-4 h-4 text-primary" />
                <span className="text-foreground">Available 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <div className="md:hidden">
        <Footer />
        <VendorBottomNav />
      </div>
    </div>
  );
};

export default VendorSupport;
