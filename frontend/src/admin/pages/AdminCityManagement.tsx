import React, { useState, useEffect } from 'react';
import AdminHeader from '../components/AdminHeader';
import { 
  Plus, 
  Search, 
  Filter,
  Edit, 
  Trash2, 
  Eye,
  MapPin,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  MoreVertical,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import adminApiService from '@/services/adminApi';
import cityApiService from '@/services/cityApi';

interface City {
  _id: string;
  name: string;
  state: string;
  isActive: boolean;
  serviceCount: number;
  estimatedDeliveryTime: string;
  coverage: {
    pincodes: string[];
    areas: string[];
  };
  pricing: {
    baseServiceFee: number;
    travelFee: number;
    currency: string;
  };
  stats: {
    totalBookings: number;
    activeVendors: number;
    averageRating: number;
  };
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const AdminCityManagement = () => {
  const { toast } = useToast();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddCityOpen, setIsAddCityOpen] = useState(false);
  const [isEditCityOpen, setIsEditCityOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCities: 0,
    hasNext: false,
    hasPrev: false
  });

  // Form state for adding/editing cities
  const [cityForm, setCityForm] = useState({
    name: '',
    state: '',
    isActive: true,
    estimatedDeliveryTime: 'Same Day',
    description: '',
    tags: '',
    baseServiceFee: 0,
    travelFee: 0,
    currency: 'INR'
  });

  // Fetch cities from API
  const fetchCities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: pagination.currentPage,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(stateFilter !== 'all' && { state: stateFilter }),
        ...(statusFilter !== 'all' && { isActive: statusFilter === 'active' })
      };

      const response = await cityApiService.getAllCities(params);
      
      if (response.success) {
        setCities(response.data.cities);
        setPagination(response.data.pagination);
      } else {
        setError(response.message || 'Failed to fetch cities');
      }
    } catch (err: any) {
      console.error('Error fetching cities:', err);
      setError(err.message || 'Failed to fetch cities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, [pagination.currentPage, searchTerm, stateFilter, statusFilter]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Handle filters
  const handleStateFilter = (value: string) => {
    setStateFilter(value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Handle add city
  const handleAddCity = async () => {
    try {
      const cityData = {
        name: cityForm.name,
        state: cityForm.state,
        isActive: true,
        estimatedDeliveryTime: 'Same Day',
        description: '',
        tags: [],
        pricing: {
          baseServiceFee: 0,
          travelFee: 0,
          currency: 'INR'
        },
        coverage: {
          pincodes: [],
          areas: []
        }
      };

      const response = await cityApiService.createCity(cityData);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "City added successfully",
        });
        setIsAddCityOpen(false);
        resetForm();
        fetchCities();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to add city",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      console.error('Error adding city:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to add city",
        variant: "destructive"
      });
    }
  };

  // Handle edit city
  const handleEditCity = (city: City) => {
    setEditingCity(city);
    setCityForm({
      name: city.name,
      state: city.state,
      isActive: city.isActive,
      estimatedDeliveryTime: city.estimatedDeliveryTime,
      description: city.description,
      tags: city.tags.join(', '),
      baseServiceFee: city.pricing.baseServiceFee,
      travelFee: city.pricing.travelFee,
      currency: city.pricing.currency
    });
    setIsEditCityOpen(true);
  };

  const handleUpdateCity = async () => {
    if (!editingCity) return;

    try {
      const cityData = {
        ...cityForm,
        tags: cityForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        pricing: {
          baseServiceFee: cityForm.baseServiceFee,
          travelFee: cityForm.travelFee,
          currency: cityForm.currency
        }
      };

      const response = await cityApiService.updateCity(editingCity._id, cityData);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "City updated successfully",
        });
        setIsEditCityOpen(false);
        setEditingCity(null);
        resetForm();
        fetchCities();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update city",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      console.error('Error updating city:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to update city",
        variant: "destructive"
      });
    }
  };

  // Handle delete city
  const handleDeleteCity = async (cityId: string) => {
    if (!confirm('Are you sure you want to delete this city?')) return;

    try {
      const response = await cityApiService.deleteCity(cityId);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "City deleted successfully",
        });
        fetchCities();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete city",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      console.error('Error deleting city:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to delete city",
        variant: "destructive"
      });
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (cityId: string) => {
    try {
      const response = await cityApiService.toggleCityStatus(cityId);
      
      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "City status updated successfully",
        });
        fetchCities();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update city status",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      console.error('Error toggling city status:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to update city status",
        variant: "destructive"
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setCityForm({
      name: '',
      state: '',
      isActive: true,
      estimatedDeliveryTime: 'Same Day',
      description: '',
      tags: '',
      baseServiceFee: 0,
      travelFee: 0,
      currency: 'INR'
    });
  };

  // Get unique states for filter
  const uniqueStates = Array.from(new Set(cities.map(city => city.state)));

  if (loading && cities.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <main className="ml-72 pt-32 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <main className="ml-72 pt-32 p-6">
        <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">City Management</h1>
          <p className="text-muted-foreground">Manage service cities and coverage areas</p>
        </div>
        <Dialog open={isAddCityOpen} onOpenChange={setIsAddCityOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add City
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New City</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">City Name</Label>
                <Input
                  id="name"
                  value={cityForm.name}
                  onChange={(e) => setCityForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter city name"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={cityForm.state}
                  onChange={(e) => setCityForm(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="Enter state name"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddCityOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCity}>
                  Add City
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search cities..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={stateFilter} onValueChange={handleStateFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {uniqueStates.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchCities}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cities.map((city) => (
          <Card key={city._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-semibold">{city.name}</h3>
                    <p className="text-sm text-muted-foreground">{city.state}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleEditCity(city)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleStatus(city._id)}>
                      {city.isActive ? (
                        <>
                          <ToggleLeft className="w-4 h-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <ToggleRight className="w-4 h-4 mr-2" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteCity(city._id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant={city.isActive ? "default" : "secondary"}>
                    {city.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
            disabled={!pagination.hasPrev}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
            disabled={!pagination.hasNext}
          >
            Next
          </Button>
        </div>
      )}

      {/* Edit City Dialog */}
      <Dialog open={isEditCityOpen} onOpenChange={setIsEditCityOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit City</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">City Name</Label>
              <Input
                id="edit-name"
                value={cityForm.name}
                onChange={(e) => setCityForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter city name"
              />
            </div>
            <div>
              <Label htmlFor="edit-state">State</Label>
              <Input
                id="edit-state"
                value={cityForm.state}
                onChange={(e) => setCityForm(prev => ({ ...prev, state: e.target.value }))}
                placeholder="Enter state name"
              />
            </div>
            <div>
              <Label htmlFor="edit-estimatedDeliveryTime">Estimated Delivery Time</Label>
              <Select
                value={cityForm.estimatedDeliveryTime}
                onValueChange={(value) => setCityForm(prev => ({ ...prev, estimatedDeliveryTime: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Same Day">Same Day</SelectItem>
                  <SelectItem value="Next Day">Next Day</SelectItem>
                  <SelectItem value="2-3 Days">2-3 Days</SelectItem>
                  <SelectItem value="1 Week">1 Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={cityForm.description}
                onChange={(e) => setCityForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter city description"
              />
            </div>
            <div>
              <Label htmlFor="edit-tags">Tags (comma separated)</Label>
              <Input
                id="edit-tags"
                value={cityForm.tags}
                onChange={(e) => setCityForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="Enter tags separated by commas"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-baseServiceFee">Base Service Fee</Label>
                <Input
                  id="edit-baseServiceFee"
                  type="number"
                  value={cityForm.baseServiceFee}
                  onChange={(e) => setCityForm(prev => ({ ...prev, baseServiceFee: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="edit-travelFee">Travel Fee</Label>
                <Input
                  id="edit-travelFee"
                  type="number"
                  value={cityForm.travelFee}
                  onChange={(e) => setCityForm(prev => ({ ...prev, travelFee: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-isActive"
                checked={cityForm.isActive}
                onChange={(e) => setCityForm(prev => ({ ...prev, isActive: e.target.checked }))}
              />
              <Label htmlFor="edit-isActive">Active</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditCityOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateCity}>
                Update City
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
        </div>
      </main>
    </div>
  );
};

export default AdminCityManagement;
