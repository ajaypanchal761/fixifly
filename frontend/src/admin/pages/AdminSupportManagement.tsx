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
  Info,
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
  Flag,
  RefreshCw
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

  // Safe render helper to prevent object rendering
  const safeRender = (value: any, fallback: string = 'N/A'): string => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'object') {
      console.error('Attempted to render object directly:', value);
      return fallback;
    }
    return String(value);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isViewTicketOpen, setIsViewTicketOpen] = useState(false);
  const [isReplyTicketOpen, setIsReplyTicketOpen] = useState(false);
  const [isViewTicketDetailsOpen, setIsViewTicketDetailsOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
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

  // Fetch support tickets and stats on component mount
  useEffect(() => {
    fetchSupportTickets();
    fetchSupportStats();
  }, []);

  // Refetch tickets when filters change
  useEffect(() => {
    fetchSupportTickets();
  }, [statusFilter, priorityFilter, searchTerm]);

  // Auto-refresh tickets every 30 seconds to catch rescheduled updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSupportTickets();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Listen for support ticket updates (reschedule, status changes, etc.)
  useEffect(() => {
    const handleSupportTicketUpdate = (event: any) => {
      console.log('Support ticket updated event received in admin:', event.detail);
      fetchSupportTickets(); // Refresh tickets when vendor reschedules or updates
    };

    window.addEventListener('supportTicketUpdated', handleSupportTicketUpdate);
    
    return () => {
      window.removeEventListener('supportTicketUpdated', handleSupportTicketUpdate);
    };
  }, []);

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
                         (ticket.caseId && ticket.caseId.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (ticket.subscriptionId && ticket.subscriptionId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || ticket.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesPriority = priorityFilter === 'all' || ticket.priority.toLowerCase() === priorityFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Submitted':
        return 'bg-blue-100 text-blue-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Waiting for Response':
        return 'bg-yellow-100 text-yellow-800';
      case 'Rescheduled':
        return 'bg-orange-100 text-orange-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
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

  const handleViewTicketDetails = async (ticket: any) => {
    try {
      const response = await adminSupportTicketAPI.getTicket(ticket.id);
      
      if (response.success) {
        setSelectedTicket(response.data.ticket);
        setIsViewTicketDetailsOpen(true);
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error);
    }
  };

  const getVendorStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
    const vendorId = selectedVendor.id || selectedVendor._id;
    if (!vendorId) {
      toast({
        title: "Invalid Vendor",
        description: "Selected vendor does not have a valid ID.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🔧 DEBUG: Starting vendor assignment process...');
      console.log('🔧 DEBUG: Assignment data:', {
        ticketId: selectedTicket.id,
        vendorId: vendorId,
        vendorName: `${selectedVendor?.firstName || ''} ${selectedVendor?.lastName || ''}`,
        selectedVendor: selectedVendor,
        scheduledDate: scheduledDate,
        scheduledTime: scheduledTime,
        scheduleNotes: scheduleNotes
      });

      // Check admin token
      const adminToken = localStorage.getItem('adminToken');
      console.log('🔧 DEBUG: Admin token exists:', !!adminToken);
      console.log('🔧 DEBUG: Admin token preview:', adminToken ? adminToken.substring(0, 20) + '...' : 'null');

      // Check API base URL
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      console.log('🔧 DEBUG: API Base URL:', API_BASE_URL);

      // Use the new assignVendor API method
      console.log('🔧 DEBUG: Calling assignVendor API...');
      const response = await adminSupportTicketAPI.assignVendor(
        selectedTicket.id,
        vendorId,
        scheduledDate || undefined,
        scheduledTime || undefined,
        undefined, // priority - can be added later if needed
        scheduleNotes || undefined
      );
      
      console.log('🔧 DEBUG: Assignment response received:', response);

      if (response.success) {
        console.log('✅ DEBUG: Vendor assigned successfully');
        
        // Show success message
        toast({
          title: "Vendor Assigned Successfully",
          description: `Vendor ${selectedVendor?.firstName || ''} ${selectedVendor?.lastName || ''} has been assigned to ticket ${selectedTicket.id}`,
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
        console.error('❌ DEBUG: Assignment failed:', response.message);
        toast({
          title: "Assignment Failed",
          description: response.message || 'Failed to assign vendor to ticket',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ DEBUG: Error assigning vendor:', error);
      console.error('❌ DEBUG: Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      toast({
        title: "Error",
        description: error.message || 'Failed to assign vendor to ticket',
        variant: "destructive"
      });
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
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">
                Support <span className="text-gradient">Management</span>
              </h1>
              <p className="text-sm text-muted-foreground">Manage support tickets</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Tickets</p>
                  <p className="text-lg font-bold">{safeRender(totalTickets)}</p>
                </div>
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Open Tickets</p>
                  <p className="text-lg font-bold">{safeRender(openTickets)}</p>
                </div>
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Resolved</p>
                  <p className="text-lg font-bold">{safeRender(resolvedTickets)}</p>
                </div>
                <CheckCircle className="h-6 w-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Avg Response Time</p>
                  <p className="text-lg font-bold">{safeRender(avgResponseTime)}</p>
                </div>
                <Headphones className="h-6 w-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tickets" className="space-y-4">
          <TabsContent value="tickets" className="space-y-4">
            {/* Filters and Search */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search tickets, customers, Case ID, Subscription ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 text-sm"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-40 text-sm">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="all" value="all">All Status</SelectItem>
                      <SelectItem key="submitted" value="submitted">Submitted</SelectItem>
                      <SelectItem key="in progress" value="in progress">In Progress</SelectItem>
                      <SelectItem key="waiting for response" value="waiting for response">Waiting for Response</SelectItem>
                      <SelectItem key="rescheduled" value="rescheduled">Rescheduled</SelectItem>
                      <SelectItem key="cancelled" value="cancelled">Cancelled</SelectItem>
                      <SelectItem key="resolved" value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-full md:w-40 text-sm">
                      <SelectValue placeholder="Filter by priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="all" value="all">All Priority</SelectItem>
                      <SelectItem key="high" value="high">High</SelectItem>
                      <SelectItem key="medium" value="medium">Medium</SelectItem>
                      <SelectItem key="low" value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    onClick={fetchSupportTickets}
                    disabled={loading}
                    className="w-full md:w-auto text-xs"
                    size="sm"
                  >
                    <RefreshCw className={`w-3 h-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tickets Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Support Tickets ({filteredTickets.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
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
                            <p className="text-sm font-medium text-gray-900">{safeRender(ticket.id)}</p>
                            <p className="text-xs text-gray-500">
                              {ticket.caseId || <span className="text-muted-foreground">-</span>}
                            </p>
                            {ticket.subscriptionId && (
                              <p className="text-xs text-blue-600 font-medium">
                                AMC: {ticket.subscriptionId}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{safeRender(ticket.customerName)}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Phone className="w-3 h-3" />
                              <span>{ticket.customerPhone}</span>
                            </div>
                            <p className="text-xs text-gray-500">{safeRender(ticket.customerEmail)}</p>
                            {ticket.rescheduleInfo && (
                              <div className="mt-1">
                                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Rescheduled
                                </Badge>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{safeRender(ticket.category)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {ticket.assignedVendor || <span className="text-muted-foreground">Not Assigned</span>}
                            </p>
                            {ticket.assignedAt && (
                              <p className="text-xs text-gray-500">
                                Assigned: {new Date(ticket.assignedAt).toLocaleDateString()}
                              </p>
                            )}
                            {ticket.rescheduleInfo && (
                              <p className="text-xs text-orange-600">
                                Rescheduled: {new Date(ticket.rescheduleInfo?.rescheduledAt).toLocaleDateString()}
                              </p>
                            )}
                            {ticket.vendorDeclinedAt && (
                              <p className="text-xs text-red-600">
                                Declined: {new Date(ticket.vendorDeclinedAt).toLocaleDateString()}
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
                            <p className="text-sm font-medium text-gray-900">{safeRender(ticket.subject)}</p>
                            <p className="text-xs text-gray-500 max-w-xs truncate">
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
                            {ticket.status === 'Rescheduled' && ticket.scheduledDate ? (
                              <div>
                                <p className="text-xs font-medium text-orange-600">
                                  Scheduled: {new Date(ticket.scheduledDate).toLocaleDateString('en-GB', { 
                                    day: '2-digit', 
                                    month: 'short', 
                                    year: 'numeric'
                                  })} at {ticket.scheduledTime}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Created: {safeRender(ticket.created)}
                                </p>
                              </div>
                            ) : (
                              <p className="text-xs">{safeRender(ticket.created)}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center gap-1 justify-end">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewTicket(ticket)}
                                className="h-7 w-7 p-0"
                                title="View Full Details"
                            >
                                <Eye className="w-3 h-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleReplyTicket(ticket)}
                                className="h-7 w-7 p-0"
                                title="Reply to Ticket"
                            >
                                <Reply className="w-3 h-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleAssignVendor(ticket)}
                                className="h-7 w-7 p-0"
                                title="Assign Vendor"
                            >
                                <UserPlus className="w-3 h-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewTicketDetails(ticket)}
                                className="h-7 w-7 p-0"
                                title="View Complete Details"
                            >
                                <Info className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
                
                {filteredTickets.length === 0 && (
                  <div className="text-center py-6">
                    <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-sm font-semibold mb-1">No Tickets Found</h3>
                    <p className="text-xs text-muted-foreground">
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

        </Tabs>

        {/* View Ticket Dialog */}
        <Dialog open={isViewTicketOpen} onOpenChange={setIsViewTicketOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto mt-12">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Eye className="w-4 h-4" />
                Ticket Details - {selectedTicket?.id}
              </DialogTitle>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-3">
                {/* Header with Status and Priority */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                <div>
                      <Label className="text-xs font-medium text-muted-foreground">Status</Label>
                      <Badge className={`${getStatusColor(selectedTicket.status)} text-xs px-2 py-1`}>
                        {selectedTicket.status}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Priority</Label>
                      <Badge className={`${getPriorityColor(selectedTicket.priority)} text-xs px-2 py-1`}>
                        {selectedTicket.priority}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Type</Label>
                      <Badge variant="outline" className="text-xs px-2 py-1">
                        {selectedTicket.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-xs font-medium">{safeRender(selectedTicket.created)}</p>
                  </div>
                </div>

                {/* Customer Information */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="w-3 h-3" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Name</Label>
                        <p className="text-xs font-medium">{safeRender(selectedTicket.customerName)}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                      <p className="text-xs">{safeRender(selectedTicket.customerEmail)}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Phone</Label>
                      <p className="text-xs">{safeRender(selectedTicket.customerPhone)}</p>
                    </div>
                    {selectedTicket.caseId && (
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Case ID</Label>
                          <p className="text-xs font-medium">{safeRender(selectedTicket.caseId)}</p>
                      </div>
                    )}
                    {selectedTicket.subscriptionId && (
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">AMC Subscription ID</Label>
                          <p className="text-xs font-medium text-blue-600">{safeRender(selectedTicket.subscriptionId)}</p>
                      </div>
                    )}
                  </div>
                  </CardContent>
                </Card>

                {/* Ticket Information */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="w-3 h-3" />
                      Ticket Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 p-3">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Subject</Label>
                      <p className="text-xs font-medium mt-1">{safeRender(selectedTicket.subject)}</p>
                    </div>
                    
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Issue Description</Label>
                      <div className="mt-1 p-2 bg-muted rounded-lg">
                        <p className="text-xs leading-relaxed">{safeRender(selectedTicket.description)}</p>
                    </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Assigned To</Label>
                        <p className="text-xs">
                          {typeof selectedTicket.assignedTo === 'object' && selectedTicket.assignedTo !== null 
                            ? selectedTicket.assignedTo.name || selectedTicket.assignedVendor || 'Unassigned'
                            : selectedTicket.assignedVendor || 'Unassigned'
                          }
                        </p>
                    </div>
                      {selectedTicket.estimatedResolution && (
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Estimated Resolution</Label>
                      <p className="text-xs">{new Date(selectedTicket.estimatedResolution).toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric'
                      })}</p>
                    </div>
                      )}
                  </div>
                  </CardContent>
                </Card>

                {/* Tags */}
                {selectedTicket.tags && selectedTicket.tags.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Tag className="w-3 h-3" />
                        Tags
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="flex flex-wrap gap-1">
                    {selectedTicket.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs px-2 py-1">
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
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        Resolution
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs leading-relaxed">{safeRender(selectedTicket.resolution)}</p>
                        {selectedTicket.resolvedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Resolved on: {new Date(selectedTicket.resolvedAt).toLocaleDateString('en-GB', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric'
                            })}
                          </p>
                        )}
                  </div>
                    </CardContent>
                  </Card>
                )}

                {/* Conversation History */}
                {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MessageCircle className="w-3 h-3" />
                        Conversation History ({selectedTicket.responses.length} responses)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {selectedTicket.responses.map((response, index) => (
                          <div key={index} className={`p-2 rounded-lg ${
                            response.sender === 'admin' 
                              ? 'bg-blue-50 border border-blue-200' 
                              : 'bg-gray-50 border border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <Badge variant={response.sender === 'admin' ? 'default' : 'secondary'} className="text-xs">
                                  {response.sender === 'admin' ? 'Admin' : 'Customer'}
                                </Badge>
                                <span className="text-xs font-medium">{response.senderName}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(response.createdAt).toLocaleDateString('en-GB', { 
                                  day: '2-digit', 
                                  month: 'short', 
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed">{safeRender(response.message)}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-3 border-t">
                  <Button 
                    onClick={() => handleReplyTicket(selectedTicket)} 
                    className="flex-1 text-xs"
                    size="sm"
                  >
                    <Reply className="w-3 h-3 mr-2" />
                    Reply to Ticket
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsViewTicketOpen(false);
                      setIsReplyTicketOpen(true);
                    }}
                    size="sm"
                    className="text-xs"
                  >
                    <Edit className="w-3 h-3 mr-2" />
                    Edit Progress
                  </Button>
                  <Button variant="outline" onClick={() => setIsViewTicketOpen(false)} size="sm" className="text-xs">
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Reply Ticket Dialog */}
        <Dialog open={isReplyTicketOpen} onOpenChange={setIsReplyTicketOpen}>
          <DialogContent className="max-w-xl mt-12">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                Reply & Edit Ticket - {selectedTicket?.id}
              </DialogTitle>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-3">
                {/* Ticket Info */}
                <div className="p-2 bg-muted rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Subject</Label>
                  <p className="text-xs font-medium">{safeRender(selectedTicket.subject)}</p>
                </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Customer</Label>
                      <p className="text-xs">{safeRender(selectedTicket.customerName)}</p>
                    </div>
                  </div>
                </div>

                {/* Edit Progress Section */}
                <Card>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Edit className="w-3 h-3" />
                      Edit Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 p-3">
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="subjectInput" className="text-xs">Subject</Label>
                        <Input
                          id="subjectInput"
                          value={selectedTicket.subject}
                          onChange={(e) => setSelectedTicket({...selectedTicket, subject: e.target.value})}
                          placeholder="Enter ticket subject..."
                          className="text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="statusSelect" className="text-xs">Status</Label>
                          <Select
                            value={selectedTicket.status}
                            onValueChange={(value) => setSelectedTicket({...selectedTicket, status: value})}
                          >
                            <SelectTrigger className="text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem key="Submitted" value="Submitted">Submitted</SelectItem>
                              <SelectItem key="In Progress" value="In Progress">In Progress</SelectItem>
                              <SelectItem key="Waiting for Response" value="Waiting for Response">Waiting for Response</SelectItem>
                              <SelectItem key="Resolved" value="Resolved">Resolved</SelectItem>
                              <SelectItem key="Closed" value="Closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="prioritySelect" className="text-xs">Priority</Label>
                          <Select
                            value={selectedTicket.priority}
                            onValueChange={(value) => setSelectedTicket({...selectedTicket, priority: value})}
                          >
                            <SelectTrigger className="text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem key="High" value="High">High</SelectItem>
                              <SelectItem key="Medium" value="Medium">Medium</SelectItem>
                              <SelectItem key="Low" value="Low">Low</SelectItem>
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
                      <MessageCircle className="w-3 h-3" />
                      Add Response
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                <div>
                  <Label htmlFor="replyText" className="text-xs">Your Reply</Label>
                  <Textarea
                    id="replyText"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply here..."
                          rows={4}
                          className="text-xs"
                  />
                </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-3">
                  <Button 
                    onClick={handleUpdateProgress} 
                    variant="outline"
                    className="flex-1 text-xs"
                    size="sm"
                  >
                    <Edit className="w-3 h-3 mr-2" />
                    Update Progress
                  </Button>
                  <Button 
                    onClick={handleSubmitReply} 
                    className="flex-1 text-xs"
                    disabled={!replyText.trim()}
                    size="sm"
                  >
                    <Send className="w-3 h-3 mr-2" />
                    Send Reply
                  </Button>
                  <Button variant="outline" onClick={() => setIsReplyTicketOpen(false)} size="sm" className="text-xs">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Assign Vendor Dialog */}
        <Dialog open={isAssignVendorOpen} onOpenChange={setIsAssignVendorOpen}>
          <DialogContent className="max-w-3xl max-h-[70vh] overflow-y-auto mt-12">
            <DialogHeader>
              <DialogTitle className="text-lg">Assign Vendor to Ticket</DialogTitle>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-3">
                {/* Customer Information */}
                <Card className="p-3">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Customer Name</Label>
                        <p className="text-sm font-medium">{safeRender(selectedTicket.customerName)}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                        <p className="text-sm">{safeRender(selectedTicket.customerEmail)}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Phone Number</Label>
                        <p className="text-sm">{safeRender(selectedTicket.customerPhone)}</p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs font-medium text-muted-foreground">Complete Address</Label>
                        <div className="mt-1 space-y-1">
                          {(() => {
                            const address = selectedTicket.userId?.address || selectedTicket.address || selectedTicket.userAddress;
                            const street = address?.street || selectedTicket.street;
                            const city = address?.city || selectedTicket.city;
                            const state = address?.state || selectedTicket.state;
                            const pincode = address?.pincode || selectedTicket.pincode;
                            const landmark = address?.landmark || selectedTicket.landmark;
                            
                            if (street || city || state || pincode) {
                              return (
                                <div className="text-sm">
                                  {street && (
                                    <p className="font-medium text-gray-900">{safeRender(street)}</p>
                                  )}
                                  <div className="flex flex-wrap gap-2 text-muted-foreground">
                                    {city && <span>{safeRender(city)}</span>}
                                    {state && <span>{safeRender(state)}</span>}
                                    {pincode && <span>{safeRender(pincode)}</span>}
                                  </div>
                                  {landmark && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      <span className="font-medium">Landmark:</span> {safeRender(landmark)}
                                    </p>
                                  )}
                                </div>
                              );
                            } else {
                              return (
                                <div className="text-sm text-muted-foreground">
                                  <p>Address not available</p>
                                  <p className="text-xs mt-1">Phone: {safeRender(selectedTicket.customerPhone)}</p>
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Ticket ID</Label>
                        <p className="text-sm font-medium">{safeRender(selectedTicket.id)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Ticket Details */}
                <Card className="p-3">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Ticket Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Subject</Label>
                        <p className="text-sm font-medium">{safeRender(selectedTicket.subject)}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Type of Support</Label>
                        <p className="text-sm">{safeRender(selectedTicket.category)}</p>
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
                        <p className="text-sm whitespace-pre-wrap">{safeRender(selectedTicket.description, 'No description provided')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Scheduled Date & Time */}
                <Card className="p-3">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
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
                    <CardTitle className="text-sm flex items-center gap-2">
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
                        <Select value={selectedVendor?.id || selectedVendor?._id || ''} onValueChange={(value) => {
                          const vendor = vendors.find(v => v.id === value);
                          if (vendor) {
                            setSelectedVendor(vendor);
                          }
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a vendor to assign this ticket" />
                          </SelectTrigger>
                          <SelectContent>
                            {vendors.map((vendor) => (
                              <SelectItem key={vendor.id} value={vendor.id}>
                                <div className="flex items-center gap-2">
                                  <div>
                                    <p className="font-medium">{safeRender(vendor.firstName)} {safeRender(vendor.lastName)}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {Array.isArray(vendor.services) ? vendor.services.join(', ') : 'No categories'} | Rating: {vendor.rating || 'N/A'} | Tasks: {vendor.completedBookings || 0}
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
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Selected Vendor Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Vendor Name</Label>
                          <p className="text-sm font-medium">{safeRender(selectedVendor?.firstName)} {safeRender(selectedVendor?.lastName)}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                          <p className="text-sm">{safeRender(selectedVendor?.email, 'N/A')}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Phone</Label>
                          <p className="text-sm">{safeRender(selectedVendor?.phone, 'N/A')}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Experience</Label>
                          <p className="text-sm">{safeRender(selectedVendor?.experience, 'N/A')}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Rating</Label>
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{selectedVendor.rating || 'N/A'}</span>
                            <span className="text-xs text-muted-foreground">({selectedVendor.totalReviews || 0} reviews)</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Tasks Completed</Label>
                          <p className="text-sm">{safeRender(selectedVendor.completedBookings, '0')}</p>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs font-medium text-muted-foreground">Service Categories</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedVendor.services?.map((category, index) => (
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

        {/* View Ticket Complete Details Dialog */}
        <Dialog open={isViewTicketDetailsOpen} onOpenChange={setIsViewTicketDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto mt-12">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Info className="w-4 h-4" />
                Complete Ticket Details - {selectedTicket?.id}
              </DialogTitle>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-4">
                {/* Basic Information */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Ticket ID</Label>
                      <p className="font-medium">{safeRender(selectedTicket.id)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Subject</Label>
                      <p className="font-medium">{safeRender(selectedTicket.subject)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                      <Badge 
                        variant={selectedTicket.status === 'Open' ? 'default' : 
                                selectedTicket.status === 'In Progress' ? 'secondary' :
                                selectedTicket.status === 'Resolved' ? 'outline' : 'destructive'}
                        className="text-sm px-3 py-1"
                      >
                        {selectedTicket.status}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                      <Badge 
                        variant={selectedTicket.priority === 'High' ? 'destructive' : 
                                selectedTicket.priority === 'Medium' ? 'default' : 'secondary'}
                        className="text-sm px-3 py-1"
                      >
                        {selectedTicket.priority}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Created Date</Label>
                      <p className="font-medium">{safeRender(selectedTicket.created)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Last Update</Label>
                      <p className="font-medium">{safeRender(selectedTicket.lastUpdate)}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Information */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Customer Name</Label>
                      <p className="font-medium">{safeRender(selectedTicket.customerName, 'N/A')}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                      <p className="font-medium">{safeRender(selectedTicket.customerPhone, 'N/A')}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p className="font-medium">{safeRender(selectedTicket.customerEmail, 'N/A')}</p>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-muted-foreground">Complete Address</Label>
                      <div className="mt-1 space-y-1">
                        {(() => {
                          const address = selectedTicket.userId?.address || selectedTicket.address || selectedTicket.userAddress;
                          const street = address?.street || selectedTicket.street;
                          const city = address?.city || selectedTicket.city;
                          const state = address?.state || selectedTicket.state;
                          const pincode = address?.pincode || selectedTicket.pincode;
                          const landmark = address?.landmark || selectedTicket.landmark;
                          
                          if (street || city || state || pincode) {
                            return (
                              <div className="text-sm">
                                {street && (
                                  <p className="font-medium text-gray-900">{safeRender(street)}</p>
                                )}
                                <div className="flex flex-wrap gap-2 text-muted-foreground">
                                  {city && <span>{safeRender(city)}</span>}
                                  {state && <span>{safeRender(state)}</span>}
                                  {pincode && <span>{safeRender(pincode)}</span>}
                                </div>
                                {landmark && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    <span className="font-medium">Landmark:</span> {safeRender(landmark)}
                                  </p>
                                )}
                              </div>
                            );
                          } else {
                            return (
                              <div className="text-sm text-muted-foreground">
                                <p>Address not available</p>
                                <p className="text-xs mt-1">Phone: {safeRender(selectedTicket.customerPhone)}</p>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Spare Parts Used */}
                {selectedTicket.completionData?.spareParts && selectedTicket.completionData.spareParts.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Spare Parts Used</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="space-y-3">
                        {selectedTicket.completionData.spareParts.map((part: any, index: number) => (
                          <div key={index} className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50">
                            {/* Spare Part Image */}
                            <div className="flex-shrink-0">
                              {part.photo ? (
                                <img 
                                  src={part.photo} 
                                  alt={part.name}
                                  className="w-12 h-12 object-cover rounded-lg border"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (nextElement) {
                                      nextElement.style.display = 'flex';
                                    }
                                  }}
                                />
                              ) : null}
                              <div 
                                className="w-12 h-12 bg-gray-200 rounded-lg border flex items-center justify-center text-gray-500 text-xs"
                                style={{ display: part.photo ? 'none' : 'flex' }}
                              >
                                No Image
                              </div>
                            </div>
                            
                            {/* Spare Part Details */}
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-semibold text-gray-900">{part.name || 'Unknown Part'}</h4>
                                  <p className="text-sm text-gray-600">Part ID: #{part.id || 'N/A'}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-green-600">₹{part.amount || 0}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {/* Spare Parts Total */}
                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg">
                            <span className="text-lg font-semibold text-gray-800">Spare Parts Total:</span>
                            <span className="text-xl font-bold text-blue-600">
                              ₹{selectedTicket.completionData.spareParts.reduce((sum: number, part: any) => sum + (parseFloat(part.amount) || 0), 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Vendor Information */}
                {selectedTicket.assignedTo && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Vendor Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Vendor Name</Label>
                        <p className="font-medium">
                          {typeof selectedTicket.assignedTo === 'object' && selectedTicket.assignedTo !== null 
                            ? selectedTicket.assignedTo.name || selectedTicket.assignedVendor || 'N/A'
                            : selectedTicket.assignedVendor || 'N/A'
                          }
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Vendor ID</Label>
                        <p className="font-medium">
                          {typeof selectedTicket.assignedTo === 'object' && selectedTicket.assignedTo !== null 
                            ? selectedTicket.assignedTo.id || selectedTicket.assignedTo._id || 'N/A'
                            : 'N/A'
                          }
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Vendor Status</Label>
                        <Badge className={`${getVendorStatusColor(selectedTicket.vendorStatus)} text-sm px-3 py-1`}>
                          {selectedTicket.vendorStatus || 'Pending'}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Assigned Date</Label>
                        <p className="font-medium">{selectedTicket.assignedAt ? new Date(selectedTicket.assignedAt).toLocaleDateString('en-GB', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric'
                        }) : 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Scheduled Date</Label>
                        <p className="font-medium">{selectedTicket.scheduledDate || 'Not scheduled'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Scheduled Time</Label>
                        <p className="font-medium">{selectedTicket.scheduledTime || 'Not scheduled'}</p>
                      </div>
                      {selectedTicket.vendorDeclinedAt && (
                        <>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Declined Date</Label>
                            <p className="font-medium text-red-600">{new Date(selectedTicket.vendorDeclinedAt).toLocaleDateString('en-GB', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric'
                            })}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Decline Reason</Label>
                            <p className="font-medium text-red-600">{selectedTicket.vendorDeclineReason || 'No reason provided'}</p>
                          </div>
                        </>
                      )}
                      {selectedTicket.rescheduleInfo && (
                        <>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Original Date</Label>
                            <p className="font-medium">{selectedTicket.rescheduleInfo?.originalDate || 'N/A'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Original Time</Label>
                            <p className="font-medium">{selectedTicket.rescheduleInfo?.originalTime || 'N/A'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Reschedule Reason</Label>
                            <p className="font-medium">{selectedTicket.rescheduleInfo?.reason || 'N/A'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">New Date</Label>
                            <p className="font-medium text-green-600">{selectedTicket.scheduledDate ? new Date(selectedTicket.scheduledDate).toLocaleDateString('en-GB', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric'
                            }) : 'N/A'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">New Time</Label>
                            <p className="font-medium text-green-600">{selectedTicket.scheduledTime || 'N/A'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Rescheduled At</Label>
                            <p className="font-medium">{selectedTicket.rescheduleInfo?.rescheduledAt ? new Date(selectedTicket.rescheduleInfo.rescheduledAt).toLocaleDateString('en-GB', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'N/A'}</p>
                          </div>
                        </>
                      )}
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Completed Date</Label>
                        <p className="font-medium">{selectedTicket.vendorCompletedAt ? new Date(selectedTicket.vendorCompletedAt).toLocaleDateString('en-GB', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric'
                        }) : 'Not completed'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Schedule Notes</Label>
                        <p className="font-medium">{selectedTicket.scheduleNotes || 'No notes'}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Payment Information */}
                {(selectedTicket.paymentMode || selectedTicket.billingAmount || selectedTicket.totalAmount) && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Payment Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Payment Mode</Label>
                        <p className="font-medium">{selectedTicket.paymentMode || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Payment Status</Label>
                        <Badge className={`${selectedTicket.paymentStatus === 'collected' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} text-sm px-3 py-1`}>
                          {selectedTicket.paymentStatus || 'N/A'}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Billing Amount</Label>
                        <p className="font-medium">₹{selectedTicket.billingAmount || 0}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Total Amount</Label>
                        <p className="font-medium">₹{selectedTicket.totalAmount || 0}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">GST Amount</Label>
                        <p className="font-medium">₹{selectedTicket.completionData?.gstAmount || 0}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Traveling Amount</Label>
                        <p className="font-medium">₹{selectedTicket.completionData?.travelingAmount || 0}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Payment ID</Label>
                        <p className="font-medium">{selectedTicket.paymentId || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Payment Completed At</Label>
                        <p className="font-medium">{selectedTicket.paymentCompletedAt ? new Date(selectedTicket.paymentCompletedAt).toLocaleDateString('en-GB', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Issue Description */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Issue Description</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{selectedTicket.description || 'No description provided'}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Resolution Notes */}
                {selectedTicket.completionData?.resolutionNote && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Resolution Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{selectedTicket.completionData?.resolutionNote || 'No resolution notes'}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
};

export default AdminSupportManagement;
