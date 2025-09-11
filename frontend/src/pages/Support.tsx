import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  MessageSquare, 
  Clock, 
  CheckCircle,
  Phone,
  Mail,
  MessageCircle,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Search,
  HelpCircle,
  FileText,
  Users,
  Headphones,
  Copy,
  ExternalLink
} from "lucide-react";

const Support = () => {
  const [activeTab, setActiveTab] = useState("new-ticket");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const openTickets = [
    {
      id: "TK001",
      subject: "MacBook Screen Flickering Issue",
      category: "Hardware",
      priority: "High", 
      status: "In Progress",
      created: "Dec 12, 2024",
      lastUpdate: "2 hours ago",
      responses: 3
    },
    {
      id: "TK002", 
      subject: "Software Installation Help",
      category: "Software",
      priority: "Medium",
      status: "Waiting for Response",
      created: "Dec 10, 2024", 
      lastUpdate: "1 day ago",
      responses: 1
    }
  ];

  const closedTickets = [
    {
      id: "TK003",
      subject: "Laptop Battery Replacement Query",
      category: "General",
      priority: "Low",
      status: "Resolved",
      created: "Dec 8, 2024",
      resolved: "Dec 9, 2024",
      responses: 5,
      rating: 5
    },
    {
      id: "TK004",
      subject: "Printer Connection Issues",
      category: "Technical",
      priority: "Medium", 
      status: "Resolved",
      created: "Dec 5, 2024",
      resolved: "Dec 6, 2024",
      responses: 2,
      rating: 4
    }
  ];

  const faqs = [
    {
      category: "General",
      questions: [
        {
          q: "What types of devices do you repair?",
          a: "We repair laptops, desktops, Mac computers, tablets, smartphones, printers, and other IT equipment. Our certified technicians handle all major brands including Apple, Dell, HP, Lenovo, and more."
        },
        {
          q: "How long does a typical repair take?",
          a: "Most repairs are completed within 24-48 hours. Complex issues may take 3-5 business days. We provide estimated completion times when you book your service and keep you updated throughout the process."
        },
        {
          q: "Do you provide warranties on repairs?",
          a: "Yes, all our repairs come with a comprehensive 1-year warranty covering parts and labor. AMC customers receive extended warranty coverage on all services."
        }
      ]
    },
    {
      category: "Booking & Pricing",
      questions: [
        {
          q: "How do I book a repair service?",
          a: "You can book online through our website, call our support line, or visit one of our service centers. Online booking is available 24/7 with instant confirmation and tracking."
        },
        {
          q: "What are your service charges?",
          a: "Our pricing varies by service type. Basic diagnostics start at $29, laptop repairs from $49, and desktop services from $39. We provide upfront pricing with no hidden costs."
        },
        {
          q: "Do you offer emergency or same-day service?",
          a: "Yes, we offer emergency repair services for critical business needs. Same-day service is available for an additional fee, subject to technician availability and service complexity."
        }
      ]
    },
    {
      category: "Technical Support",
      questions: [
        {
          q: "Can you help with data recovery?",
          a: "Yes, we offer comprehensive data recovery services for hard drives, SSDs, and other storage devices. Our success rate is over 95% with free evaluation and no-data-no-charge policy."
        },
        {
          q: "Do you provide remote support?",
          a: "AMC customers receive complimentary remote support for software issues, virus removal, and system optimization. One-time remote support is also available for $39."
        },
        {
          q: "What if my device can't be repaired?",
          a: "If your device is beyond economical repair, we'll provide a detailed assessment and recommend suitable replacement options. We also offer trade-in programs and data migration services."
        }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Waiting for Response":
        return "bg-yellow-100 text-yellow-800";
      case "Resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-orange-100 text-orange-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(faq => 
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  // Quick contact functionality
  const handlePhoneCall = () => {
    window.open('tel:+912269647030', '_self');
  };

  const handleEmailClick = () => {
    window.open('mailto:info@fixfly.in?subject=Support Request&body=Hello, I need help with...', '_blank');
  };

  const handleCopyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: `${type} copied successfully`,
        duration: 2000,
      });
    }).catch(() => {
      toast({
        title: "Copy failed",
        description: "Please copy manually",
        variant: "destructive",
        duration: 2000,
      });
    });
  };

  return (
    <div className="min-h-screen pt-16 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Support <span className="text-gradient">Center</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto hidden md:block">
            Get help with your repairs, ask questions, and find solutions to common issues.
            Our support team is here to assist you 24/7.
          </p>
        </div>
        {/* Quick Contact Options */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Need Immediate Help?</h2>
            <p className="text-muted-foreground">Get in touch with our support team</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-6">
            <Card className="service-card text-center border-0 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <CardContent className="pt-4 md:pt-6 px-3 md:px-6" onClick={handlePhoneCall}>
                <div className="bg-gradient-tech p-3 md:p-4 rounded-xl md:rounded-2xl w-fit mx-auto mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Phone className="h-5 w-5 md:h-8 md:w-8 text-white" />
                </div>
                <h3 className="text-sm md:text-lg font-semibold mb-2 md:mb-3">Phone Support</h3>
                <p className="text-muted-foreground text-xs md:text-sm mb-3 md:mb-4 hidden md:block">
                  Speak directly with our experts
                </p>
                <div className="flex items-center justify-center gap-2 mb-1 md:mb-2">
                  <p className="font-semibold text-primary text-sm md:text-base">022-6964-7030</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyToClipboard('022-6964-7030', 'Phone number');
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground hidden md:block">24/7 Available</p>
                <div className="mt-2">
                  <Button 
                    size="sm" 
                    className="bg-primary hover:bg-primary/90 text-white text-xs px-3 py-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePhoneCall();
                    }}
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    Call Now
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="service-card text-center border-0 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <CardContent className="pt-4 md:pt-6 px-3 md:px-6" onClick={handleEmailClick}>
                <div className="bg-gradient-tech p-3 md:p-4 rounded-xl md:rounded-2xl w-fit mx-auto mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Mail className="h-5 w-5 md:h-8 md:w-8 text-white" />
                </div>
                <h3 className="text-sm md:text-lg font-semibold mb-2 md:mb-3">Email Support</h3>
                <p className="text-muted-foreground text-xs md:text-sm mb-3 md:mb-4 hidden md:block">
                  Send us detailed questions
                </p>
                <div className="flex items-center justify-center gap-2 mb-1 md:mb-2">
                  <p className="font-semibold text-primary text-sm md:text-base">info@fixfly.in</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyToClipboard('info@fixfly.in', 'Email address');
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground hidden md:block">Response within 2 hours</p>
                <div className="mt-2">
                  <Button 
                    size="sm" 
                    className="bg-primary hover:bg-primary/90 text-white text-xs px-3 py-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEmailClick();
                    }}
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    Send Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;