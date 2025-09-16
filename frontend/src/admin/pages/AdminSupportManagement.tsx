import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '../components/AdminHeader';
import { 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Search, 
  Filter,
  Clock,
  CheckCircle,
  Phone,
  Mail,
  MessageCircle,
  HelpCircle,
  FileText,
  Users,
  Headphones,
  Copy,
  ExternalLink,
  AlertTriangle,
  Star,
  User,
  Calendar,
  Tag,
  Send,
  Reply,
  Archive,
  Flag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const AdminSupportManagement = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isViewTicketOpen, setIsViewTicketOpen] = useState(false);
  const [isReplyTicketOpen, setIsReplyTicketOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [isAddFaqOpen, setIsAddFaqOpen] = useState(false);
  const [isEditFaqOpen, setIsEditFaqOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<any>(null);

  // Sample support tickets data
  const [supportTickets, setSupportTickets] = useState([
    {
      id: 'TK001',
      subject: 'MacBook Screen Flickering Issue',
      category: 'Hardware',
      priority: 'High',
      status: 'In Progress',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '+91 98765 43210',
      caseId: 'CASE001',
      description: 'My MacBook Pro screen keeps flickering randomly. It started happening after the latest macOS update. The issue occurs both on battery and when plugged in.',
      created: '2024-12-12',
      lastUpdate: '2 hours ago',
      responses: 3,
      assignedTo: 'Tech Support Team',
      estimatedResolution: '2024-12-15',
      tags: ['Hardware', 'MacBook', 'Screen Issue']
    },
    {
      id: 'TK002',
      subject: 'Software Installation Help',
      category: 'Software',
      priority: 'Medium',
      status: 'Waiting for Response',
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      customerPhone: '+91 98765 43211',
      caseId: null,
      description: 'I need help installing Adobe Creative Suite on my Windows laptop. The installation keeps failing with error code 1603.',
      created: '2024-12-10',
      lastUpdate: '1 day ago',
      responses: 1,
      assignedTo: 'Software Support',
      estimatedResolution: '2024-12-13',
      tags: ['Software', 'Installation', 'Adobe']
    },
    {
      id: 'TK003',
      subject: 'Laptop Battery Replacement Query',
      category: 'General',
      priority: 'Low',
      status: 'Resolved',
      customerName: 'Mike Johnson',
      customerEmail: 'mike@example.com',
      customerPhone: '+91 98765 43212',
      caseId: 'CASE002',
      description: 'My laptop battery is not holding charge. How much would it cost to replace it?',
      created: '2024-12-08',
      lastUpdate: 'Dec 9, 2024',
      responses: 5,
      assignedTo: 'General Support',
      estimatedResolution: '2024-12-09',
      tags: ['Battery', 'Replacement', 'Pricing'],
      rating: 5,
      resolution: 'Customer was provided with battery replacement options and pricing. Battery replaced successfully.'
    },
    {
      id: 'TK004',
      subject: 'Printer Connection Issues',
      category: 'Technical',
      priority: 'Medium',
      status: 'Resolved',
      customerName: 'Sarah Wilson',
      customerEmail: 'sarah@example.com',
      customerPhone: '+91 98765 43213',
      caseId: null,
      description: 'My HP printer is not connecting to my computer via WiFi. It was working fine until yesterday.',
      created: '2024-12-05',
      lastUpdate: 'Dec 6, 2024',
      responses: 2,
      assignedTo: 'Technical Support',
      estimatedResolution: '2024-12-06',
      tags: ['Printer', 'WiFi', 'Connection'],
      rating: 4,
      resolution: 'Network settings were reset and printer reconnected successfully.'
    }
  ]);

  // Sample FAQ data
  const [faqs, setFaqs] = useState([
    {
      id: 'FAQ001',
      category: 'General',
      question: 'What types of devices do you repair?',
      answer: 'We repair laptops, desktops, Mac computers, tablets, smartphones, printers, and other IT equipment. Our certified technicians handle all major brands including Apple, Dell, HP, Lenovo, and more.',
      status: 'active',
      created: '2024-01-15',
      lastModified: '2024-11-20'
    },
    {
      id: 'FAQ002',
      category: 'General',
      question: 'How long does a typical repair take?',
      answer: 'Most repairs are completed within 24-48 hours. Complex issues may take 3-5 business days. We provide estimated completion times when you book your service and keep you updated throughout the process.',
      status: 'active',
      created: '2024-01-15',
      lastModified: '2024-11-20'
    },
    {
      id: 'FAQ003',
      category: 'Booking & Pricing',
      question: 'How do I book a repair service?',
      answer: 'You can book online through our website, call our support line, or visit one of our service centers. Online booking is available 24/7 with instant confirmation and tracking.',
      status: 'active',
      created: '2024-01-15',
      lastModified: '2024-11-20'
    },
    {
      id: 'FAQ004',
      category: 'Technical Support',
      question: 'Can you help with data recovery?',
      answer: 'Yes, we offer comprehensive data recovery services for hard drives, SSDs, and other storage devices. Our success rate is over 95% with free evaluation and no-data-no-charge policy.',
      status: 'active',
      created: '2024-01-15',
      lastModified: '2024-11-20'
    }
  ]);

  const [newFaq, setNewFaq] = useState({
    category: '',
    question: '',
    answer: '',
    status: 'active'
  });

  const filteredTickets = supportTickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesPriority = priorityFilter === 'all' || ticket.priority.toLowerCase() === priorityFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Submitted':
        return 'bg-blue-100 text-blue-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Waiting for Response':
        return 'bg-yellow-100 text-yellow-800';
      case 'Resolved':
        return 'bg-green-100 text-green-800';
      case 'Closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-orange-100 text-orange-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setIsViewTicketOpen(true);
  };

  const handleReplyTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setIsReplyTicketOpen(true);
    setReplyText('');
  };

  const handleSubmitReply = () => {
    if (!replyText.trim()) return;

    // Update ticket with new response
    setSupportTickets(prev => prev.map(ticket => 
      ticket.id === selectedTicket.id 
        ? {
            ...ticket,
            responses: ticket.responses + 1,
            lastUpdate: 'Just now',
            status: 'In Progress'
          }
        : ticket
    ));

    setIsReplyTicketOpen(false);
    setReplyText('');
    setSelectedTicket(null);
  };

  const handleTicketStatusChange = (ticketId: string, newStatus: string) => {
    setSupportTickets(prev => prev.map(ticket => 
      ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
    ));
  };

  const handleTicketPriorityChange = (ticketId: string, newPriority: string) => {
    setSupportTickets(prev => prev.map(ticket => 
      ticket.id === ticketId ? { ...ticket, priority: newPriority } : ticket
    ));
  };

  const handleAddFaq = () => {
    if (newFaq.category && newFaq.question && newFaq.answer) {
      const faq = {
        id: `FAQ${String(faqs.length + 1).padStart(3, '0')}`,
        category: newFaq.category,
        question: newFaq.question,
        answer: newFaq.answer,
        status: newFaq.status,
        created: new Date().toISOString().split('T')[0],
        lastModified: new Date().toISOString().split('T')[0]
      };
      
      setFaqs(prev => [...prev, faq]);
      setNewFaq({
        category: '',
        question: '',
        answer: '',
        status: 'active'
      });
      setIsAddFaqOpen(false);
    }
  };

  const handleEditFaq = (faq: any) => {
    setEditingFaq(faq);
    setNewFaq({
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
      status: faq.status
    });
    setIsEditFaqOpen(true);
  };

  const handleUpdateFaq = () => {
    if (editingFaq && newFaq.category && newFaq.question && newFaq.answer) {
      setFaqs(prev => prev.map(faq => 
        faq.id === editingFaq.id 
          ? {
              ...faq,
              category: newFaq.category,
              question: newFaq.question,
              answer: newFaq.answer,
              status: newFaq.status,
              lastModified: new Date().toISOString().split('T')[0]
            }
          : faq
      ));
      setIsEditFaqOpen(false);
      setEditingFaq(null);
    }
  };

  const handleDeleteFaq = (faqId: string) => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      setFaqs(prev => prev.filter(faq => faq.id !== faqId));
    }
  };

  // Calculate stats
  const totalTickets = supportTickets.length;
  const openTickets = supportTickets.filter(ticket => ticket.status !== 'Resolved' && ticket.status !== 'Closed').length;
  const resolvedTickets = supportTickets.filter(ticket => ticket.status === 'Resolved').length;
  const avgResponseTime = '2.5 hours'; // Mock data

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <main className="ml-72 pt-32 p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                Support <span className="text-gradient">Management</span>
              </h1>
              <p className="text-muted-foreground">Manage support tickets and FAQ content</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
                  <p className="text-2xl font-bold">{totalTickets}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Open Tickets</p>
                  <p className="text-2xl font-bold">{openTickets}</p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                  <p className="text-2xl font-bold">{resolvedTickets}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                  <p className="text-2xl font-bold">{avgResponseTime}</p>
                </div>
                <Headphones className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tickets" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
            <TabsTrigger value="faq">FAQ Management</TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-6">
            {/* Filters and Search */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search tickets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="in progress">In Progress</SelectItem>
                      <SelectItem value="waiting for response">Waiting for Response</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tickets Table */}
            <Card>
              <CardHeader>
                <CardTitle>Support Tickets ({filteredTickets.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Update</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{ticket.id}</p>
                            {ticket.caseId && (
                              <p className="text-xs text-muted-foreground">Case: {ticket.caseId}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{ticket.customerName}</p>
                            <p className="text-sm text-muted-foreground">{ticket.customerEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="font-medium truncate">{ticket.subject}</p>
                            <p className="text-xs text-muted-foreground">{ticket.category}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={ticket.status}
                            onValueChange={(value) => handleTicketStatusChange(ticket.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Submitted">Submitted</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Waiting for Response">Waiting for Response</SelectItem>
                              <SelectItem value="Resolved">Resolved</SelectItem>
                              <SelectItem value="Closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={ticket.priority}
                            onValueChange={(value) => handleTicketPriorityChange(ticket.id, value)}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="High">High</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="Low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {new Date(ticket.created).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{ticket.lastUpdate}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewTicket(ticket)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleReplyTicket(ticket)}
                            >
                              <Reply className="w-3 h-3 mr-1" />
                              Reply
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faq" className="space-y-6">
            {/* FAQ Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>FAQ Management ({filteredFaqs.length})</CardTitle>
                  <Dialog open={isAddFaqOpen} onOpenChange={setIsAddFaqOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary hover:bg-primary/90">
                        <Plus className="w-4 h-4 mr-2" />
                        Add FAQ
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add New FAQ</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="faqCategory">Category</Label>
                          <Select value={newFaq.category} onValueChange={(value) => setNewFaq(prev => ({ ...prev, category: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="General">General</SelectItem>
                              <SelectItem value="Booking & Pricing">Booking & Pricing</SelectItem>
                              <SelectItem value="Technical Support">Technical Support</SelectItem>
                              <SelectItem value="AMC">AMC</SelectItem>
                              <SelectItem value="Warranty">Warranty</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="faqQuestion">Question</Label>
                          <Input
                            id="faqQuestion"
                            value={newFaq.question}
                            onChange={(e) => setNewFaq(prev => ({ ...prev, question: e.target.value }))}
                            placeholder="Enter question"
                          />
                        </div>
                        <div>
                          <Label htmlFor="faqAnswer">Answer</Label>
                          <Textarea
                            id="faqAnswer"
                            value={newFaq.answer}
                            onChange={(e) => setNewFaq(prev => ({ ...prev, answer: e.target.value }))}
                            placeholder="Enter answer"
                            rows={4}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="faqStatus"
                            checked={newFaq.status === 'active'}
                            onCheckedChange={(checked) => setNewFaq(prev => ({ ...prev, status: checked ? 'active' : 'inactive' }))}
                          />
                          <Label htmlFor="faqStatus">Active</Label>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleAddFaq} className="flex-1">
                            Add FAQ
                          </Button>
                          <Button variant="outline" onClick={() => setIsAddFaqOpen(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredFaqs.map((faq) => (
                    <Card key={faq.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{faq.category}</Badge>
                              <Badge variant={faq.status === 'active' ? 'default' : 'secondary'}>
                                {faq.status}
                              </Badge>
                            </div>
                            <h3 className="font-semibold mb-2">{faq.question}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{faq.answer}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Created: {new Date(faq.created).toLocaleDateString()}</span>
                              <span>Modified: {new Date(faq.lastModified).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditFaq(faq)}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteFaq(faq.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* View Ticket Dialog */}
        <Dialog open={isViewTicketOpen} onOpenChange={setIsViewTicketOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ticket Details - {selectedTicket?.id}</DialogTitle>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-6">
                {/* Customer Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                      <p className="text-sm">{selectedTicket.customerName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p className="text-sm">{selectedTicket.customerEmail}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                      <p className="text-sm">{selectedTicket.customerPhone}</p>
                    </div>
                    {selectedTicket.caseId && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Case ID</Label>
                        <p className="text-sm">{selectedTicket.caseId}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ticket Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Ticket Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Subject</Label>
                      <p className="text-sm font-medium">{selectedTicket.subject}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                      <p className="text-sm">{selectedTicket.category}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                      <Badge className={getPriorityColor(selectedTicket.priority)}>
                        {selectedTicket.priority}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                      <Badge className={getStatusColor(selectedTicket.status)}>
                        {selectedTicket.status}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Assigned To</Label>
                      <p className="text-sm">{selectedTicket.assignedTo}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Estimated Resolution</Label>
                      <p className="text-sm">{new Date(selectedTicket.estimatedResolution).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-lg">{selectedTicket.description}</p>
                </div>

                {/* Tags */}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedTicket.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>

                {/* Resolution (if resolved) */}
                {selectedTicket.resolution && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Resolution</Label>
                    <p className="text-sm mt-1 p-3 bg-green-50 rounded-lg">{selectedTicket.resolution}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => handleReplyTicket(selectedTicket)} 
                    className="flex-1"
                  >
                    <Reply className="w-4 h-4 mr-2" />
                    Reply to Ticket
                  </Button>
                  <Button variant="outline" onClick={() => setIsViewTicketOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Reply Ticket Dialog */}
        <Dialog open={isReplyTicketOpen} onOpenChange={setIsReplyTicketOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Reply to Ticket - {selectedTicket?.id}</DialogTitle>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Subject</Label>
                  <p className="text-sm font-medium">{selectedTicket.subject}</p>
                </div>
                <div>
                  <Label htmlFor="replyText">Your Reply</Label>
                  <Textarea
                    id="replyText"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply here..."
                    rows={6}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSubmitReply} className="flex-1">
                    <Send className="w-4 h-4 mr-2" />
                    Send Reply
                  </Button>
                  <Button variant="outline" onClick={() => setIsReplyTicketOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit FAQ Dialog */}
        <Dialog open={isEditFaqOpen} onOpenChange={setIsEditFaqOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit FAQ</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editFaqCategory">Category</Label>
                <Select value={newFaq.category} onValueChange={(value) => setNewFaq(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Booking & Pricing">Booking & Pricing</SelectItem>
                    <SelectItem value="Technical Support">Technical Support</SelectItem>
                    <SelectItem value="AMC">AMC</SelectItem>
                    <SelectItem value="Warranty">Warranty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editFaqQuestion">Question</Label>
                <Input
                  id="editFaqQuestion"
                  value={newFaq.question}
                  onChange={(e) => setNewFaq(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="Enter question"
                />
              </div>
              <div>
                <Label htmlFor="editFaqAnswer">Answer</Label>
                <Textarea
                  id="editFaqAnswer"
                  value={newFaq.answer}
                  onChange={(e) => setNewFaq(prev => ({ ...prev, answer: e.target.value }))}
                  placeholder="Enter answer"
                  rows={4}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="editFaqStatus"
                  checked={newFaq.status === 'active'}
                  onCheckedChange={(checked) => setNewFaq(prev => ({ ...prev, status: checked ? 'active' : 'inactive' }))}
                />
                <Label htmlFor="editFaqStatus">Active</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateFaq} className="flex-1">
                  Update FAQ
                </Button>
                <Button variant="outline" onClick={() => setIsEditFaqOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminSupportManagement;
