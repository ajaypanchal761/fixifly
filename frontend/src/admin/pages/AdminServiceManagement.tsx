import React, { useState } from 'react';
import AdminHeader from '../components/AdminHeader';
import { 
  Car, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Wrench,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  DollarSign,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const AdminServiceManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Sample service data - in real app this would come from API
  const services = [
    {
      id: 'S001',
      name: 'AC Repair & Maintenance',
      category: 'Home Appliances',
      description: 'Professional AC repair, maintenance, and installation services',
      basePrice: 500,
      status: 'active',
      totalBookings: 156,
      completedBookings: 142,
      pendingBookings: 14,
      rating: 4.8,
      totalReviews: 89,
      averageDuration: '2-3 hours',
      availableVendors: 12,
      createdAt: '2024-01-15',
      lastUpdated: '2024-02-10'
    },
    {
      id: 'S002',
      name: 'Laptop Repair',
      category: 'Electronics',
      description: 'Complete laptop repair services including hardware and software issues',
      basePrice: 800,
      status: 'active',
      totalBookings: 234,
      completedBookings: 220,
      pendingBookings: 14,
      rating: 4.6,
      totalReviews: 156,
      averageDuration: '1-2 days',
      availableVendors: 8,
      createdAt: '2024-01-20',
      lastUpdated: '2024-02-08'
    },
    {
      id: 'S003',
      name: 'Mobile Phone Repair',
      category: 'Electronics',
      description: 'Screen replacement, battery replacement, and other mobile repairs',
      basePrice: 300,
      status: 'active',
      totalBookings: 445,
      completedBookings: 420,
      pendingBookings: 25,
      rating: 4.7,
      totalReviews: 234,
      averageDuration: '1-2 hours',
      availableVendors: 15,
      createdAt: '2024-01-25',
      lastUpdated: '2024-02-12'
    },
    {
      id: 'S004',
      name: 'Washing Machine Repair',
      category: 'Home Appliances',
      description: 'Washing machine repair and maintenance services',
      basePrice: 400,
      status: 'inactive',
      totalBookings: 78,
      completedBookings: 75,
      pendingBookings: 3,
      rating: 4.3,
      totalReviews: 45,
      averageDuration: '2-4 hours',
      availableVendors: 6,
      createdAt: '2024-02-01',
      lastUpdated: '2024-02-05'
    },
    {
      id: 'S005',
      name: 'Plumbing Services',
      category: 'Home Services',
      description: 'General plumbing repairs, pipe installation, and maintenance',
      basePrice: 350,
      status: 'active',
      totalBookings: 189,
      completedBookings: 175,
      pendingBookings: 14,
      rating: 4.5,
      totalReviews: 98,
      averageDuration: '1-3 hours',
      availableVendors: 10,
      createdAt: '2024-02-05',
      lastUpdated: '2024-02-15'
    }
  ];

  const categories = ['Electronics', 'Home Appliances', 'Home Services', 'Computer & Laptop', 'Mobile Phone', 'AC & Refrigeration', 'Plumbing', 'Electrical'];

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      
      <main className="ml-72 pt-32 p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                Service <span className="text-gradient">Management</span>
              </h1>
              <p className="text-gray-600">Manage and monitor all available services</p>
            </div>
            <div className="flex items-center gap-4">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add New Service
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Services</p>
                  <p className="text-2xl font-bold text-gray-900">{services.length}</p>
                </div>
                <Car className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Services</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {services.filter(s => s.status === 'active').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {services.reduce((sum, s) => sum + s.totalBookings, 0)}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Rating</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(services.reduce((sum, s) => sum + s.rating, 0) / services.length).toFixed(1)}
                  </p>
                </div>
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search services by name, description, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="bookings">Most Bookings</SelectItem>
                  <SelectItem value="rating">Highest Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Services Table */}
        <Card>
          <CardHeader>
            <CardTitle>Services ({filteredServices.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vendors</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{service.name}</p>
                        <p className="text-sm text-gray-500 max-w-xs truncate">{service.description}</p>
                        <p className="text-xs text-gray-400">ID: {service.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{service.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">₹{service.basePrice}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="font-medium">{service.rating}</span>
                        <span className="text-sm text-gray-500">({service.totalReviews})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Total: <span className="font-medium">{service.totalBookings}</span></div>
                        <div>Completed: <span className="font-medium text-green-600">{service.completedBookings}</span></div>
                        <div>Pending: <span className="font-medium text-yellow-600">{service.pendingBookings}</span></div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(service.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{service.availableVendors}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{service.averageDuration}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Service
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Wrench className="w-4 h-4 mr-2" />
                            Manage Vendors
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <DollarSign className="w-4 h-4 mr-2" />
                            Update Pricing
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <XCircle className="w-4 h-4 mr-2" />
                            Deactivate Service
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Service
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminServiceManagement;
