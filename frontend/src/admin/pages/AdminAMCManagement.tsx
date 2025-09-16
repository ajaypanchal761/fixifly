import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '../components/AdminHeader';
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Search, 
  Filter,
  Star,
  Clock,
  Headphones,
  Award,
  Calendar,
  CreditCard,
  Settings,
  Download,
  Home,
  AlertTriangle,
  FileText,
  Timer,
  Users,
  TrendingUp,
  DollarSign,
  CheckCircle,
  XCircle,
  MoreHorizontal
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

const AdminAMCManagement = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [isViewSubscriptionOpen, setIsViewSubscriptionOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);

  // Sample AMC plans data
  const [amcPlans, setAmcPlans] = useState([
    {
      id: '1',
      name: 'Try Plan',
      price: 29,
      period: 'month',
      description: 'Perfect for individual users with basic needs',
      popular: false,
      status: 'active',
      subscribers: 1250,
      revenue: 36250,
      features: [
        '1 Device Coverage',
        'Basic Support (Email)',
        'Monthly Health Check',
        'Standard Repair Priority',
        'Software Updates',
        'Basic Virus Protection',
        '48-hour Response Time'
      ],
      notIncluded: [
        'Hardware Replacement',
        'On-site Service',
        '24/7 Phone Support'
      ],
      createdAt: '2024-01-15',
      lastModified: '2024-11-20'
    },
    {
      id: '2',
      name: 'Care Plan',
      price: 79,
      period: 'month',
      description: 'Best for small businesses and power users',
      popular: true,
      status: 'active',
      subscribers: 850,
      revenue: 67150,
      features: [
        '1 Device Coverage',
        'Priority Support (Phone + Email)',
        'Bi-weekly Health Checks',
        'Priority Repair Queue',
        'Software & Driver Updates',
        'Advanced Security Suite',
        '24-hour Response Time',
        'Hardware Replacement (Once/Year)',
        'Remote Assistance',
        'Data Backup Service'
      ],
      notIncluded: [
        'On-site Service'
      ],
      createdAt: '2024-01-15',
      lastModified: '2024-11-20'
    },
    {
      id: '3',
      name: 'Relax Plan',
      price: 149,
      period: 'month',
      description: 'Complete peace of mind for enterprises',
      popular: false,
      status: 'active',
      subscribers: 320,
      revenue: 47680,
      features: [
        '1 Device Coverage',
        '24/7 Premium Support',
        'Weekly Health Checks',
        'Express Repair Priority',
        'All Software Updates',
        'Enterprise Security Suite',
        '2-hour Response Time',
        'Unlimited Hardware Replacements',
        'On-site Service Available',
        'Cloud Data Backup',
        'Dedicated Account Manager',
        'Custom Service Plans',
        'Emergency Weekend Support'
      ],
      notIncluded: [],
      createdAt: '2024-01-15',
      lastModified: '2024-11-20'
    }
  ]);

  // Sample user subscriptions data
  const [userSubscriptions, setUserSubscriptions] = useState([
    {
      id: 'SUB001',
      userId: 'U001',
      userName: 'John Doe',
      userEmail: 'john@example.com',
      planId: '2',
      planName: 'Care Plan',
      status: 'Active',
      startDate: '2024-01-15',
      endDate: '2025-01-15',
      nextBilling: '2024-12-15',
      amount: 79,
      devices: 3,
      usedDevices: 2,
      lastService: '2024-11-20',
      nextService: '2024-12-05',
      homeVisits: { total: 4, used: 1, remaining: 3 },
      warrantyClaims: { total: 2, used: 0, remaining: 2 },
      daysRemaining: 45,
      createdAt: '2024-01-15'
    },
    {
      id: 'SUB002',
      userId: 'U002',
      userName: 'Jane Smith',
      userEmail: 'jane@example.com',
      planId: '1',
      planName: 'Try Plan',
      status: 'Active',
      startDate: '2024-10-01',
      endDate: '2025-10-01',
      nextBilling: '2024-12-01',
      amount: 29,
      devices: 1,
      usedDevices: 1,
      lastService: '2024-11-15',
      nextService: '2024-12-01',
      homeVisits: { total: 2, used: 2, remaining: 0 },
      warrantyClaims: { total: 1, used: 1, remaining: 0 },
      daysRemaining: 305,
      createdAt: '2024-10-01'
    }
  ]);

  const [newPlan, setNewPlan] = useState({
    name: '',
    price: '',
    period: 'month',
    description: '',
    popular: false,
    status: 'active',
    features: [] as string[],
    notIncluded: [] as string[]
  });

  const [newFeature, setNewFeature] = useState('');
  const [newNotIncluded, setNewNotIncluded] = useState('');

  const filteredPlans = amcPlans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredSubscriptions = userSubscriptions.filter(sub => {
    const matchesSearch = sub.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.planName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddPlan = () => {
    if (newPlan.name && newPlan.price && newPlan.description) {
      const plan = {
        id: String(amcPlans.length + 1),
        name: newPlan.name,
        price: parseInt(newPlan.price),
        period: newPlan.period,
        description: newPlan.description,
        popular: newPlan.popular,
        status: newPlan.status,
        subscribers: 0,
        revenue: 0,
        features: newPlan.features,
        notIncluded: newPlan.notIncluded,
        createdAt: new Date().toISOString().split('T')[0],
        lastModified: new Date().toISOString().split('T')[0]
      };
      
      setAmcPlans(prev => [...prev, plan]);
      setNewPlan({
        name: '',
        price: '',
        period: 'month',
        description: '',
        popular: false,
        status: 'active',
        features: [],
        notIncluded: []
      });
      setIsAddPlanOpen(false);
    }
  };

  const handleEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setNewPlan({
      name: plan.name,
      price: plan.price.toString(),
      period: plan.period,
      description: plan.description,
      popular: plan.popular,
      status: plan.status,
      features: plan.features,
      notIncluded: plan.notIncluded
    });
    setIsEditPlanOpen(true);
  };

  const handleUpdatePlan = () => {
    if (editingPlan && newPlan.name && newPlan.price && newPlan.description) {
      setAmcPlans(prev => prev.map(plan => 
        plan.id === editingPlan.id 
          ? {
              ...plan,
              name: newPlan.name,
              price: parseInt(newPlan.price),
              period: newPlan.period,
              description: newPlan.description,
              popular: newPlan.popular,
              status: newPlan.status,
              features: newPlan.features,
              notIncluded: newPlan.notIncluded,
              lastModified: new Date().toISOString().split('T')[0]
            }
          : plan
      ));
      setIsEditPlanOpen(false);
      setEditingPlan(null);
    }
  };

  const handleDeletePlan = (planId: string) => {
    if (window.confirm('Are you sure you want to delete this AMC plan?')) {
      setAmcPlans(prev => prev.filter(plan => plan.id !== planId));
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setNewPlan(prev => ({ ...prev, features: [...prev.features, newFeature.trim()] }));
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setNewPlan(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
  };

  const handleAddNotIncluded = () => {
    if (newNotIncluded.trim()) {
      setNewPlan(prev => ({ ...prev, notIncluded: [...prev.notIncluded, newNotIncluded.trim()] }));
      setNewNotIncluded('');
    }
  };

  const handleRemoveNotIncluded = (index: number) => {
    setNewPlan(prev => ({ ...prev, notIncluded: prev.notIncluded.filter((_, i) => i !== index) }));
  };

  const handleSubscriptionStatusChange = (subscriptionId: string, newStatus: string) => {
    setUserSubscriptions(prev => prev.map(sub => 
      sub.id === subscriptionId ? { ...sub, status: newStatus } : sub
    ));
  };

  const handleViewSubscription = (subscription: any) => {
    setSelectedSubscription(subscription);
    setIsViewSubscriptionOpen(true);
  };

  const handleDownloadInvoice = (subscription: any) => {
    // Create a simple invoice content
    const invoiceContent = `
AMC INVOICE
===========

Invoice ID: INV-${subscription.id}
Date: ${new Date().toLocaleDateString()}

Customer Details:
- Name: ${subscription.userName}
- Email: ${subscription.userEmail}

Subscription Details:
- Plan: ${subscription.planName}
- Amount: ₹${subscription.amount}
- Billing Period: Monthly
- Start Date: ${new Date(subscription.startDate).toLocaleDateString()}
- End Date: ${new Date(subscription.endDate).toLocaleDateString()}
- Next Billing: ${new Date(subscription.nextBilling).toLocaleDateString()}

Device Coverage:
- Total Devices: ${subscription.devices}
- Used Devices: ${subscription.usedDevices}

Service History:
- Last Service: ${new Date(subscription.lastService).toLocaleDateString()}
- Next Service: ${new Date(subscription.nextService).toLocaleDateString()}

Home Visits:
- Total: ${subscription.homeVisits.total}
- Used: ${subscription.homeVisits.used}
- Remaining: ${subscription.homeVisits.remaining}

Warranty Claims:
- Total: ${subscription.warrantyClaims.total}
- Used: ${subscription.warrantyClaims.used}
- Remaining: ${subscription.warrantyClaims.remaining}

Days Remaining: ${subscription.daysRemaining}

Thank you for choosing FixFly AMC!
    `;

    // Create and download the file
    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AMC-Invoice-${subscription.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Calculate total stats
  const totalSubscribers = userSubscriptions.filter(sub => sub.status === 'Active').length;
  const totalRevenue = userSubscriptions
    .filter(sub => sub.status === 'Active')
    .reduce((sum, sub) => sum + sub.amount, 0);
  const activePlans = amcPlans.filter(plan => plan.status === 'active').length;

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <main className="ml-72 pt-32 p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                AMC <span className="text-gradient">Management</span>
              </h1>
              <p className="text-muted-foreground">Manage AMC plans and user subscriptions</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Subscribers</p>
                  <p className="text-2xl font-bold">{totalSubscribers}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                  <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Plans</p>
                  <p className="text-2xl font-bold">{activePlans}</p>
                </div>
                <Shield className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="plans" className="space-y-6">
          <TabsList>
            <TabsTrigger value="plans">AMC Plans</TabsTrigger>
            <TabsTrigger value="subscriptions">User Subscriptions</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-6">
            {/* Filters and Search */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search plans..."
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
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Plans Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.map((plan) => (
                <Card key={plan.id} className={`service-card relative ${plan.popular ? 'ring-2 ring-primary' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-4">
                      <Badge className="bg-gradient-tech text-white px-3 py-1 text-xs font-semibold">
                        <Star className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                        {plan.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                    <div className="text-center">
                      <span className="text-2xl font-bold text-primary">₹{plan.price}</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Subscribers</p>
                        <p className="text-lg font-bold">{plan.subscribers}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                        <p className="text-lg font-bold">₹{plan.revenue.toLocaleString()}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-2">Features ({plan.features.length})</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {plan.features.slice(0, 3).map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2 text-xs">
                            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                            <span className="leading-tight">{feature}</span>
                          </div>
                        ))}
                        {plan.features.length > 3 && (
                          <p className="text-xs text-muted-foreground">+{plan.features.length - 3} more...</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleEditPlan(plan)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            {/* Filters and Search */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search subscriptions..."
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
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Subscriptions Table */}
            <Card>
              <CardHeader>
                <CardTitle>User Subscriptions ({filteredSubscriptions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Next Billing</TableHead>
                      <TableHead>Days Left</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{subscription.userName}</p>
                            <p className="text-sm text-muted-foreground">{subscription.userEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{subscription.planName}</Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={subscription.status}
                            onValueChange={(value) => handleSubscriptionStatusChange(subscription.id, value)}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Inactive">Inactive</SelectItem>
                              <SelectItem value="Expired">Expired</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>₹{subscription.amount}</TableCell>
                        <TableCell>
                          {new Date(subscription.nextBilling).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Timer className="h-3 w-3 text-orange-500" />
                            <span className="text-sm">{subscription.daysRemaining}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewSubscription(subscription)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDownloadInvoice(subscription)}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Invoice
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
        </Tabs>

        {/* Edit Plan Dialog */}
        <Dialog open={isEditPlanOpen} onOpenChange={setIsEditPlanOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit AMC Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editPlanName">Plan Name</Label>
                  <Input
                    id="editPlanName"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter plan name"
                  />
                </div>
                <div>
                  <Label htmlFor="editPlanPrice">Price (₹)</Label>
                  <Input
                    id="editPlanPrice"
                    type="number"
                    value={newPlan.price}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="Enter price"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editPlanPeriod">Billing Period</Label>
                  <Select value={newPlan.period} onValueChange={(value) => setNewPlan(prev => ({ ...prev, period: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Monthly</SelectItem>
                      <SelectItem value="year">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editPlanStatus">Status</Label>
                  <Select value={newPlan.status} onValueChange={(value) => setNewPlan(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="editPlanDescription">Description</Label>
                <Textarea
                  id="editPlanDescription"
                  value={newPlan.description}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter plan description"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="editPopular"
                  checked={newPlan.popular}
                  onCheckedChange={(checked) => setNewPlan(prev => ({ ...prev, popular: checked }))}
                />
                <Label htmlFor="editPopular">Mark as Popular</Label>
              </div>

              {/* Features */}
              <div>
                <Label>Features</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Add feature"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                    />
                    <Button onClick={handleAddFeature} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {newPlan.features.map((feature, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                        <span className="text-sm">{feature}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFeature(index)}
                        >
                          <XCircle className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>


              <div className="flex gap-2">
                <Button onClick={handleUpdatePlan} className="flex-1">
                  Update Plan
                </Button>
                <Button variant="outline" onClick={() => setIsEditPlanOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Subscription Dialog */}
        <Dialog open={isViewSubscriptionOpen} onOpenChange={setIsViewSubscriptionOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Subscription Details</DialogTitle>
            </DialogHeader>
            {selectedSubscription && (
              <div className="space-y-6">
                {/* Customer Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                      <p className="text-sm">{selectedSubscription.userName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p className="text-sm">{selectedSubscription.userEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Subscription Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Subscription Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Plan</Label>
                      <p className="text-sm">{selectedSubscription.planName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                      <p className="text-sm">₹{selectedSubscription.amount}/month</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                      <Badge variant={selectedSubscription.status === 'Active' ? 'default' : 'secondary'}>
                        {selectedSubscription.status}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Days Remaining</Label>
                      <p className="text-sm">{selectedSubscription.daysRemaining} days</p>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Important Dates</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Start Date</Label>
                      <p className="text-sm">{new Date(selectedSubscription.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">End Date</Label>
                      <p className="text-sm">{new Date(selectedSubscription.endDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Next Billing</Label>
                      <p className="text-sm">{new Date(selectedSubscription.nextBilling).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Created Date</Label>
                      <p className="text-sm">{new Date(selectedSubscription.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Device Coverage */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Device Coverage</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Devices Used</span>
                      <span className="text-sm font-medium">{selectedSubscription.usedDevices}/{selectedSubscription.devices}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${(selectedSubscription.usedDevices / selectedSubscription.devices) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Service History */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Service History</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Last Service</Label>
                      <p className="text-sm">{new Date(selectedSubscription.lastService).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Next Service</Label>
                      <p className="text-sm">{new Date(selectedSubscription.nextService).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Benefits Usage */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Benefits Usage</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Home Visits */}
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Free Home Visits</Label>
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Used</span>
                          <span className="text-sm font-medium">
                            {selectedSubscription.homeVisits.used}/{selectedSubscription.homeVisits.total}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              selectedSubscription.homeVisits.remaining === 0 
                                ? 'bg-red-500' 
                                : selectedSubscription.homeVisits.remaining <= 1 
                                  ? 'bg-yellow-500' 
                                  : 'bg-blue-500'
                            }`}
                            style={{ width: `${(selectedSubscription.homeVisits.used / selectedSubscription.homeVisits.total) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Remaining: {selectedSubscription.homeVisits.remaining}
                        </p>
                      </div>
                    </div>

                    {/* Warranty Claims */}
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Warranty Claims</Label>
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Used</span>
                          <span className="text-sm font-medium">
                            {selectedSubscription.warrantyClaims.used}/{selectedSubscription.warrantyClaims.total}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              selectedSubscription.warrantyClaims.remaining === 0 
                                ? 'bg-red-500' 
                                : selectedSubscription.warrantyClaims.remaining <= 1 
                                  ? 'bg-yellow-500' 
                                  : 'bg-green-500'
                            }`}
                            style={{ width: `${(selectedSubscription.warrantyClaims.used / selectedSubscription.warrantyClaims.total) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Remaining: {selectedSubscription.warrantyClaims.remaining}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => handleDownloadInvoice(selectedSubscription)} 
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Invoice
                  </Button>
                  <Button variant="outline" onClick={() => setIsViewSubscriptionOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminAMCManagement;
