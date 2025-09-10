import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
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
  Headphones
} from "lucide-react";

const Support = () => {
  const [activeTab, setActiveTab] = useState("new-ticket");
  const [searchQuery, setSearchQuery] = useState("");

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

  return (
    <div className="min-h-screen pt-16 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-12 animate-slide-up">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Support <span className="text-gradient">Center</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get help with your repairs, ask questions, and find solutions to common issues.
            Our support team is here to assist you 24/7.
          </p>
        </div>

        {/* Quick Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-fade-in-delay">
          <Card className="service-card text-center">
            <CardContent className="pt-6">
              <div className="bg-gradient-tech p-4 rounded-2xl w-fit mx-auto mb-4">
                <Phone className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Phone Support</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Speak directly with our experts
              </p>
              <p className="font-semibold text-primary mb-2">+1 (555) 123-4567</p>
              <p className="text-xs text-muted-foreground">24/7 Available</p>
            </CardContent>
          </Card>

          <Card className="service-card text-center">
            <CardContent className="pt-6">
              <div className="bg-gradient-tech p-4 rounded-2xl w-fit mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Live Chat</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Instant chat with support agents
              </p>
              <Button className="btn-tech text-white">
                Start Chat
              </Button>
            </CardContent>
          </Card>

          <Card className="service-card text-center">
            <CardContent className="pt-6">
              <div className="bg-gradient-tech p-4 rounded-2xl w-fit mx-auto mb-4">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Email Support</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Send us detailed questions
              </p>
              <p className="font-semibold text-primary mb-2">support@fixifly.com</p>
              <p className="text-xs text-muted-foreground">Response within 2 hours</p>
            </CardContent>
          </Card>
        </div>

        {/* Support Tabs */}
        <div className="max-w-6xl mx-auto animate-slide-up">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="new-ticket" className="text-lg py-3">
                <Plus className="h-4 w-4 mr-2" />
                New Ticket
              </TabsTrigger>
              <TabsTrigger value="my-tickets" className="text-lg py-3">
                <MessageSquare className="h-4 w-4 mr-2" />
                My Tickets
              </TabsTrigger>
              <TabsTrigger value="faqs" className="text-lg py-3">
                <HelpCircle className="h-4 w-4 mr-2" />
                FAQs
              </TabsTrigger>
            </TabsList>

            {/* New Ticket */}
            <TabsContent value="new-ticket">
              <Card className="service-card">
                <CardHeader>
                  <CardTitle className="text-2xl">Create Support Ticket</CardTitle>
                  <CardDescription>
                    Describe your issue and we'll get back to you as soon as possible
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Subject</label>
                      <Input placeholder="Brief description of your issue" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hardware">Hardware Issue</SelectItem>
                          <SelectItem value="software">Software Problem</SelectItem>
                          <SelectItem value="technical">Technical Support</SelectItem>
                          <SelectItem value="billing">Billing Question</SelectItem>
                          <SelectItem value="general">General Inquiry</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Priority</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Device Type</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select device" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="laptop">Laptop</SelectItem>
                          <SelectItem value="desktop">Desktop</SelectItem>
                          <SelectItem value="mac">Mac</SelectItem>
                          <SelectItem value="printer">Printer</SelectItem>
                          <SelectItem value="phone">Phone/Tablet</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea 
                      placeholder="Please provide detailed information about your issue, including any error messages, when it started, and what you were doing when it occurred..."
                      rows={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Attachments (Optional)</label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Drag and drop files here or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supported: JPG, PNG, PDF, DOC (Max 10MB each)
                      </p>
                    </div>
                  </div>

                  <Button className="btn-tech text-white w-full py-6 text-lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Submit Ticket
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* My Tickets */}
            <TabsContent value="my-tickets" className="space-y-6">
              {/* Open Tickets */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Open Tickets ({openTickets.length})</h3>
                <div className="space-y-4">
                  {openTickets.map((ticket) => (
                    <Card key={ticket.id} className="service-card">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-lg mb-1">{ticket.subject}</h4>
                            <p className="text-sm text-muted-foreground">Ticket #{ticket.id}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Badge className={getStatusColor(ticket.status)}>
                              {ticket.status}
                            </Badge>
                            <Badge className={getPriorityColor(ticket.priority)}>
                              {ticket.priority}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
                          <div>
                            <span className="font-medium">Category:</span> {ticket.category}
                          </div>
                          <div>
                            <span className="font-medium">Created:</span> {ticket.created}
                          </div>
                          <div>
                            <span className="font-medium">Last Update:</span> {ticket.lastUpdate}
                          </div>
                          <div>
                            <span className="font-medium">Responses:</span> {ticket.responses}
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button variant="outline" className="flex-1">
                            View Details
                          </Button>
                          <Button className="flex-1 btn-tech text-white">
                            Add Response
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Closed Tickets */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Closed Tickets ({closedTickets.length})</h3>
                <div className="space-y-4">
                  {closedTickets.map((ticket) => (
                    <Card key={ticket.id} className="service-card opacity-75">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-lg mb-1">{ticket.subject}</h4>
                            <p className="text-sm text-muted-foreground">Ticket #{ticket.id}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Badge className={getStatusColor(ticket.status)}>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {ticket.status}
                            </Badge>
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`h-3 w-3 rounded-full ${
                                    i < ticket.rating ? "bg-yellow-400" : "bg-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
                          <div>
                            <span className="font-medium">Category:</span> {ticket.category}
                          </div>
                          <div>
                            <span className="font-medium">Created:</span> {ticket.created}
                          </div>
                          <div>
                            <span className="font-medium">Resolved:</span> {ticket.resolved}
                          </div>
                          <div>
                            <span className="font-medium">Responses:</span> {ticket.responses}
                          </div>
                        </div>

                        <Button variant="outline" className="w-full">
                          View Conversation
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* FAQs */}
            <TabsContent value="faqs">
              <div className="space-y-6">
                {/* Search Bar */}
                <Card className="service-card">
                  <CardContent className="pt-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search FAQs..."
                        className="pl-10 py-6 text-lg"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* FAQ Categories */}
                {filteredFaqs.map((category) => (
                  <Card key={category.category} className="service-card">
                    <CardHeader>
                      <CardTitle className="text-xl">{category.category}</CardTitle>
                      <CardDescription>
                        {category.questions.length} questions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {category.questions.map((faq, index) => (
                          <AccordionItem key={index} value={`${category.category}-${index}`}>
                            <AccordionTrigger className="text-left">
                              {faq.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                              {faq.a}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                ))}

                {/* No Results */}
                {filteredFaqs.length === 0 && searchQuery && (
                  <Card className="service-card">
                    <CardContent className="pt-6 text-center">
                      <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No results found</h3>
                      <p className="text-muted-foreground mb-4">
                        We couldn't find any FAQs matching "{searchQuery}"
                      </p>
                      <Button className="btn-tech text-white">
                        Create Support Ticket
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Social Media */}
        <div className="text-center mt-16 animate-fade-in-delay">
          <Card className="service-card max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Follow Us</CardTitle>
              <CardDescription>
                Stay connected for tips, updates, and tech insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center space-x-4">
                {[
                  { icon: Facebook, href: "#", label: "Facebook" },
                  { icon: Twitter, href: "#", label: "Twitter" }, 
                  { icon: Instagram, href: "#", label: "Instagram" },
                  { icon: Linkedin, href: "#", label: "LinkedIn" }
                ].map((social) => {
                  const IconComponent = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      className="bg-primary p-3 rounded-xl text-primary-foreground hover:bg-primary-dark transition-colors duration-300"
                      aria-label={social.label}
                    >
                      <IconComponent className="h-6 w-6" />
                    </a>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Support;