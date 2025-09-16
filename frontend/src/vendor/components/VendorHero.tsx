import { Button } from "@/vendor/components/ui/button";
import { Users, TrendingUp, Clock, Shield, Star, Plus, CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMediaQuery, useTheme } from "@mui/material";

const VendorHero = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStat, setCurrentStat] = useState(0);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [activeTaskTab, setActiveTaskTab] = useState('new');
  const [completedTasks, setCompletedTasks] = useState([]);
  const [taskData, setTaskData] = useState({
    new: [
      { 
        id: 1, caseId: "CASE-001", title: "Laptop Screen Repair", customer: "John Doe", 
        phone: "+91 98765 43210", amount: "₹2,500", date: "15 Dec 2024", time: "10:30 AM", 
        status: "Emergency", address: "123 MG Road, Bangalore, Karnataka 560001",
        issue: "Screen cracked and not displaying properly. Need immediate replacement.",
        assignDate: "15 Dec 2024", assignTime: "9:00 AM"
      },
      { 
        id: 2, caseId: "CASE-002", title: "Desktop Motherboard Issue", customer: "Jane Smith", 
        phone: "+91 87654 32109", amount: "₹4,200", date: "15 Dec 2024", time: "2:15 PM", 
        status: "Repeat", address: "456 Brigade Road, Bangalore, Karnataka 560025",
        issue: "Motherboard not booting. Previously repaired but issue recurring.",
        assignDate: "15 Dec 2024", assignTime: "1:00 PM"
      },
      { 
        id: 3, caseId: "CASE-003", title: "Printer Not Working", customer: "Mike Johnson", 
        phone: "+91 76543 21098", amount: "₹1,800", date: "14 Dec 2024", time: "9:45 AM", 
        status: "Normal", address: "789 Koramangala, Bangalore, Karnataka 560034",
        issue: "Printer not responding to print commands. Paper jam issue.",
        assignDate: "14 Dec 2024", assignTime: "8:30 AM"
      }
    ],
    closed: [
      { 
        id: 4, caseId: "CASE-004", title: "Laptop Screen Repair", customer: "John Doe", 
        phone: "+91 98765 43210", amount: "₹2,500", date: "15 Dec 2024", time: "10:30 AM", 
        status: "Completed", address: "123 MG Road, Bangalore, Karnataka 560001",
        issue: "Screen cracked and not displaying properly. Need immediate replacement.",
        assignDate: "15 Dec 2024", assignTime: "9:00 AM"
      },
      { 
        id: 5, caseId: "CASE-005", title: "Desktop Motherboard Issue", customer: "Jane Smith", 
        phone: "+91 87654 32109", amount: "₹4,200", date: "15 Dec 2024", time: "2:15 PM", 
        status: "Completed", address: "456 Brigade Road, Bangalore, Karnataka 560025",
        issue: "Motherboard not booting. Previously repaired but issue recurring.",
        assignDate: "15 Dec 2024", assignTime: "1:00 PM"
      },
      { 
        id: 6, caseId: "CASE-006", title: "Printer Not Working", customer: "Mike Johnson", 
        phone: "+91 76543 21098", amount: "₹1,800", date: "14 Dec 2024", time: "9:45 AM", 
        status: "Completed", address: "789 Koramangala, Bangalore, Karnataka 560034",
        issue: "Printer not responding to print commands. Paper jam issue.",
        assignDate: "14 Dec 2024", assignTime: "8:30 AM"
      },
      ...completedTasks
    ],
    cancelled: [
      { 
        id: 7, caseId: "CASE-007", title: "Refrigerator Repair", customer: "Tom Wilson", 
        phone: "+91 32109 87654", amount: "₹3,200", date: "13 Dec 2024", time: "4:15 PM", 
        status: "Cancelled", address: "147 Jayanagar, Bangalore, Karnataka 560011",
        issue: "Refrigerator not cooling. Food spoilage risk.",
        assignDate: "13 Dec 2024", assignTime: "3:00 PM"
      },
      { 
        id: 8, caseId: "CASE-008", title: "Microwave Service", customer: "Emma Taylor", 
        phone: "+91 21098 76543", amount: "₹1,500", date: "11 Dec 2024", time: "10:00 AM", 
        status: "Cancelled", address: "258 Banashankari, Bangalore, Karnataka 560070",
        issue: "Microwave not heating food properly. Previous repair didn't work.",
        assignDate: "11 Dec 2024", assignTime: "9:00 AM"
      },
      { 
        id: 9, caseId: "CASE-009", title: "AC Installation", customer: "Robert Kim", 
        phone: "+91 10987 65432", amount: "₹8,500", date: "10 Dec 2024", time: "2:00 PM", 
        status: "Cancelled", address: "369 Malleswaram, Bangalore, Karnataka 560003",
        issue: "New AC installation required for bedroom.",
        assignDate: "10 Dec 2024", assignTime: "1:00 PM"
      }
    ]
  });
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const banners = ['/banner1.png', '/banner2.png', '/banner3.png'];

  const vendorStats = [
    { icon: Users, value: "500+", label: "Active Customers", color: "bg-blue-500" },
    { icon: TrendingUp, value: "₹2.5L+", label: "Monthly Revenue", color: "bg-green-500" },
    { icon: Star, value: "4.8", label: "Average Rating", color: "bg-yellow-500" },
    { icon: Clock, value: "24/7", label: "Support Available", color: "bg-purple-500" }
  ];



  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % vendorStats.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Handle URL tab parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab && ['new', 'closed', 'cancelled'].includes(tab)) {
      setActiveTaskTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000); // Change banner every 5 seconds

    return () => clearInterval(interval);
  }, [banners.length]);

  // Listen for completed tasks from localStorage or other sources
  useEffect(() => {
    const handleTaskCompleted = (event) => {
      const completedTask = event.detail;
      setCompletedTasks(prev => [...prev, completedTask]);
    };

    window.addEventListener('taskCompleted', handleTaskCompleted);
    return () => window.removeEventListener('taskCompleted', handleTaskCompleted);
  }, []);

  // Listen for rescheduled tasks
  useEffect(() => {
    const handleTaskRescheduled = (event) => {
      const rescheduledTask = event.detail;
      
      setTaskData(prevData => {
        const newData = { ...prevData };
        
        // Find and update the task in the appropriate tab
        Object.keys(newData).forEach(tabKey => {
          const taskIndex = newData[tabKey].findIndex(task => task.id === rescheduledTask.id);
          if (taskIndex !== -1) {
            // Update the task with new date, time, and status
            newData[tabKey][taskIndex] = {
              ...newData[tabKey][taskIndex],
              date: rescheduledTask.date,
              time: rescheduledTask.time,
              status: rescheduledTask.status,
              rescheduleReason: rescheduledTask.rescheduleReason,
              originalDate: rescheduledTask.originalDate,
              originalTime: rescheduledTask.originalTime,
              rescheduledAt: rescheduledTask.rescheduledAt
            };
          }
        });
        
        return newData;
      });
    };

    window.addEventListener('taskRescheduled', handleTaskRescheduled);
    return () => window.removeEventListener('taskRescheduled', handleTaskRescheduled);
  }, []);

  // Only show hero section on mobile devices
  if (!isMobile) {
    return null;
  }

  return (
    <section className="relative flex items-start justify-center overflow-hidden min-h-[30vh] sm:min-h-[35vh] mb-8">
      {/* Background Gradient */}
      <div className="absolute bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 opacity-50" />
      
      <div className="container mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="grid lg:grid-cols-2 gap-1 items-start">
          {/* Banner Slideshow - Shows first on mobile */}
          <div className="relative animate-fade-in-delay order-1 mb-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-3xl opacity-20 animate-pulse" />
              <div className="relative rounded-3xl overflow-hidden">
                <div className="relative w-full h-auto">
                  {banners.map((banner, index) => (
                    <img 
                      key={index}
                      src={banner} 
                      alt={`Fixifly Banner ${index + 1}`} 
                      className={`w-full h-auto rounded-3xl shadow-2xl transition-opacity duration-1000 ${
                        index === currentBanner ? 'opacity-100' : 'opacity-0 absolute top-0 left-0'
                      }`}
                    />
                  ))}
                </div>
                {/* Banner Indicators */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentBanner(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentBanner ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="text-center lg:text-left animate-slide-up order-2 lg:w-full lg:pr-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Welcome to Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"><span className="text-3xl font-bold text-gradient mb-8 md:hidden text-center"> Vendor Portal</span></span>
            </h1>
            
            {/* Task Blocks */}
            <div className="-mt-4 space-y-4">
              {/* Task Tabs */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTaskTab('new')}
                  className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-md font-medium text-sm transition-all duration-200 ${
                    activeTaskTab === 'new'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Task({taskData.new.length})</span>
                </button>
                <button
                  onClick={() => setActiveTaskTab('closed')}
                  className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-md font-medium text-sm transition-all duration-200 ${
                    activeTaskTab === 'closed'
                      ? 'bg-green-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Closed ({taskData.closed.length})</span>
                </button>
                <button
                  onClick={() => setActiveTaskTab('cancelled')}
                  className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-md font-medium text-sm transition-all duration-200 ${
                    activeTaskTab === 'cancelled'
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancelled ({taskData.cancelled.length})</span>
                </button>
              </div>

              {/* Task List */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-3">
                  <h3 className="text-base font-semibold text-gray-800 mb-3 capitalize">
                    {activeTaskTab === 'new' && 'New Tasks'}
                    {activeTaskTab === 'closed' && 'Closed Tasks'}
                    {activeTaskTab === 'cancelled' && 'Cancelled Tasks'}
                  </h3>
                  <div className="space-y-2">
                    {taskData[activeTaskTab as keyof typeof taskData].map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors border border-gray-100">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-gray-800 text-sm truncate">{task.title}</h4>
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                              {task.caseId}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <span>{task.date}</span>
                            <span>•</span>
                            <span>{task.time}</span>
                            {task.status !== 'Normal' && (
                              <>
                                <span>•</span>
                                <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                                  task.status === 'Emergency' 
                                    ? 'bg-red-100 text-red-800' 
                                    : task.status === 'Repeat'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {task.status}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            // Navigate to different pages based on task status
                            if (activeTaskTab === 'closed') {
                              navigate(`/vendor/task/${task.id}/closed`);
                            } else if (activeTaskTab === 'cancelled') {
                              navigate(`/vendor/task/${task.id}/cancelled`);
                            } else {
                              navigate(`/vendor/task/${task.id}`);
                            }
                          }}
                          className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors ml-2 flex-shrink-0"
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VendorHero;
