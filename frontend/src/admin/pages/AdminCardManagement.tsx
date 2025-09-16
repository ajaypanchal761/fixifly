import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '../components/AdminHeader';
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
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample card data
  const [cards, setCards] = useState([
    {
      id: 'C001',
      name: 'John Smith',
      speciality: 'Electronics Repair',
      price: 1500,
      image: '/electrician.jpg',
      status: 'active',
      rating: 4.8,
      completedJobs: 125
    },
    {
      id: 'C002',
      name: 'Sarah Johnson',
      speciality: 'Plumbing Services',
      price: 2000,
      image: '/plumber.png',
      status: 'active',
      rating: 4.9,
      completedJobs: 98
    },
    {
      id: 'C003',
      name: 'Mike Wilson',
      speciality: 'AC Repair',
      price: 1800,
      image: '/ac.png',
      status: 'inactive',
      rating: 4.7,
      completedJobs: 76
    }
  ]);

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
    price: '',
    image: null as File | null
  });

  const filteredCards = cards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.speciality.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpeciality = specialityFilter === 'all' || card.speciality === specialityFilter;
    return matchesSearch && matchesSpeciality;
  });

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

  const handleAddCard = () => {
    if (newCard.name && newCard.speciality && newCard.price && newCard.image) {
      const card = {
        id: `C${String(cards.length + 1).padStart(3, '0')}`,
        name: newCard.name,
        speciality: newCard.speciality,
        price: parseInt(newCard.price),
        image: URL.createObjectURL(newCard.image),
        status: 'active',
        rating: 0,
        completedJobs: 0
      };
      
      setCards(prev => [...prev, card]);
      setNewCard({
        name: '',
        speciality: '',
        price: '',
        image: null
      });
      setIsAddCardOpen(false);
    }
  };

  const handleEditCard = (card: any) => {
    setNewCard({
      name: card.name,
      speciality: card.speciality,
      price: card.price.toString(),
      image: null
    });
    setIsAddCardOpen(true);
  };

  const handleDeleteCard = (cardId: string) => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      setCards(prev => prev.filter(card => card.id !== cardId));
    }
  };

  const toggleCardStatus = (cardId: string) => {
    setCards(prev => prev.map(card => 
      card.id === cardId 
        ? { ...card, status: card.status === 'active' ? 'inactive' : 'active' }
        : card
    ));
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <main className="ml-72 pt-32 p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                Card <span className="text-gradient">Management</span>
              </h1>
              <p className="text-muted-foreground">Manage service provider cards and their details</p>
            </div>
            <div className="flex items-center gap-4">
              <Dialog open={isAddCardOpen} onOpenChange={setIsAddCardOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Card
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Service Provider Card</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
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
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                          dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        {newCard.image ? (
                          <div className="space-y-2">
                            <img
                              src={URL.createObjectURL(newCard.image)}
                              alt="Provider preview"
                              className="w-32 h-32 object-cover rounded mx-auto"
                            />
                            <p className="text-sm text-muted-foreground">{newCard.image.name}</p>
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
                      <Button onClick={handleAddCard} className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        Add Card
                      </Button>
                      <Button variant="outline" onClick={() => setIsAddCardOpen(false)}>
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
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search cards by name or speciality..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={specialityFilter} onValueChange={setSpecialityFilter}>
                <SelectTrigger className="w-full md:w-48">
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
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCards.map((card) => (
              <Card key={card.id} className="service-card hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="aspect-square mb-4 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    <img
                      src={card.image}
                      alt={card.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{card.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {card.speciality}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-green-600">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold">₹{card.price}</span>
                      </div>
                      <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>
                        {card.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>⭐ {card.rating}</span>
                      <span>{card.completedJobs} jobs</span>
                    </div>

                    <div className="space-y-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full text-xs"
                        onClick={() => handleEditCard(card)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 text-xs"
                          onClick={() => toggleCardStatus(card.id)}
                        >
                          {card.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteCard(card.id)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Service Provider Cards ({filteredCards.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Speciality</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCards.map((card) => (
                    <TableRow key={card.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={card.image}
                            alt={card.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div>
                            <p className="font-medium text-foreground">{card.name}</p>
                            <p className="text-sm text-muted-foreground">{card.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{card.speciality}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-green-600">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-semibold">₹{card.price}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>
                          {card.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>⭐</span>
                          <span>{card.rating}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditCard(card)}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => toggleCardStatus(card.id)}
                          >
                            {card.status === 'active' ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteCard(card.id)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default AdminCardManagement;
