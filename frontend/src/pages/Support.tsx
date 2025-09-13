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
  const [supportType, setSupportType] = useState("");
  const [caseId, setCaseId] = useState("");
  const [showCaseIdField, setShowCaseIdField] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    category: "",
    priority: "",
    description: ""
  });
  const [userTickets, setUserTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [showAddResponse, setShowAddResponse] = useState(false);
  const [responseText, setResponseText] = useState("");
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
      case "Submitted":
        return "bg-blue-100 text-blue-800";
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

  // Handle support type change
  const handleSupportTypeChange = (value: string) => {
    setSupportType(value);
    setShowCaseIdField(value === "service" || value === "product");
    setCaseId("");
  };

  // Handle form submission
  const handleSubmitTicket = () => {
    if (!supportType || !ticketForm.subject || !ticketForm.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if ((supportType === "service" || supportType === "product") && !caseId) {
      toast({
        title: "Case ID Required",
        description: "Please enter your Case ID",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Generate ticket ID
    const ticketId = `TK${Date.now().toString().slice(-6)}`;
    
    // Create new ticket object
    const newTicket = {
      id: ticketId,
      subject: ticketForm.subject,
      type: supportType === "service" ? "Service Warranty Claim" : supportType === "product" ? "Product Warranty Claim" : supportType === "amc" ? "AMC Claim" : "Others",
      caseId: caseId || null,
      description: ticketForm.description,
      status: "Submitted",
      priority: "Medium",
      created: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      lastUpdate: "Just now",
      responses: 0
    };
    
    // Add ticket to user tickets
    setUserTickets(prev => [newTicket, ...prev]);
    
    // Send WhatsApp message
    const whatsappMessage = `Support Ticket Created
Ticket ID: ${ticketId}
Type: ${newTicket.type}
Subject: ${ticketForm.subject}
Description: ${ticketForm.description}
${caseId ? `Case ID: ${caseId}` : ""}

Our team will contact you within 12-48 hours.`;
    
    const whatsappUrl = `https://wa.me/912269647030?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');

    // Show thank you message
    setShowThankYou(true);
    
    // Reset form
    setSupportType("");
    setCaseId("");
    setShowCaseIdField(false);
    setTicketForm({
      subject: "",
      category: "",
      priority: "",
      description: ""
    });

    toast({
      title: "Ticket Created Successfully",
      description: `Your ticket ${ticketId} has been submitted`,
      duration: 3000,
    });
  };

  // Handle view ticket details
  const handleViewDetails = (ticket) => {
    setSelectedTicket(ticket);
    setShowTicketDetails(true);
  };

  // Handle add response
  const handleAddResponse = (ticket) => {
    setSelectedTicket(ticket);
    setShowAddResponse(true);
    setResponseText("");
  };

  // Submit response
  const handleSubmitResponse = () => {
    if (!responseText.trim()) {
      toast({
        title: "Response Required",
        description: "Please enter your response",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Update ticket with new response
    setUserTickets(prev => prev.map(ticket => 
      ticket.id === selectedTicket.id 
        ? {
            ...ticket,
            responses: ticket.responses + 1,
            lastUpdate: "Just now"
          }
        : ticket
    ));

    // Send WhatsApp message with response
    const whatsappMessage = `Response to Ticket ${selectedTicket.id}
Subject: ${selectedTicket.subject}

My Response:
${responseText}

Please update the ticket status accordingly.`;
    
    const whatsappUrl = `https://wa.me/912269647030?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');

    // Close modal and show success
    setShowAddResponse(false);
    setResponseText("");
    setSelectedTicket(null);

    toast({
      title: "Response Submitted",
      description: "Your response has been sent to our support team",
      duration: 3000,
    });
  };

  // Close modals
  const handleCloseDetails = () => {
    setShowTicketDetails(false);
    setSelectedTicket(null);
  };

  const handleCloseResponse = () => {
    setShowAddResponse(false);
    setResponseText("");
    setSelectedTicket(null);
  };

  return (
    <div className="min-h-screen pt-16 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
            Support <span className="text-gradient">Center</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Get help with your FixFly repairs, ask questions.
            Our support team is here to assist you 24/7.
          </p>
        </div>


        {/* Support Tabs */}
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 md:mb-8 h-auto">
              <TabsTrigger value="new-ticket" className="flex flex-col items-center gap-1 py-3 px-2 text-xs sm:text-sm">
                <Plus className="h-4 w-4" />
                <span>New Ticket</span>
              </TabsTrigger>
              <TabsTrigger value="my-tickets" className="flex flex-col items-center gap-1 py-3 px-2 text-xs sm:text-sm">
                <MessageSquare className="h-4 w-4" />
                <span>My Tickets</span>
              </TabsTrigger>
              <TabsTrigger value="faq" className="flex flex-col items-center gap-1 py-3 px-2 text-xs sm:text-sm">
                <HelpCircle className="h-4 w-4" />
                <span>FAQ</span>
              </TabsTrigger>
            </TabsList>

            {/* New Ticket Tab */}
            <TabsContent value="new-ticket" className="space-y-4 md:space-y-6">
              {!showThankYou ? (
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                      <FileText className="h-4 w-4 md:h-5 md:w-5" />
                      Create New Support Ticket
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Select the type of support you need and our team will contact you within 12-48 hours.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 md:space-y-6">
                    {/* Support Type Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Type of Support *</label>
                      <Select value={supportType} onValueChange={handleSupportTypeChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose support type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="service">Service Warranty Claim</SelectItem>
                          <SelectItem value="product">Product Warranty Claim</SelectItem>
                          <SelectItem value="amc">AMC Claim</SelectItem>
                          <SelectItem value="others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Case ID Field - Only for Service and Product */}
                    {showCaseIdField && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Case ID *</label>
                        <Input 
                          placeholder="Enter your Case ID" 
                          className="w-full"
                          value={caseId}
                          onChange={(e) => setCaseId(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Please enter the Case ID from your previous service or product purchase.
                        </p>
                      </div>
                    )}

                    {/* Subject */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Subject *</label>
                      <Input 
                        placeholder="Brief description of your issue" 
                        className="w-full"
                        value={ticketForm.subject}
                        onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Issue Description *</label>
                      <Textarea 
                        placeholder="Please provide detailed information about your issue, including steps to reproduce, error messages, and any relevant details..."
                        className="min-h-[100px] md:min-h-[120px] w-full"
                        value={ticketForm.description}
                        onChange={(e) => setTicketForm({...ticketForm, description: e.target.value})}
                      />
                    </div>

                    <div className="flex justify-center md:justify-end">
                      <Button 
                        className="bg-primary hover:bg-primary/90 w-full md:w-auto"
                        onClick={handleSubmitTicket}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Submit Ticket
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* Thank You Message */
                <Card>
                  <CardContent className="pt-8 pb-8">
                    <div className="text-center space-y-6">
                      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl md:text-2xl font-semibold">Thank You!</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                          Your support ticket has been submitted successfully. Our team will contact you within 12-48 hours.
                        </p>
                      </div>
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          A WhatsApp message has been sent to our support team with your ticket details.
                        </p>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowThankYou(false)}
                          className="w-full md:w-auto"
                        >
                          Create Another Ticket
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* My Tickets Tab */}
            <TabsContent value="my-tickets" className="space-y-4 md:space-y-6">
              {/* User's Tickets */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Clock className="h-4 w-4 md:h-5 md:w-5" />
                    My Tickets ({userTickets.length})
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Your submitted support tickets and their status.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userTickets.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Tickets Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        You haven't submitted any support tickets yet.
                      </p>
                      <Button 
                        onClick={() => setActiveTab("new-ticket")}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Ticket
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 md:space-y-4">
                      {userTickets.map((ticket) => (
                        <div key={ticket.id} className="border rounded-lg p-3 md:p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex flex-col gap-3 md:gap-4">
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                <h3 className="font-semibold text-sm md:text-base">{ticket.subject}</h3>
                                <div className="flex flex-wrap gap-1">
                                  <Badge className={`${getStatusColor(ticket.status)} text-xs`}>
                                    {ticket.status}
                                  </Badge>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs md:text-sm text-muted-foreground">
                                <span>ID: {ticket.id}</span>
                                <span>Type: {ticket.type}</span>
                                {ticket.caseId && <span>Case ID: {ticket.caseId}</span>}
                                <span>Created: {ticket.created}</span>
                                <span>Last Update: {ticket.lastUpdate}</span>
                              </div>
                            </div>
                            <div className="flex justify-center md:justify-start">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full sm:w-auto"
                                onClick={() => handleViewDetails(ticket)}
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </TabsContent>

            {/* FAQ Tab */}
            <TabsContent value="faq" className="space-y-4 md:space-y-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <HelpCircle className="h-4 w-4 md:h-5 md:w-5" />
                    Frequently Asked Questions
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Find quick answers to common questions about our services.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 md:mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search FAQs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 md:space-y-6">
                    {filteredFaqs.map((category, index) => (
                      <div key={index}>
                        <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
                          <Users className="h-4 w-4 md:h-5 md:w-5" />
                          {category.category}
                        </h3>
                        <Accordion type="single" collapsible className="space-y-2">
                          {category.questions.map((faq, faqIndex) => (
                            <AccordionItem key={faqIndex} value={`${index}-${faqIndex}`} className="border rounded-lg px-3 md:px-4">
                              <AccordionTrigger className="text-left hover:no-underline py-3">
                                <span className="font-medium text-sm md:text-base">{faq.q}</span>
                              </AccordionTrigger>
                              <AccordionContent className="text-muted-foreground pb-3 md:pb-4 text-sm md:text-base">
                                {faq.a}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    ))}
                  </div>

                  {filteredFaqs.length === 0 && searchQuery && (
                    <div className="text-center py-6 md:py-8">
                      <HelpCircle className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3 md:mb-4" />
                      <p className="text-muted-foreground text-sm md:text-base">No FAQs found matching your search.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>


        {/* Quick Contact Options */}
        <div className="max-w-2xl mx-auto mt-8 md:mt-12">
          <div className="text-center mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-bold mb-1">Need Immediate Help?</h2>
            <p className="text-xs md:text-sm text-muted-foreground">Get in touch with our support team</p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="text-center cursor-pointer group" onClick={handlePhoneCall}>
              <div className="bg-gradient-tech p-2 md:p-3 rounded-lg w-fit mx-auto mb-2 md:mb-3 group-hover:scale-105 transition-transform duration-300">
                <Phone className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
              <h3 className="text-sm md:text-base font-semibold mb-1 md:mb-2">Phone</h3>
              <div className="hidden md:flex items-center justify-center gap-1 mb-1">
                <p className="font-semibold text-primary text-xs md:text-sm">022-6964-7030</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-primary/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyToClipboard('022-6964-7030', 'Phone number');
                  }}
                >
                  <Copy className="h-2 w-2" />
                </Button>
              </div>
              <p className="hidden md:block text-xs text-muted-foreground mb-2">24/7 Available</p>
              <Button 
                size="sm" 
                className="hidden md:flex bg-primary hover:bg-primary/90 text-white text-xs px-2 py-1 w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePhoneCall();
                }}
              >
                <Phone className="h-3 w-3 mr-1" />
                Call
              </Button>
            </div>

            <div className="text-center cursor-pointer group" onClick={handleEmailClick}>
              <div className="bg-gradient-tech p-2 md:p-3 rounded-lg w-fit mx-auto mb-2 md:mb-3 group-hover:scale-105 transition-transform duration-300">
                <Mail className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
              <h3 className="text-sm md:text-base font-semibold mb-1 md:mb-2">Email</h3>
              <div className="hidden md:flex items-center justify-center gap-1 mb-1">
                <p className="font-semibold text-primary text-xs md:text-sm">info@fixfly.in</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-primary/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyToClipboard('info@fixfly.in', 'Email address');
                  }}
                >
                  <Copy className="h-2 w-2" />
                </Button>
              </div>
              <p className="hidden md:block text-xs text-muted-foreground mb-2">Response within 2 hours</p>
              <Button 
                size="sm" 
                className="hidden md:flex bg-primary hover:bg-primary/90 text-white text-xs px-2 py-1 w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEmailClick();
                }}
              >
                <Mail className="h-3 w-3 mr-1" />
                Email
              </Button>
            </div>
          </div>
        </div>

        {/* Ticket Details Modal */}
        {showTicketDetails && selectedTicket && (
          <div className="fixed inset-0 bg-black/50 flex items-end md:items-end md:justify-center z-50 p-0 md:p-4 md:pb-16">
            <Card className="w-full h-[85vh] md:max-w-2xl md:h-auto md:max-h-[70vh] flex flex-col rounded-t-xl md:rounded-xl">
              <CardHeader className="pb-3 md:pb-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <FileText className="h-4 w-4 md:h-5 md:w-5" />
                    Ticket Details
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={handleCloseDetails} className="text-lg">
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="text-xs md:text-sm font-medium text-muted-foreground">Ticket ID</label>
                    <p className="font-semibold text-sm md:text-base">{selectedTicket.id}</p>
                  </div>
                  <div>
                    <label className="text-xs md:text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge className={`${getStatusColor(selectedTicket.status)} text-xs`}>
                        {selectedTicket.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs md:text-sm font-medium text-muted-foreground">Type</label>
                    <p className="font-medium text-sm md:text-base">{selectedTicket.type}</p>
                  </div>
                  {selectedTicket.caseId && (
                    <div>
                      <label className="text-xs md:text-sm font-medium text-muted-foreground">Case ID</label>
                      <p className="font-medium text-sm md:text-base">{selectedTicket.caseId}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs md:text-sm font-medium text-muted-foreground">Created</label>
                    <p className="font-medium text-sm md:text-base">{selectedTicket.created}</p>
                  </div>
                  <div>
                    <label className="text-xs md:text-sm font-medium text-muted-foreground">Last Update</label>
                    <p className="font-medium text-sm md:text-base">{selectedTicket.lastUpdate}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs md:text-sm font-medium text-muted-foreground">Subject</label>
                  <p className="font-semibold mt-1 text-sm md:text-base">{selectedTicket.subject}</p>
                </div>
                
                <div>
                  <label className="text-xs md:text-sm font-medium text-muted-foreground">Description</label>
                  <p className="mt-1 text-xs md:text-sm leading-relaxed">{selectedTicket.description}</p>
                </div>
                
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Response Modal */}
        {showAddResponse && selectedTicket && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="h-5 w-5" />
                    Add Response
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={handleCloseResponse}>
                    ✕
                  </Button>
                </div>
                <CardDescription className="text-sm">
                  Add a response to ticket {selectedTicket.id}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Your Response *</label>
                  <Textarea 
                    placeholder="Type your response here..."
                    className="min-h-[120px] w-full mt-2"
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleCloseResponse}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmitResponse}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Response
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Support;