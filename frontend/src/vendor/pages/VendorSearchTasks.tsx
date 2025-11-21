import React, { useState } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import { ArrowLeft, Search, Clock, MapPin, User, Phone, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VendorBottomNav from '../components/VendorBottomNav';
import Footer from '../../components/Footer';
import NotFound from '../../pages/NotFound';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const VendorSearchTasks = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Show 404 error on desktop - must be before any other hooks
  // Show 404 error on desktop
  if (!isMobile) {
    return <NotFound />;
  }

  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Sample task data - in real app this would come from API
  const sampleTasks = [
    {
      id: "CASE-2024-001",
      taskName: "AC Repair - Sector 15",
      customerName: "Rajesh Kumar",
      phone: "+91 98765 43210",
      address: "Sector 15, Gurgaon, Haryana",
      date: "2024-01-15",
      time: "10:00 AM",
      status: "Pending",
      priority: "High"
    },
    {
      id: "CASE-2024-002", 
      taskName: "Washing Machine Service",
      customerName: "Priya Sharma",
      phone: "+91 98765 43211",
      address: "Pitampura, Delhi",
      date: "2024-01-16",
      time: "2:00 PM",
      status: "In Progress",
      priority: "Medium"
    },
    {
      id: "CASE-2024-003",
      taskName: "Refrigerator Repair",
      customerName: "Amit Singh",
      phone: "+91 98765 43212",
      address: "Sector 62, Noida",
      date: "2024-01-17",
      time: "11:00 AM",
      status: "Completed",
      priority: "Low"
    }
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setIsSearching(true);
      // Simulate API call delay
      setTimeout(() => {
        const results = sampleTasks.filter(task => 
          task.id.toLowerCase().includes(query.toLowerCase()) ||
          task.taskName.toLowerCase().includes(query.toLowerCase()) ||
          task.customerName.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(results);
        setIsSearching(false);
      }, 500);
    } else {
      setSearchResults([]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 border-red-200";
      case "Medium":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Custom Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Search Tasks</h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
      </div>

      <main className="flex-1 pb-24">
        <div className="container mx-auto px-4 py-4">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by Case ID or Task Name"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 h-12 text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Search Results */}
          {searchQuery.trim() && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                {isSearching ? 'Searching...' : `${searchResults.length} result(s) found`}
              </p>
            </div>
          )}

          {/* Results List */}
          {searchQuery.trim() && !isSearching && (
            <div className="space-y-3">
              {searchResults.length > 0 ? (
                searchResults.map((task) => (
                  <Card key={task.id} className="shadow-sm border-0 bg-white">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">{task.taskName}</h3>
                          <p className="text-xs text-gray-500 mt-1">Case ID: {task.id}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(task.status)}>
                            {task.status}
                          </Badge>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{task.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{task.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{task.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{task.date} at {task.time}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">No tasks found</h3>
                  <p className="text-sm text-gray-400">
                    Try searching with a different Case ID or Task Name
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!searchQuery.trim() && (
            <div className="text-center py-12">
              <Search className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">Search for tasks</h3>
              <p className="text-sm text-gray-400">
                Enter Case ID or Task Name to find specific tasks
              </p>
            </div>
          )}
        </div>
      </main>
      <div className="md:hidden">
        <Footer />
        <VendorBottomNav />
      </div>
    </div>
  );
};

export default VendorSearchTasks;
