import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '../components/AdminHeader';
import { adminSupportTicketAPI } from '@/services/supportApiService';
import adminApiService from '@/services/adminApi';
import { useToast } from '@/hooks/use-toast';
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
  UserPlus,
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
  const { toast } = useToast();
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
  const [loading, setLoading] = useState(false);

  // Vendor assignment state
  const [isAssignVendorOpen, setIsAssignVendorOpen] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');

  // Support tickets data - will be fetched from API
  const [supportTickets, setSupportTickets] = useState([]);

  // FAQ data - will be fetched from API
  const [faqs, setFaqs] = useState([]);

  const [newFaq, setNewFaq] = useState({
    category: '',
    question: '',
    answer: '',
    status: 'active'
  });

  // Fetch support tickets and stats on component mount
  useEffect(() => {
    fetchSupportTickets();
    fetchSupportStats();
  }, []);

  // Refetch tickets when filters change
  useEffect(() => {
    fetchSupportTickets();
  }, [statusFilter, priorityFilter, searchTerm]);

  const fetchSupportTickets = async () => {
    try {
      setLoading(true);
      const response = await adminSupportTicketAPI.getAllTickets({
        page: 1,
        limit: 100,
        status: statusFilter,
        priority: priorityFilter,
        search: searchTerm
      });
      
      if (response.success) {
        setSupportTickets(response.data.tickets);
      }
    } catch (error) {
      console.error('Error fetching support tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportStats = async () => {
    try {
      const response = await adminSupportTicketAPI.getStats();
      if (response.success) {
        // Update stats if needed
        console.log('Support stats:', response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching support stats:', error);
    }
  };

  const filteredTickets = supportTickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (ticket.caseId && ticket.caseId.toLowerCase().includes(searchTerm.toLowerCase()));
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

  const handleViewTicket = async (ticket: any) => {
    try {
      const response = await adminSupportTicketAPI.getTicket(ticket.id);
      
      if (response.success) {
        setSelectedTicket(response.data.ticket);
        setIsViewTicketOpen(true);
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error);
    }
  };

  const handleReplyTicket = (ticket: any) => {
    setSelectedTicket({
      ...ticket,
      originalSubject: ticket.subject,
      originalStatus: ticket.status,
      originalPriority: ticket.priority
    });
    setIsReplyTicketOpen(true);
    setReplyText('');
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;

    try {
      // Update ticket subject, status and priority if changed
      const updateData: any = {};
      if (selectedTicket.subject !== selectedTicket.originalSubject) {
        updateData.subject = selectedTicket.subject;
      }
      if (selectedTicket.status !== selectedTicket.originalStatus) {
        updateData.status = selectedTicket.status;
      }
      if (selectedTicket.priority !== selectedTicket.originalPriority) {
        updateData.priority = selectedTicket.priority;
      }

      // Update ticket if any fields changed
      if (Object.keys(updateData).length > 0) {
        await adminSupportTicketAPI.updateTicket(selectedTicket.id, updateData);
      }

      // Add response to ticket
      const response = await adminSupportTicketAPI.addResponse(selectedTicket.id, replyText.trim());
      
      if (response.success) {
        // Refresh tickets
        await fetchSupportTickets();
        
        setIsReplyTicketOpen(false);
        setReplyText('');
        setSelectedTicket(null);
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
    }
  };

  const handleUpdateProgress = async () => {
    try {
      // Update ticket subject, status and priority if changed
      const updateData: any = {};
      if (selectedTicket.subject !== selectedTicket.originalSubject) {
        updateData.subject = selectedTicket.subject;
      }
      if (selectedTicket.status !== selectedTicket.originalStatus) {
        updateData.status = selectedTicket.status;
      }
      if (selectedTicket.priority !== selectedTicket.originalPriority) {
        updateData.priority = selectedTicket.priority;
      }

      // Update ticket if any fields changed
      if (Object.keys(updateData).length > 0) {
        await adminSupportTicketAPI.updateTicket(selectedTicket.id, updateData);
        
        // Refresh tickets
        await fetchSupportTickets();
        
        setIsReplyTicketOpen(false);
        setSelectedTicket(null);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleTicketStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const response = await adminSupportTicketAPI.updateTicket(ticketId, { status: newStatus });
      
      if (response.success) {
        // Refresh tickets
        await fetchSupportTickets();
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const handleTicketPriorityChange = async (ticketId: string, newPriority: string) => {
    try {
      const response = await adminSupportTicketAPI.updateTicket(ticketId, { priority: newPriority });
      
      if (response.success) {
        // Refresh tickets
        await fetchSupportTickets();
      }
    } catch (error) {
      console.error('Error updating ticket priority:', error);
    }
  };

  // Vendor assignment functions
  const handleAssignVendor = async (ticket: any) => {
    setSelectedTicket(ticket);
    setIsAssignVendorOpen(true);
    await fetchVendors();
  };

  const fetchVendors = async () => {
    try {
      setVendorLoading(true);
      const response = await adminApiService.getVendors({
        page: 1,
        limit: 100,
        status: 'active'
      });
      
      if (response.success) {
        setVendors(response.data.vendors);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setVendorLoading(false);
    }
  };

  const handleAssignVendorToTicket = async () => {
    if (!selectedVendor || !selectedTicket) {
      toast({
        title: "Missing Information",
        description: "Please select both a vendor and a ticket to assign.",
        variant: "destructive"
      });
      return;
    }

    // Validate vendor ID
    const vendorId = selectedVendor._id || selectedVendor.id;
    if (!vendorId) {
      toast({
        title: "Invalid Vendor",
        description: "Selected vendor does not have a valid ID.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Assigning vendor to ticket:', {
        ticketId: selectedTicket.id,
        vendorId: vendorId,
        vendorName: `${selectedVendor.firstName} ${selectedVendor.lastName}`,
        selectedVendor: selectedVendor,
        scheduledDate: scheduledDate,
        scheduledTime: scheduledTime,
        scheduleNotes: scheduleNotes
      });

      // Use the new assignVendor API method
      const response = await adminSupportTicketAPI.assignVendor(
        selectedTicket.id,
        vendorId,
        scheduledDate || undefined,
        scheduledTime || undefined,
        undefined, // priority - can be added later if needed
        scheduleNotes || undefined
      );
      
      console.log('Assignment response:', response);

      if (response.success) {
        console.log('Vendor assigned successfully');
        
        // Show success message
        toast({
          title: "Vendor Assigned Successfully",
          description: `Vendor ${selectedVendor.firstName} ${selectedVendor.lastName} has been assigned to ticket ${selectedTicket.id}`,
          variant: "default"
        });
        
        // Refresh tickets
        await fetchSupportTickets();
        
        // Close modal and reset state
        setIsAssignVendorOpen(false);
        setSelectedVendor(null);
        setSelectedTicket(null);
        setScheduledDate('');
        setScheduledTime('');
        setScheduleNotes('');
      } else {
        console.error('Assignment failed:', response.message);
        toast({
          title: "Assignment Failed",
          description: response.message || 'Failed to assign vendor to ticket',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error assigning vendor:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to assign vendor to ticket',
        variant: "destructive"
      });
    }
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
  const avgResponseTime = '0 hours'; // Will be calculated from actual data

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
                        placeholder="Search tickets, customers, Case ID..."
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
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                        <TableHead>Ticket ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Service Type</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Vendor Status</TableHead>
                        <TableHead>Subject & Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{ticket.id}</p>
                            <p className="text-sm text-gray-500">
                              {ticket.caseId || <span className="text-muted-foreground">-</span>}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{ticket.customerName}</p>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Phone className="w-3 h-3" />
                              <span>{ticket.customerPhone}</span>
                            </div>
                            <p className="text-sm text-gray-500">{ticket.customerEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{ticket.category}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">
                              {ticket.assignedVendor || <span className="text-muted-foreground">Not Assigned</span>}
                            </p>
                            {ticket.assignedAt && (
                              <p className="text-sm text-gray-500">
                                {new Date(ticket.assignedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <Badge 
                              variant={ticket.vendorStatus === 'Completed' ? 'default' : 
                                      ticket.vendorStatus === 'Accepted' ? 'secondary' : 
                                      ticket.vendorStatus === 'Declined' ? 'destructive' : 'outline'}
                              className="text-xs"
                            >
                              {ticket.vendorStatus || 'Pending'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{ticket.subject}</p>
                            <p className="text-sm text-gray-500 max-w-xs truncate">
                              {ticket.description || 'No description provided'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={ticket.status === 'Resolved' ? 'default' : 
                                      ticket.status === 'In Progress' ? 'secondary' : 
                                      ticket.status === 'Closed' ? 'outline' : 'destructive'}
                              className="text-xs"
                            >
                              {ticket.status}
                            </Badge>
                           
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={ticket.priority === 'High' ? 'destructive' : 
                                      ticket.priority === 'Medium' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {ticket.priority}
                            </Badge>
                            
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{ticket.created}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center gap-1 justify-end">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewTicket(ticket)}
                                className="h-8 w-8 p-0"
                                title="View Full Details"
                            >
                                <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleReplyTicket(ticket)}
                                className="h-8 w-8 p-0"
                                title="Reply to Ticket"
                            >
                                <Reply className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleAssignVendor(ticket)}
                                className="h-8 w-8 p-0"
                                title="Assign Vendor"
                            >
                                <UserPlus className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
                
                {filteredTickets.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Tickets Found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                        ? 'Try adjusting your filters to see more tickets.'
                        : 'No support tickets have been submitted yet.'
                      }
                    </p>
                  </div>
                )}
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
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Ticket Details - {selectedTicket?.id}
              </DialogTitle>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-4">
                {/* Header with Status and Priority */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                <div>
                      <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                      <Badge className={`${getStatusColor(selectedTicket.status)} text-sm px-3 py-1`}>
                        {selectedTicket.status}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                      <Badge className={`${getPriorityColor(selectedTicket.priority)} text-sm px-3 py-1`}>
                        {selectedTicket.priority}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                      <Badge variant="outline" className="text-sm px-3 py-1">
                        {selectedTicket.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="text-sm font-medium">{selectedTicket.created}</p>
                  </div>
                </div>

                {/* Customer Information */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                        <p className="text-sm font-medium">{selectedTicket.customerName}</p>
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
                          <p className="text-sm font-medium">{selectedTicket.caseId}</p>
                      </div>
                    )}
                  </div>
                  </CardContent>
                </Card>

                {/* Ticket Information */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Ticket Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Subject</Label>
                      <p className="text-sm font-medium mt-1">{selectedTicket.subject}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Issue Description</Label>
                      <div className="mt-1 p-3 bg-muted rounded-lg">
                        <p className="text-sm leading-relaxed">{selectedTicket.description}</p>
                    </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Assigned To</Label>
                        <p className="text-sm">{selectedTicket.assignedTo || 'Unassigned'}</p>
                    </div>
                      {selectedTicket.estimatedResolution && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Estimated Resolution</Label>
                      <p className="text-sm">{new Date(selectedTicket.estimatedResolution).toLocaleDateString()}</p>
                    </div>
                      )}
                  </div>
                  </CardContent>
                </Card>

                {/* Tags */}
                {selectedTicket.tags && selectedTicket.tags.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Tag className="w-5 h-5" />
                        Tags
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                    {selectedTicket.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-sm px-3 py-1">
                            {tag}
                          </Badge>
                    ))}
                  </div>
                    </CardContent>
                  </Card>
                )}

                {/* Resolution (if resolved) */}
                {selectedTicket.resolution && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Resolution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm leading-relaxed">{selectedTicket.resolution}</p>
                        {selectedTicket.resolvedAt && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Resolved on: {new Date(selectedTicket.resolvedAt).toLocaleDateString()}
                          </p>
                        )}
                  </div>
                    </CardContent>
                  </Card>
                )}

                {/* Conversation History */}
                {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MessageCircle className="w-5 h-5" />
                        Conversation History ({selectedTicket.responses.length} responses)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {selectedTicket.responses.map((response, index) => (
                          <div key={index} className={`p-3 rounded-lg ${
                            response.sender === 'admin' 
                              ? 'bg-blue-50 border border-blue-200' 
                              : 'bg-gray-50 border border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant={response.sender === 'admin' ? 'default' : 'secondary'} className="text-xs">
                                  {response.sender === 'admin' ? 'Admin' : 'Customer'}
                                </Badge>
                                <span className="text-sm font-medium">{response.senderName}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(response.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed">{response.message}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    onClick={() => handleReplyTicket(selectedTicket)} 
                    className="flex-1"
                  >
                    <Reply className="w-4 h-4 mr-2" />
                    Reply to Ticket
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsViewTicketOpen(false);
                      setIsReplyTicketOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Progress
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
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Reply & Edit Ticket - {selectedTicket?.id}
              </DialogTitle>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-3">
                {/* Ticket Info */}
                <div className="p-2 bg-muted rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Subject</Label>
                  <p className="text-sm font-medium">{selectedTicket.subject}</p>
                </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Customer</Label>
                      <p className="text-sm">{selectedTicket.customerName}</p>
                    </div>
                  </div>
                </div>

                {/* Edit Progress Section */}
                <Card>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Edit className="w-4 h-4" />
                      Edit Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="subjectInput">Subject</Label>
                        <Input
                          id="subjectInput"
                          value={selectedTicket.subject}
                          onChange={(e) => setSelectedTicket({...selectedTicket, subject: e.target.value})}
                          placeholder="Enter ticket subject..."
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="statusSelect">Status</Label>
                          <Select
                            value={selectedTicket.status}
                            onValueChange={(value) => setSelectedTicket({...selectedTicket, status: value})}
                          >
                            <SelectTrigger>
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
                        </div>
                        <div>
                          <Label htmlFor="prioritySelect">Priority</Label>
                          <Select
                            value={selectedTicket.priority}
                            onValueChange={(value) => setSelectedTicket({...selectedTicket, priority: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="High">High</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="Low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Reply Section */}
                <Card>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Add Response
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                <div>
                  <Label htmlFor="replyText">Your Reply</Label>
                  <Textarea
                    id="replyText"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply here..."
                          rows={4}
                  />
                </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleUpdateProgress} 
                    variant="outline"
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Update Progress
                  </Button>
                  <Button 
                    onClick={handleSubmitReply} 
                    className="flex-1"
                    disabled={!replyText.trim()}
                  >
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

        {/* Assign Vendor Dialog */}
        <Dialog open={isAssignVendorOpen} onOpenChange={setIsAssignVendorOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Assign Vendor to Ticket</DialogTitle>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-4">
                {/* Customer Information */}
                <Card className="p-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Customer Name</Label>
                        <p className="text-sm font-medium">{selectedTicket.customerName}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                        <p className="text-sm">{selectedTicket.customerEmail}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Phone Number</Label>
                        <p className="text-sm">{selectedTicket.customerPhone}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Address</Label>
                        <p className="text-sm">{selectedTicket.address || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Pincode</Label>
                        <p className="text-sm">{selectedTicket.pincode || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Ticket ID</Label>
                        <p className="text-sm font-medium">{selectedTicket.id}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Ticket Details */}
                <Card className="p-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Ticket Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Subject</Label>
                        <p className="text-sm font-medium">{selectedTicket.subject}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Type of Support</Label>
                        <p className="text-sm">{selectedTicket.category}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Priority</Label>
                        <Badge 
                          variant={selectedTicket.priority === 'High' ? 'destructive' : 
                                  selectedTicket.priority === 'Medium' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {selectedTicket.priority}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Status</Label>
                        <Badge 
                          variant={selectedTicket.status === 'Resolved' ? 'default' : 
                                  selectedTicket.status === 'In Progress' ? 'secondary' : 
                                  selectedTicket.status === 'Closed' ? 'outline' : 'destructive'}
                          className="text-xs"
                        >
                          {selectedTicket.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Issue Description</Label>
                      <div className="mt-1 p-3 bg-muted rounded-md">
                        <p className="text-sm whitespace-pre-wrap">{selectedTicket.description || 'No description provided'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Scheduled Date & Time */}
                <Card className="p-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Schedule Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="scheduledDate">Scheduled Date</Label>
                        <Input
                          id="scheduledDate"
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          placeholder="Select date"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="scheduledTime">Scheduled Time</Label>
                        <Input
                          id="scheduledTime"
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          placeholder="Select time"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="scheduleNotes">Schedule Notes (Optional)</Label>
                      <Textarea
                        id="scheduleNotes"
                        value={scheduleNotes}
                        onChange={(e) => setScheduleNotes(e.target.value)}
                        placeholder="Add any specific instructions or notes for the vendor..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Vendor Selection */}
                <Card className="p-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Choose a Vendor
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {vendorLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-sm text-muted-foreground">Loading vendors...</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="vendorSelect">Select Vendor</Label>
                        <Select value={selectedVendor?._id || ''} onValueChange={(value) => {
                          const vendor = vendors.find(v => v._id === value);
                          setSelectedVendor(vendor);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a vendor to assign this ticket" />
                          </SelectTrigger>
                          <SelectContent>
                            {vendors.map((vendor) => (
                              <SelectItem key={vendor._id} value={vendor._id}>
                                <div className="flex items-center gap-2">
                                  <div>
                                    <p className="font-medium">{vendor.firstName} {vendor.lastName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {vendor.serviceCategories?.join(', ')} | Rating: {vendor.rating?.average || 'N/A'} | Tasks: {vendor.stats?.completedTasks || 0}
                                    </p>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Selected Vendor Details */}
                {selectedVendor && (
                  <Card className="p-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Selected Vendor Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Vendor Name</Label>
                          <p className="text-sm font-medium">{selectedVendor.firstName} {selectedVendor.lastName}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                          <p className="text-sm">{selectedVendor.email}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Phone</Label>
                          <p className="text-sm">{selectedVendor.phone}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Experience</Label>
                          <p className="text-sm">{selectedVendor.experience}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Rating</Label>
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{selectedVendor.rating?.average || 'N/A'}</span>
                            <span className="text-xs text-muted-foreground">({selectedVendor.rating?.count || 0} reviews)</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Tasks Completed</Label>
                          <p className="text-sm">{selectedVendor.stats?.completedTasks || 0}</p>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs font-medium text-muted-foreground">Service Categories</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedVendor.serviceCategories?.map((category, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    onClick={handleAssignVendorToTicket} 
                    className="flex-1"
                    disabled={!selectedVendor}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Assign Vendor to Ticket
                  </Button>
                  <Button variant="outline" onClick={() => setIsAssignVendorOpen(false)}>
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
