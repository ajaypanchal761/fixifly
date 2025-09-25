import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '../components/AdminHeader';
import adminApiService from '@/services/adminApi';
import ServiceProviderCard, { ServiceProviderCardData } from '../components/ServiceProviderCard';
import { 
  CreditCard, 
  Plus, 
  Upload, 
  Edit, 
  Trash2, 
  Eye,
  Search, 
  Filter,
  Image as ImageIcon,
  Grid3X3,
  List,
  Save,
  X,
  DollarSign,
  User,
  Briefcase
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

const AdminCardManagement = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [specialityFilter, setSpecialityFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Card data from API
  const [cards, setCards] = useState<ServiceProviderCardData[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCards: 0,
    hasNext: false,
    hasPrev: false
  });

  // Sample specialities
  const specialities = [
    'Electronics Repair',
    'Plumbing Services',
    'AC Repair',
    'Home Appliance',
    'IT Services',
    'Carpentry',
    'Electrical Work'
  ];

  const [newCard, setNewCard] = useState({
    name: '',
    speciality: '',
    subtitle: '',
    price: '',
    image: null as File | string | null
  });

  // Fetch cards from API
  const fetchCards = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Debug: Check admin authentication status
      const adminToken = localStorage.getItem('adminToken');
      const adminData = localStorage.getItem('adminData');
      
      console.log('Admin authentication debug:', {
        hasToken: !!adminToken,
        hasAdminData: !!adminData,
        tokenLength: adminToken?.length || 0,
        adminData: adminData ? JSON.parse(adminData) : null
      });
      
      if (!adminToken || !adminData) {
        setError('Admin not authenticated. Please login again.');
        setLoading(false);
        // Redirect to admin login
        navigate('/admin/login');
        return;
      }
      
      // Validate token format
      if (typeof adminToken !== 'string' || adminToken.trim() === '') {
        setError('Invalid admin token. Please login again.');
        setLoading(false);
        navigate('/admin/login');
        return;
      }
      
      const requestParams = {
        page: pagination.currentPage || 1,
        limit: 20,
        search: searchTerm || undefined,
        speciality: specialityFilter !== 'all' ? specialityFilter : undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };
      
      console.log('Request params:', requestParams);
      console.log('Request params type:', typeof requestParams);
      console.log('Request params is null:', requestParams === null);
      console.log('Request params is undefined:', requestParams === undefined);
      console.log('Pagination state:', pagination);
      console.log('Pagination currentPage:', pagination.currentPage);
      console.log('Search term:', searchTerm);
      console.log('Speciality filter:', specialityFilter);
      
      const response = await adminApiService.getCards(requestParams);
      
      if (response && response.data) {
        console.log('Setting cards:', response.data.cards);
        console.log('Setting pagination:', response.data.pagination);
        setCards(response.data.cards || []);
        setPagination(response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalCards: 0,
          hasNext: false,
          hasPrev: false
        });
      } else {
        console.error('Invalid response structure:', response);
        setCards([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalCards: 0,
          hasNext: false,
          hasPrev: false
        });
      }
    } catch (err: any) {
      console.error('Error fetching cards:', err);
      
      // Handle authentication errors
      if (err.message && err.message.includes('not authenticated')) {
        setError('Admin not authenticated. Please login again.');
        // Clear invalid tokens
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        // Redirect to login
        navigate('/admin/login');
        return;
      }
      
      // Set a more user-friendly error message
      const errorMessage = err.message || 'Failed to load cards';
      setError(errorMessage);
      
      // If it's a network error, suggest checking the server
      if (errorMessage.includes('Network error')) {
        console.log('Please ensure the backend server is running on http://localhost:5000');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('AdminCardManagement useEffect triggered');
    console.log('Current state:', { searchTerm, specialityFilter, currentPage: pagination.currentPage });
    fetchCards();
  }, [searchTerm, specialityFilter, pagination.currentPage]);

  const filteredCards = cards; // Cards are already filtered by API
  
  // Debug: Log current cards state
  console.log('Current cards state:', cards);
  console.log('Filtered cards:', filteredCards);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      setNewCard(prev => ({ ...prev, image: imageFile }));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewCard(prev => ({ ...prev, image: file }));
    }
  };

  const handleAddCard = async () => {
    console.log('handleAddCard called');
    console.log('Form data:', newCard);
    console.log('isEditMode:', isEditMode);
    console.log('Validation check:', {
      name: !!newCard.name,
      speciality: !!newCard.speciality,
      subtitle: !!newCard.subtitle,
      price: !!newCard.price,
      image: !!newCard.image,
      isEditMode: isEditMode
    });
    
    if (newCard.name && newCard.speciality && newCard.subtitle && newCard.price) {
      try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('name', newCard.name);
        formData.append('speciality', newCard.speciality);
        formData.append('subtitle', newCard.subtitle);
        formData.append('price', newCard.price);
        
        // Add image file if it exists
        if (newCard.image instanceof File) {
          formData.append('profileImage', newCard.image);
        } else if (!newCard.image && !isEditMode) {
          // Only require image for new cards, not when editing
          alert('Please select an image');
          return;
        }

        if (isEditMode && editingCardId) {
          // Update existing card
          await adminApiService.updateCardWithFile(editingCardId, formData);
          console.log('Card updated successfully');
        } else {
          // Create new card
          await adminApiService.createCardWithFile(formData);
          console.log('Card created successfully');
        }
        
        // Reset form and close modal
        setNewCard({
          name: '',
          speciality: '',
          subtitle: '',
          price: '',
          image: null
        });
        setIsAddCardOpen(false);
        setIsEditMode(false);
        setEditingCardId(null);
        
        // Refresh cards list
        fetchCards();
      } catch (err: any) {
        console.error('Error saving card:', err);
        alert(err.message || `Failed to ${isEditMode ? 'update' : 'create'} card`);
      }
    } else {
      console.log('Form validation failed - missing required fields');
      const missingFields = [];
      if (!newCard.name) missingFields.push('Name');
      if (!newCard.speciality) missingFields.push('Speciality');
      if (!newCard.subtitle) missingFields.push('Subtitle');
      if (!newCard.price) missingFields.push('Price');
      // Image is now optional with default
      
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
    }
  };

  const handleEditCard = (card: ServiceProviderCardData) => {
    setNewCard({
      name: card.name,
      speciality: card.speciality,
      subtitle: card.subtitle,
      price: card.price.toString(),
      image: card.image // Keep the current image (could be URL or File)
    });
    setIsEditMode(true);
    setEditingCardId(card._id);
    setIsAddCardOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddCardOpen(false);
    setIsEditMode(false);
    setEditingCardId(null);
    setNewCard({
      name: '',
      speciality: '',
      subtitle: '',
      price: '',
      image: null
    });
  };

  const handleDeleteCard = async (cardId: string) => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      try {
        await adminApiService.deleteCard(cardId);
        fetchCards(); // Refresh cards list
      } catch (err: any) {
        console.error('Error deleting card:', err);
        alert(err.message || 'Failed to delete card');
      }
    }
  };

  const toggleCardStatus = async (cardId: string, currentStatus?: string) => {
    try {
      await adminApiService.toggleCardStatus(cardId);
      fetchCards(); // Refresh cards list
    } catch (err: any) {
      console.error('Error toggling card status:', err);
      alert(err.message || 'Failed to toggle card status');
    }
  };

  const togglePopularStatus = async (cardId: string, currentPopular: boolean) => {
    try {
      await adminApiService.togglePopularStatus(cardId);
      fetchCards(); // Refresh cards list
    } catch (err: any) {
      console.error('Error toggling popular status:', err);
      alert(err.message || 'Failed to toggle popular status');
    }
  };

  const toggleFeaturedStatus = async (cardId: string, currentFeatured: boolean) => {
    try {
      await adminApiService.toggleFeaturedStatus(cardId);
      fetchCards(); // Refresh cards list
    } catch (err: any) {
      console.error('Error toggling featured status:', err);
      alert(err.message || 'Failed to toggle featured status');
    }
  };

  const setSelectedCard = (card: ServiceProviderCardData) => {
    // This function can be used to show card details in a modal
    console.log('Selected card:', card);
    // You can implement a modal or detailed view here
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <main className="ml-72 pt-32 p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <CreditCard className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                    Card <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Management</span>
                  </h1>
                  <p className="text-gray-600 mt-1">Manage service provider cards and their details</p>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{cards.filter(card => card.status === 'active').length} Active</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>{cards.filter(card => card.isPopular).length} Popular</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>{cards.filter(card => card.isFeatured).length} Featured</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-12 px-6 rounded-xl"
                onClick={() => {
                  console.log('Add Card button clicked');
                  setIsEditMode(false);
                  setEditingCardId(null);
                  setIsAddCardOpen(true);
                }}
              >
                <Plus className="w-5 h-5 mr-2" />
                Add New Card
              </Button>
              
              <Dialog open={isAddCardOpen} onOpenChange={(open) => {
                if (!open) {
                  handleCloseModal();
                }
              }}>
                <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto mt-16">
                  <DialogHeader>
                    <DialogTitle>
                      {isEditMode ? 'Edit Service Provider Card' : 'Add New Service Provider Card'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="cardName">Provider Name</Label>
                      <Input
                        id="cardName"
                        value={newCard.name}
                        onChange={(e) => setNewCard(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter provider name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="cardSpeciality">Speciality</Label>
                      <Select value={newCard.speciality} onValueChange={(value) => setNewCard(prev => ({ ...prev, speciality: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select speciality" />
                        </SelectTrigger>
                        <SelectContent>
                          {specialities.map(speciality => (
                            <SelectItem key={speciality} value={speciality}>
                              {speciality}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="cardSubtitle">Subtitle</Label>
                      <Input
                        id="cardSubtitle"
                        value={newCard.subtitle}
                        onChange={(e) => setNewCard(prev => ({ ...prev, subtitle: e.target.value }))}
                        placeholder="Enter service subtitle"
                      />
                    </div>

                    <div>
                      <Label htmlFor="cardPrice">Price (₹)</Label>
                      <Input
                        id="cardPrice"
                        type="number"
                        value={newCard.price}
                        onChange={(e) => setNewCard(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="Enter service price"
                      />
                    </div>

                    <div>
                      <Label>Provider Image</Label>
                      <div
                        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                          dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        {newCard.image ? (
                          <div className="space-y-2">
                            <img
                              src={newCard.image instanceof File ? URL.createObjectURL(newCard.image) : newCard.image}
                              alt="Provider preview"
                              className="w-24 h-24 object-cover rounded mx-auto"
                            />
                            <p className="text-sm text-muted-foreground">
                              {newCard.image instanceof File ? newCard.image.name : 'Current image'}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setNewCard(prev => ({ ...prev, image: null }))}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              Drag & drop provider image here or click to browse
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Browse
                            </Button>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleFileInput}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => {
                          console.log('Submit button clicked');
                          console.log('Current form state:', newCard);
                          handleAddCard();
                        }} 
                        className="flex-1"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isEditMode ? 'Update Card' : 'Add Card'}
                      </Button>
                      <Button variant="outline" onClick={handleCloseModal}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8 shadow-sm border-0 bg-gradient-to-r from-white to-gray-50">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search cards by name or speciality..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                  />
                </div>
              </div>
              
              {/* Speciality Filter */}
              <div className="w-full lg:w-64">
                <Select value={specialityFilter} onValueChange={setSpecialityFilter}>
                  <SelectTrigger className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                    <Filter className="w-4 h-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Filter by speciality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specialities</SelectItem>
                    {specialities.map(speciality => (
                      <SelectItem key={speciality} value={speciality}>
                        {speciality}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-12 px-4 rounded-xl"
                >
                  <Grid3X3 className="w-4 h-4 mr-2" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-12 px-4 rounded-xl"
                >
                  <List className="w-4 h-4 mr-2" />
                  List
                </Button>
              </div>
            </div>
            
            {/* Results Summary */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-4">
                  <span className="font-medium">
                    {pagination.totalCards} total cards
                  </span>
                  {searchTerm && (
                    <span className="text-blue-600">
                      Filtered by: "{searchTerm}"
                    </span>
                  )}
                  {specialityFilter !== 'all' && (
                    <span className="text-blue-600">
                      Speciality: {specialityFilter}
                    </span>
                  )}
                </div>
                <div className="text-gray-500">
                  {viewMode === 'grid' ? 'Grid View' : 'List View'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards Display */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Cards</h3>
              <p className="text-gray-600">Please wait while we fetch your service provider cards...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="p-4 bg-red-50 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Cards</h3>
              <p className="text-red-600 mb-6">{error}</p>
              <Button 
                onClick={fetchCards} 
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
              >
                Try Again
              </Button>
            </div>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="p-4 bg-gray-50 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Cards Found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || specialityFilter !== 'all' 
                  ? 'No cards match your current filters. Try adjusting your search criteria.'
                  : 'You haven\'t created any service provider cards yet. Get started by adding your first card.'
                }
              </p>
              <Button 
                onClick={() => {
                  setIsEditMode(false);
                  setEditingCardId(null);
                  setIsAddCardOpen(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Card
              </Button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {filteredCards.map((card) => (
                <ServiceProviderCard
                  key={card._id}
                  card={card}
                  onEdit={handleEditCard}
                  onDelete={handleDeleteCard}
                  onToggleStatus={toggleCardStatus}
                  onTogglePopular={togglePopularStatus}
                  onToggleFeatured={toggleFeaturedStatus}
                  viewMode="grid"
                />
              ))}
            </div>
            
            {/* Pagination for Grid View */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                    disabled={!pagination.hasPrev}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={pagination.currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPagination(prev => ({ ...prev, currentPage: pageNum }))}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                    disabled={!pagination.hasNext}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Service Provider Cards ({filteredCards.length})</h3>
                <div className="text-sm text-muted-foreground">
                  Showing {((pagination.currentPage - 1) * 20) + 1} to {Math.min(pagination.currentPage * 20, pagination.totalCards)} of {pagination.totalCards} cards
                </div>
              </div>
              <div className="space-y-4">
                {filteredCards.map((card) => (
                  <ServiceProviderCard
                    key={card._id}
                    card={card}
                    onEdit={handleEditCard}
                    onDelete={handleDeleteCard}
                    onToggleStatus={toggleCardStatus}
                    onTogglePopular={togglePopularStatus}
                    onToggleFeatured={toggleFeaturedStatus}
                    viewMode="list"
                  />
                ))}
              </div>
            </div>
            
            {/* Pagination for List View */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                    disabled={!pagination.hasPrev}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={pagination.currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPagination(prev => ({ ...prev, currentPage: pageNum }))}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                    disabled={!pagination.hasNext}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminCardManagement;
