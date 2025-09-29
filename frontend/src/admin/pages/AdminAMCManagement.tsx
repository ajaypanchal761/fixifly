import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '../components/AdminHeader';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
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
  MoreHorizontal,
  RefreshCw,
  Save,
  UserPlus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import EditAMCPlanModal from '@/components/EditAMCPlanModal';
import { updateAdminAMCPlan, getAdminAMCPlans, seedAdminAMCPlans, getAMCPlans, createAdminAMCPlan, getAdminAMCSubscriptions, updateAdminAMCSubscriptionStatus } from '@/services/amcApiService';
import adminApiService from '@/services/adminApi';

// Edit Subscription Form Component
const EditSubscriptionForm = ({ subscription, onSave, onCancel }: any) => {
  const [formData, setFormData] = useState({
    remoteSupportUsed: subscription?.usage?.remoteSupport?.used || 0,
    remoteSupportLimit: subscription?.usage?.remoteSupport?.limit || 'unlimited',
    homeVisitsUsed: subscription?.usage?.homeVisits?.used || 0,
    homeVisitsLimit: subscription?.usage?.homeVisits?.limit || 1,
    warrantyClaimsUsed: subscription?.usage?.warrantyClaims?.used || 0,
    warrantyClaimsLimit: subscription?.usage?.warrantyClaims?.limit || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      subscriptionId: subscription.subscriptionId || subscription._id,
      usage: {
        remoteSupport: {
          used: parseInt(formData.remoteSupportUsed),
          limit: formData.remoteSupportLimit === 'unlimited' ? 'unlimited' : parseInt(formData.remoteSupportLimit)
        },
        homeVisits: {
          used: parseInt(formData.homeVisitsUsed),
          limit: parseInt(formData.homeVisitsLimit)
        },
        warrantyClaims: {
          used: parseInt(formData.warrantyClaimsUsed),
          limit: parseInt(formData.warrantyClaimsLimit)
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Remote Support */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Headphones className="h-5 w-5" />
            Remote Support
          </h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="remoteSupportUsed">Used</Label>
              <Input
                id="remoteSupportUsed"
                type="number"
                min="0"
                value={formData.remoteSupportUsed}
                onChange={(e) => setFormData({...formData, remoteSupportUsed: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="remoteSupportLimit">Limit</Label>
              <Select
                value={formData.remoteSupportLimit}
                onValueChange={(value) => setFormData({...formData, remoteSupportLimit: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unlimited">Unlimited</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Home Visits */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Home className="h-5 w-5" />
            Home Visits
          </h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="homeVisitsUsed">Used</Label>
              <Input
                id="homeVisitsUsed"
                type="number"
                min="0"
                value={formData.homeVisitsUsed}
                onChange={(e) => setFormData({...formData, homeVisitsUsed: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="homeVisitsLimit">Limit</Label>
              <Input
                id="homeVisitsLimit"
                type="number"
                min="1"
                value={formData.homeVisitsLimit}
                onChange={(e) => setFormData({...formData, homeVisitsLimit: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Warranty Claims */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Warranty Claims
          </h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="warrantyClaimsUsed">Used</Label>
              <Input
                id="warrantyClaimsUsed"
                type="number"
                min="0"
                value={formData.warrantyClaimsUsed}
                onChange={(e) => setFormData({...formData, warrantyClaimsUsed: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="warrantyClaimsLimit">Limit</Label>
              <Input
                id="warrantyClaimsLimit"
                type="number"
                min="0"
                value={formData.warrantyClaimsLimit}
                onChange={(e) => setFormData({...formData, warrantyClaimsLimit: e.target.value})}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          Update Subscription
        </Button>
      </div>
    </form>
  );
};

const AdminAMCManagement = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [isViewSubscriptionOpen, setIsViewSubscriptionOpen] = useState(false);
  const [isEditSubscriptionOpen, setIsEditSubscriptionOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [editingSubscription, setEditingSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [subscriptionsError, setSubscriptionsError] = useState(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);

  // AMC plans data - will be fetched from API
  const [amcPlans, setAmcPlans] = useState([]);

  // User subscriptions data
  const [userSubscriptions, setUserSubscriptions] = useState([]);

  // Warranty claims data
  const [warrantyClaims, setWarrantyClaims] = useState([]);
  const [warrantyClaimsLoading, setWarrantyClaimsLoading] = useState(false);
  const [warrantyClaimsError, setWarrantyClaimsError] = useState(null);
  
  // Issue details modal
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);

  // Vendor assignment modal
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [selectedClaimForVendor, setSelectedClaimForVendor] = useState<any>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState('');

  // Function to approve warranty claim
  const handleApproveWarrantyClaim = async (claimId: string) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await adminApiService.makeAuthenticatedRequest(`${API_BASE_URL}/admin/warranty-claims/${claimId}/approve`, {
        method: 'PUT',
        body: JSON.stringify({
          adminNotes: 'Warranty claim approved'
        })
      });

      const responseData = await response.json();
      
      if (responseData.success) {
        // Refresh warranty claims
        await fetchWarrantyClaims();
        console.log('Warranty claim approved successfully');
      } else {
        throw new Error(responseData.message || 'Failed to approve warranty claim');
      }
    } catch (error: any) {
      console.error('Error approving warranty claim:', error);
    }
  };

  // Function to reject warranty claim
  const handleRejectWarrantyClaim = async (claimId: string) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await adminApiService.makeAuthenticatedRequest(`${API_BASE_URL}/admin/warranty-claims/${claimId}/reject`, {
        method: 'PUT',
        body: JSON.stringify({
          rejectionReason: 'Warranty claim rejected by admin'
        })
      });

      const responseData = await response.json();
      
      if (responseData.success) {
        // Refresh warranty claims
        await fetchWarrantyClaims();
        console.log('Warranty claim rejected successfully');
      } else {
        throw new Error(responseData.message || 'Failed to reject warranty claim');
      }
    } catch (error: any) {
      console.error('Error rejecting warranty claim:', error);
    }
  };

  // Function to fetch vendors
  const fetchVendors = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      console.log('Fetching vendors from:', `${API_BASE_URL}/admin/vendors`);
      
      const response = await adminApiService.makeAuthenticatedRequest(`${API_BASE_URL}/admin/vendors`, {
        method: 'GET'
      });

      console.log('Vendors API response status:', response.status);
      const responseData = await response.json();
      console.log('Vendors API response data:', responseData);
      
      if (responseData.success && responseData.data && Array.isArray(responseData.data.vendors)) {
        console.log('Vendors fetched successfully:', responseData.data.vendors.length, 'vendors');
        setVendors(responseData.data.vendors);
      } else {
        console.warn('No vendors found or invalid response format:', responseData);
        setVendors([]);
      }
    } catch (error: any) {
      console.error('Error fetching vendors:', error);
      setVendors([]);
    }
  };

  // Function to handle vendor assignment
  const handleAssignVendor = async () => {
    if (!selectedVendorId || !selectedClaimForVendor) {
      console.error('Vendor ID or claim not selected');
      return;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await adminApiService.makeAuthenticatedRequest(`${API_BASE_URL}/admin/warranty-claims/${selectedClaimForVendor._id}/assign-vendor`, {
        method: 'PUT',
        body: JSON.stringify({
          vendorId: selectedVendorId
        })
      });

      const responseData = await response.json();
      
      if (responseData.success) {
        // Refresh warranty claims
        await fetchWarrantyClaims();
        // Close modal and reset state
        setIsVendorModalOpen(false);
        setSelectedClaimForVendor(null);
        setSelectedVendorId('');
        console.log('Vendor assigned successfully and notification sent');
        // You can add a toast notification here if you have a toast system
        alert('Vendor assigned successfully! Notification sent to vendor.');
      } else {
        throw new Error(responseData.message || 'Failed to assign vendor');
      }
    } catch (error: any) {
      console.error('Error assigning vendor:', error);
    }
  };

  // Function to open vendor assignment modal
  const handleOpenVendorModal = (claim: any) => {
    setSelectedClaimForVendor(claim);
    setIsVendorModalOpen(true);
    fetchVendors();
  };

  // Function to complete warranty claim
  const handleCompleteWarrantyClaim = async (claimId: string) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await adminApiService.makeAuthenticatedRequest(`${API_BASE_URL}/admin/warranty-claims/${claimId}/complete`, {
        method: 'PUT',
        body: JSON.stringify({
          completionNotes: 'Warranty claim completed successfully'
        })
      });

      const responseData = await response.json();
      
      if (responseData.success) {
        // Refresh warranty claims
        await fetchWarrantyClaims();
        console.log('Warranty claim completed successfully');
      } else {
        throw new Error(responseData.message || 'Failed to complete warranty claim');
      }
    } catch (error: any) {
      console.error('Error completing warranty claim:', error);
    }
  };

  // Function to view issue details
  const handleViewIssue = (claim: any) => {
    setSelectedClaim(claim);
    setIsIssueModalOpen(true);
  };

  // Function to fetch warranty claims from backend
  const fetchWarrantyClaims = async () => {
    try {
      setWarrantyClaimsLoading(true);
      setWarrantyClaimsError(null);
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await adminApiService.makeAuthenticatedRequest(`${API_BASE_URL}/admin/warranty-claims`, {
        method: 'GET'
      });

      const responseData = await response.json();
      
      if (responseData.success) {
        const claims = responseData.data?.claims || responseData.data || [];
        setWarrantyClaims(Array.isArray(claims) ? claims : []);
        console.log('Warranty claims fetched:', claims);
      } else {
        throw new Error(responseData.message || 'Failed to fetch warranty claims');
      }
    } catch (error: any) {
      console.error('Error fetching warranty claims:', error);
      setWarrantyClaimsError(error.message);
      setWarrantyClaims([]);
    } finally {
      setWarrantyClaimsLoading(false);
    }
  };

  // Function to fetch subscriptions from backend
  const fetchSubscriptions = async () => {
    try {
      setSubscriptionsLoading(true);
      setSubscriptionsError(null);
      
      const response = await getAdminAMCSubscriptions({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchTerm || undefined
      });
      
      if (response.success) {
        // Handle different possible response structures
        const subscriptions = response.data?.subscriptions || response.data || response.subscriptions || [];
        const subscriptionsArray = Array.isArray(subscriptions) ? subscriptions : [];
        
        console.log('Raw API response:', response);
        console.log('Extracted subscriptions:', subscriptionsArray);
        console.log('First subscription sample:', subscriptionsArray[0]);
        
        // Fetch user details for each subscription
        setUserDetailsLoading(true);
        const subscriptionsWithUserDetails = await Promise.all(
          subscriptionsArray.map(async (subscription) => {
            try {
              // Handle populated user document directly (no extra request)
              if (subscription.userId && typeof subscription.userId === 'object' && (subscription.userId.name || subscription.userId.email || subscription.userId.phone)) {
                return {
                  ...subscription,
                  userDetails: {
                    id: subscription.userId._id || subscription.userId.id,
                    name: subscription.userId.name || subscription.userName || 'Unknown User',
                    email: subscription.userId.email || subscription.userEmail || 'N/A',
                    phone: subscription.userId.phone || subscription.userPhone || 'N/A',
                    isEmailVerified: !!subscription.userId.isEmailVerified,
                    isPhoneVerified: !!subscription.userId.isPhoneVerified,
                    profileImage: subscription.userId.profileImage || null
                  }
                };
              }

              // Check for different possible user ID field names (string IDs)
              const userId = (
                typeof subscription.userId === 'string' ? subscription.userId :
                subscription.user || 
                subscription.user_id || 
                subscription.customerId ||
                subscription.customer_id ||
                subscription.customer
              );

              if (userId && typeof userId === 'string') {
                // Fetch user details when only ID is present
                const userResponse = await adminApiService.getUser(userId);
                if (userResponse.success && userResponse.data?.user) {
                  return { ...subscription, userDetails: userResponse.data.user };
                }
              }

              // Fallback: synthesize user details from subscription document fields
              return {
                ...subscription,
                userDetails: {
                  id: (typeof subscription.userId === 'string' ? subscription.userId : (subscription.userId?._id || subscription.id)),
                  name: subscription.userName || subscription.name || subscription.customerName || 'Unknown User',
                  email: subscription.userEmail || subscription.email || subscription.customerEmail || 'N/A',
                  phone: subscription.userPhone || subscription.phoneNumber || subscription.number || subscription.phone || subscription.customerPhone || subscription.mobile || 'N/A',
                  isEmailVerified: false,
                  isPhoneVerified: false,
                  profileImage: null
                },
                // Set remote support limits based on plan type
                remoteSupportLimit: subscription.planName === 'TRY PLAN' ? 3 : 
                                  subscription.planName === 'CARE PLAN' ? 'unlimited' : 
                                  subscription.planName === 'RELAX PLAN' ? 'unlimited' : 
                                  subscription.usage?.remoteSupport?.limit || 'unlimited',
                remoteSupportUsed: subscription.usage?.remoteSupport?.used || 0
              };
            } catch (error) {
              console.error('Error preparing user details for subscription:', subscription.id || subscription._id, error);
              return subscription;
            }
          })
        );
        
        setUserDetailsLoading(false);
        
        // Apply remote support limits to all subscriptions
        const subscriptionsWithLimits = subscriptionsWithUserDetails.map(subscription => {
          console.log('Processing subscription for limits:', {
            id: subscription.id || subscription._id,
            planName: subscription.planName,
            userPhone: subscription.userPhone,
            userEmail: subscription.userEmail,
            userName: subscription.userName,
            userDetails: subscription.userDetails,
            allKeys: Object.keys(subscription)
          });
          
          return {
            ...subscription,
            // Set remote support limits based on plan type
            remoteSupportLimit: subscription.planName === 'TRY PLAN' ? 3 : 
                              subscription.planName === 'CARE PLAN' ? 'unlimited' : 
                              subscription.planName === 'RELAX PLAN' ? 'unlimited' : 
                              subscription.usage?.remoteSupport?.limit || 'unlimited',
            remoteSupportUsed: subscription.usage?.remoteSupport?.used || 0,
            // Set home visits limits based on plan type
            homeVisitsLimit: subscription.planName === 'TRY PLAN' ? 1 : 
                            subscription.planName === 'CARE PLAN' ? 6 : 
                            subscription.planName === 'RELAX PLAN' ? 12 : 
                            subscription.usage?.homeVisits?.limit || 0,
            homeVisitsUsed: subscription.usage?.homeVisits?.used || 0
          };
        });
        
        // If no subscriptions found, create some test data for demonstration
        if (subscriptionsWithLimits.length === 0) {
          console.log('No subscriptions found, creating test data...');
          const testSubscriptions = [
            {
              id: 'test-1',
              planName: 'TRY PLAN',
              planType: 'Test',
              amount: 19,
              quantity: 1,
              status: 'active',
              startDate: '2025-09-24',
              endDate: '2026-09-24',
              warrantyClaimed: false,
              phoneNumber: '+91 9876543210',
              userEmail: 'test@example.com',
              userName: 'Test User',
              remoteSupportLimit: 3,
              remoteSupportUsed: 1,
              homeVisitsLimit: 1,
              homeVisitsUsed: 0,
              userDetails: {
                id: 'test-user-1',
                name: 'Test User',
                email: 'test@example.com',
                phone: '+91 9876543210',
                isEmailVerified: true,
                isPhoneVerified: true,
                profileImage: null
              }
            },
            {
              id: 'test-2',
              planName: 'CARE PLAN',
              planType: 'Premium',
              amount: 59,
              quantity: 1,
              status: 'active',
              startDate: '2025-01-15',
              endDate: '2026-01-15',
              warrantyClaimed: true,
              phoneNumber: '+91 9876543211',
              userEmail: 'john.doe@example.com',
              userName: 'John Doe',
              remoteSupportLimit: 'unlimited',
              remoteSupportUsed: 5,
              homeVisitsLimit: 6,
              homeVisitsUsed: 2,
              softwareInstallation: true, // CARE PLAN includes software installation
              antivirus: true, // CARE PLAN includes antivirus
              userDetails: {
                id: 'test-user-2',
                name: 'John Doe',
                email: 'john.doe@example.com',
                phone: '+91 9876543211',
                isEmailVerified: true,
                isPhoneVerified: false,
                profileImage: null
              }
            },
            {
              id: 'test-3',
              planName: 'RELAX PLAN',
              planType: 'Premium',
              amount: 99,
              quantity: 1,
              status: 'active',
              startDate: '2025-02-01',
              endDate: '2026-02-01',
              warrantyClaimed: false,
              phoneNumber: '+91 9876543212',
              userEmail: 'jane.doe@example.com',
              userName: 'Jane Doe',
              remoteSupportLimit: 'unlimited',
              remoteSupportUsed: 3,
              homeVisitsLimit: 12,
              homeVisitsUsed: 1,
              softwareInstallation: true, // RELAX PLAN includes software installation
              antivirus: true, // RELAX PLAN includes antivirus
              userDetails: {
                id: 'test-user-3',
                name: 'Jane Doe',
                email: 'jane.doe@example.com',
                phone: '+91 9876543212',
                isEmailVerified: true,
                isPhoneVerified: true,
                profileImage: null
              }
            }
          ];
          setUserSubscriptions(testSubscriptions);
        } else {
          setUserSubscriptions(subscriptionsWithLimits);
        }
      } else {
        setSubscriptionsError(response.message || 'Failed to fetch subscriptions');
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setSubscriptionsError(error.message || 'Failed to fetch subscriptions');
    } finally {
      setSubscriptionsLoading(false);
      setUserDetailsLoading(false);
    }
  };

  // Function to create missing plans in database
  const createMissingPlans = async () => {
    try {
      console.log('Creating missing plans in database...');
      
      // Create CARE PLAN
      const carePlanData = {
        name: 'CARE PLAN',
        price: 59,
        period: 'yearly',
        description: 'Comprehensive AMC plan with advanced features and support',
        shortDescription: 'Advanced AMC plan with premium features',
        features: [
          { title: 'Unlimited Call Support', description: '24/7 phone support for all your queries' },
          { title: 'Unlimited Remote Support', description: 'Unlimited remote assistance sessions' },
          { title: 'Free Antivirus Pro For 1 Year', description: 'Premium antivirus protection included' },
          { title: '6 Free Home Visits', description: 'Six complimentary home visits for service' },
          { title: 'Free Software Installation & Driver Updates', description: 'Complete software support and installation' },
          { title: 'Up to 40% Off on All Spare Parts', description: 'Significant discounts on spare parts' }
        ],
        benefits: {
          callSupport: 'unlimited',
          remoteSupport: 'unlimited',
          homeVisits: { count: 6, description: '6 Free Home Visits' },
          antivirus: { included: true, name: 'Antivirus Pro' },
          softwareInstallation: { included: true },
          sparePartsDiscount: { percentage: 40 },
          freeSpareParts: { amount: 0 },
          laborCost: { included: false }
        },
        status: 'active',
        isPopular: true,
        sortOrder: 2,
        validityPeriod: 365,
        tags: ['premium', 'popular', 'comprehensive']
      };

      // Create RELAX PLAN
      const relaxPlanData = {
        name: 'RELAX PLAN',
        price: 199,
        period: 'yearly',
        description: 'Premium AMC plan with all-inclusive features and maximum benefits',
        shortDescription: 'Premium AMC plan with maximum benefits',
        features: [
          { title: 'Unlimited Call Support', description: '24/7 phone support for all your queries' },
          { title: 'Unlimited Remote Support', description: 'Unlimited remote assistance sessions' },
          { title: 'Free Quick Heal Pro Antivirus For 1 Year', description: 'Premium antivirus protection for 1 year' },
          { title: 'Free Windows MS Office Installation with Software Support', description: 'Complete software support and installation' },
          { title: '12 Free Home Visits and Diagnosis', description: 'Twelve complimentary home visits for service' },
          { title: 'No Labor Cost for 1 Year', description: 'All labor charges included for one year' },
          { title: 'Free Spare Parts up to ₹2000', description: 'Complimentary spare parts worth ₹2000' },
          { title: 'Up to 60% Off on Premium Spare Parts', description: 'Maximum discounts on premium parts' }
        ],
        benefits: {
          callSupport: 'unlimited',
          remoteSupport: 'unlimited',
          homeVisits: { count: 12, description: '12 Free Home Visits and Diagnosis' },
          antivirus: { included: true, name: 'Quick Heal Pro' },
          softwareInstallation: { included: true },
          sparePartsDiscount: { percentage: 60 },
          freeSpareParts: { amount: 2000 },
          laborCost: { included: true }
        },
        status: 'active',
        isPopular: false,
        sortOrder: 3,
        validityPeriod: 365,
        tags: ['premium', 'all-inclusive', 'maximum-benefits']
      };

      // Try to create plans (this will fail if not authenticated, but that's okay)
      try {
        await createAdminAMCPlan(carePlanData);
        console.log('CARE PLAN created successfully');
      } catch (error) {
        console.log('Could not create CARE PLAN (authentication required):', error.message);
      }

      try {
        await createAdminAMCPlan(relaxPlanData);
        console.log('RELAX PLAN created successfully');
      } catch (error) {
        console.log('Could not create RELAX PLAN (authentication required):', error.message);
      }

    } catch (error) {
      console.log('Error creating missing plans:', error.message);
    }
  };

  // Fetch AMC plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        
        // Try public API first (no authentication required)
        let response = await getAMCPlans();
        
        if (response.success && response.data && response.data.plans.length > 0) {
          console.log('Fetched plans from public API:', response.data.plans.length);
          
          // If we only have 1 plan, try to create missing plans and add them locally
          if (response.data.plans.length === 1) {
            console.log('Only 1 plan found, creating missing plans...');
            
            // Try to create missing plans in database
            await createMissingPlans();
            
            // Add missing plans locally
            const existingPlan = response.data.plans[0];
            const allPlans = [
              existingPlan,
              {
                _id: 'temp-care-plan',
                name: 'CARE PLAN',
                price: 59,
                period: 'yearly',
                description: 'Comprehensive AMC plan with advanced features and support',
                shortDescription: 'Advanced AMC plan with premium features',
                features: [
                  { title: 'Unlimited Call Support', description: '24/7 phone support for all your queries' },
                  { title: 'Unlimited Remote Support', description: 'Unlimited remote assistance sessions' },
                  { title: 'Free Antivirus Pro For 1 Year', description: 'Premium antivirus protection included' },
                  { title: '6 Free Home Visits', description: 'Six complimentary home visits for service' },
                  { title: 'Free Software Installation & Driver Updates', description: 'Complete software support and installation' },
                  { title: 'Up to 40% Off on All Spare Parts', description: 'Significant discounts on spare parts' }
                ],
                benefits: {
                  callSupport: 'unlimited',
                  remoteSupport: 'unlimited',
                  homeVisits: { count: 6, description: '6 Free Home Visits' },
                  antivirus: { included: true, name: 'Antivirus Pro' },
                  softwareInstallation: { included: true },
                  sparePartsDiscount: { percentage: 40 },
                  freeSpareParts: { amount: 0 },
                  laborCost: { included: false }
                },
                status: 'active',
                isPopular: true,
                sortOrder: 2,
                validityPeriod: 365,
                tags: ['premium', 'popular', 'comprehensive']
              },
              {
                _id: 'temp-relax-plan',
                name: 'RELAX PLAN',
                price: 199,
                period: 'yearly',
                description: 'Premium AMC plan with all-inclusive features and maximum benefits',
                shortDescription: 'Premium AMC plan with maximum benefits',
                features: [
                  { title: 'Unlimited Call Support', description: '24/7 phone support for all your queries' },
                  { title: 'Unlimited Remote Support', description: 'Unlimited remote assistance sessions' },
                  { title: 'Free Quick Heal Pro Antivirus For 1 Year', description: 'Premium antivirus protection for 1 year' },
                  { title: 'Free Windows MS Office Installation with Software Support', description: 'Complete software support and installation' },
                  { title: '12 Free Home Visits and Diagnosis', description: 'Twelve complimentary home visits for service' },
                  { title: 'No Labor Cost for 1 Year', description: 'All labor charges included for one year' },
                  { title: 'Free Spare Parts up to ₹2000', description: 'Complimentary spare parts worth ₹2000' },
                  { title: 'Up to 60% Off on Premium Spare Parts', description: 'Maximum discounts on premium parts' }
                ],
                benefits: {
                  callSupport: 'unlimited',
                  remoteSupport: 'unlimited',
                  homeVisits: { count: 12, description: '12 Free Home Visits and Diagnosis' },
                  antivirus: { included: true, name: 'Quick Heal Pro' },
                  softwareInstallation: { included: true },
                  sparePartsDiscount: { percentage: 60 },
                  freeSpareParts: { amount: 2000 },
                  laborCost: { included: true }
                },
                status: 'active',
                isPopular: false,
                sortOrder: 3,
                validityPeriod: 365,
                tags: ['premium', 'all-inclusive', 'maximum-benefits']
              }
            ];
            setAmcPlans(allPlans);
          } else {
            setAmcPlans(response.data.plans);
          }
        } else {
          // Fallback to admin API if public API fails
          console.log('Public API failed, trying admin API...');
          response = await getAdminAMCPlans();
          
          if (response.success && response.data && response.data.plans.length > 0) {
            console.log('Fetched plans from admin API:', response.data.plans.length);
            setAmcPlans(response.data.plans);
          } else {
            console.log('No plans found, seeding database...');
            const seedResponse = await seedAdminAMCPlans();
            if (seedResponse.success) {
              const fetchResponse = await getAMCPlans();
              if (fetchResponse.success && fetchResponse.data) {
                setAmcPlans(fetchResponse.data.plans);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching AMC plans:', error);
        // Fallback to static data if API completely fails
        setAmcPlans([
          {
            _id: 'temp-try-plan',
            name: 'TRY PLAN',
            price: 17,
            period: 'yearly',
            description: 'Perfect for getting started with basic AMC coverage',
            features: [
              { title: 'Unlimited Call Support', description: '24/7 phone support for all your queries' },
              { title: '3 Remote Support Sessions', description: 'Get help remotely for your devices' },
              { title: '1 Free Home Visit & Diagnosis', description: 'One complimentary home visit for diagnosis' },
              { title: 'Free Hidden Tips & Tricks', description: 'Access to exclusive maintenance tips' }
            ],
            benefits: {
              callSupport: 'unlimited',
              remoteSupport: 'limited',
              homeVisits: { count: 1, description: '1 Free Home Visit & Diagnosis' },
              antivirus: { included: false },
              softwareInstallation: { included: false },
              sparePartsDiscount: { percentage: 0 },
              freeSpareParts: { amount: 0 },
              laborCost: { included: false }
            },
            status: 'active',
            isPopular: false,
            validityPeriod: 365,
            tags: ['basic', 'starter', 'budget']
          },
          {
            _id: 'temp-care-plan',
            name: 'CARE PLAN',
            price: 59,
            period: 'yearly',
            description: 'Comprehensive AMC plan with advanced features and support',
            features: [
              { title: 'Unlimited Call Support', description: '24/7 phone support for all your queries' },
              { title: 'Unlimited Remote Support', description: 'Get unlimited remote assistance for your devices' },
              { title: 'Free Antivirus Pro For 1 Year', description: 'Complete antivirus protection for one year' },
              { title: '6 Free Home Visits', description: 'Six complimentary home visits for diagnosis and repair' },
              { title: 'Free Software Installation & Driver Updates', description: 'Complete software setup and driver management' },
              { title: 'Up to 40% Off on All Spare Parts', description: 'Significant discount on all spare parts and components' }
            ],
            benefits: {
              callSupport: 'unlimited',
              remoteSupport: 'unlimited',
              homeVisits: { count: 6, description: '6 Free Home Visits' },
              antivirus: { included: true, name: 'Antivirus Pro' },
              softwareInstallation: { included: true },
              sparePartsDiscount: { percentage: 40 },
              freeSpareParts: { amount: 0 },
              laborCost: { included: false }
            },
            status: 'active',
            isPopular: true,
            validityPeriod: 365,
            tags: ['comprehensive', 'popular', 'advanced']
          },
          {
            _id: 'temp-relax-plan',
            name: 'RELAX PLAN',
            price: 199,
            period: 'yearly',
            description: 'Premium AMC plan with all-inclusive features and maximum benefits',
            features: [
              { title: 'Unlimited Call Support', description: '24/7 phone support for all your queries' },
              { title: 'Unlimited Remote Support', description: 'Get unlimited remote assistance for your devices' },
              { title: 'Free Quick Heal Pro Antivirus For 1 Year', description: 'Premium antivirus protection for one year' },
              { title: 'Free Windows MS Office Installation with Software Support', description: 'Complete Microsoft Office setup and support' },
              { title: '12 Free Home Visits and Diagnosis', description: 'Twelve complimentary home visits for diagnosis and repair' },
              { title: 'No Labor Cost for 1 Year', description: 'All labor costs covered for the entire year' },
              { title: 'Free Spare Parts up to ₹2000', description: 'Free spare parts worth up to ₹2000' },
              { title: 'Up to 60% Off on Premium Spare Parts', description: 'Maximum discount on premium spare parts and components' }
            ],
            benefits: {
              callSupport: 'unlimited',
              remoteSupport: 'unlimited',
              homeVisits: { count: 12, description: '12 Free Home Visits and Diagnosis' },
              antivirus: { included: true, name: 'Quick Heal Pro' },
              softwareInstallation: { included: true },
              sparePartsDiscount: { percentage: 60 },
              freeSpareParts: { amount: 2000 },
              laborCost: { included: true }
            },
            status: 'active',
            isPopular: false,
            validityPeriod: 365,
            tags: ['premium', 'all-inclusive', 'maximum-benefits']
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // Fetch subscriptions when component mounts or filters change
  useEffect(() => {
    fetchSubscriptions();
    fetchWarrantyClaims();
  }, [statusFilter, searchTerm]);

  const [newPlan, setNewPlan] = useState({
    name: '',
    price: '',
    period: 'month',
    description: '',
    popular: false,
    status: 'active',
    features: [],
    notIncluded: []
  });

  const [newFeature, setNewFeature] = useState('');
  const [newNotIncluded, setNewNotIncluded] = useState('');

  // Filter plans based on search and status
  const filteredPlans = amcPlans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || plan.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredSubscriptions = userSubscriptions.filter(sub => {
    if (!sub) return false;
    
    const matchesSearch = (sub.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (sub.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (sub.planName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (sub.status || '').toLowerCase() === statusFilter;
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
        features: newPlan.features,
        notIncluded: newPlan.notIncluded
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
    const completePlan = {
      id: plan._id || plan.id, // Use _id from database
      name: plan.name,
      price: plan.price,
      period: plan.period,
      description: plan.description || '',
      shortDescription: plan.shortDescription || '',
      features: plan.features || [],
      benefits: plan.benefits || {
        callSupport: 'unlimited',
        remoteSupport: 'unlimited',
        homeVisits: { count: 1, description: 'Free Home Visit & Diagnosis' },
        antivirus: { included: false },
        softwareInstallation: { included: false },
        sparePartsDiscount: { percentage: 0 },
        freeSpareParts: { amount: 0 },
        laborCost: { included: false }
      },
      status: plan.status || 'active',
      isPopular: plan.isPopular || false,
      validityPeriod: plan.validityPeriod || 365,
      tags: plan.tags || []
    };
    
    setEditingPlan(completePlan);
    setIsEditPlanOpen(true);
  };

  const handleSavePlan = async (planData: any) => {
    try {
      console.log('Saving plan:', planData);
      
      // Check if this is a temporary plan (not in database)
      if (planData.id.startsWith('temp-')) {
        console.log('This is a temporary plan, creating it in database...');
        
        // Create the plan in database
        const planToCreate = {
          name: planData.name,
          price: planData.price,
          period: planData.period,
          description: planData.description,
          shortDescription: planData.shortDescription,
          features: planData.features,
          benefits: planData.benefits,
          status: planData.status,
          isPopular: planData.isPopular,
          validityPeriod: planData.validityPeriod,
          tags: planData.tags
        };
        
        try {
          const createResponse = await createAdminAMCPlan(planToCreate);
          
          if (createResponse.success) {
            console.log('Temporary plan created in database successfully:', createResponse.data);
            
            // Refresh the plans from the database
            const fetchResponse = await getAMCPlans();
            if (fetchResponse.success && fetchResponse.data) {
              setAmcPlans(fetchResponse.data.plans);
            }
            
            alert('Plan created and saved to database successfully! Changes will be reflected on user pages.');
          } else {
            throw new Error(createResponse.message || 'Failed to create plan in database');
          }
        } catch (createError: any) {
          console.error('Error creating plan in database:', createError);
          
          // If creation fails, fallback to local state update
          console.log('Falling back to local state update...');
          setAmcPlans(prev => prev.map(plan => 
            plan._id === planData.id || plan.id === planData.id 
              ? { ...plan, ...planData } 
              : plan
          ));
          
          alert(`Plan updated locally. Database creation failed: ${createError.message}`);
        }
        return;
      }
      
      // For real database plans, use the API
      const response = await updateAdminAMCPlan(planData.id, planData);
      
      if (response.success) {
        console.log('Plan updated successfully:', response.data);
        // Refresh the plans from the database using public API
        const fetchResponse = await getAMCPlans();
        if (fetchResponse.success && fetchResponse.data) {
          setAmcPlans(fetchResponse.data.plans);
        }
        alert('Plan updated successfully! Changes will be reflected on user pages.');
      } else {
        throw new Error(response.message || 'Failed to update plan');
      }
    } catch (error: any) {
      console.error('Error updating plan:', error);
      alert(`Error updating plan: ${error.message}`);
      throw error;
    }
  };

  const handleUpdatePlan = () => {
    if (editingPlan && newPlan.name && newPlan.price && newPlan.description) {
      setAmcPlans(prev => prev.map(plan => 
        plan.id === editingPlan.id 
          ? { ...plan, ...newPlan, price: parseInt(newPlan.price) }
          : plan
      ));
      setIsEditPlanOpen(false);
      setEditingPlan(null);
    }
  };

  const handleDeletePlan = (planId: string) => {
    setAmcPlans(prev => prev.filter(plan => plan.id !== planId));
  };

  const handleViewSubscription = (subscription: any) => {
    setSelectedSubscription(subscription);
    setIsViewSubscriptionOpen(true);
  };

  const handleUpdateSubscriptionStatus = async (subscriptionId: string, status: string) => {
    try {
      const response = await updateAdminAMCSubscriptionStatus(subscriptionId, status, 'Status updated by admin');
      
      if (response.success) {
        // Update local state
    setUserSubscriptions(prev => prev.map(sub => 
      sub.id === subscriptionId ? { ...sub, status } : sub
    ));
      } else {
        console.error('Failed to update subscription status:', response.message);
      }
    } catch (error) {
      console.error('Error updating subscription status:', error);
    }
  };

  const handleEditSubscription = (subscription: any) => {
    setEditingSubscription(subscription);
    setIsEditSubscriptionOpen(true);
  };

  const handleUpdateSubscription = async (updatedData: any) => {
    try {
      const subscriptionId = editingSubscription._id || editingSubscription.id;
      const url = `${API_BASE_URL}/amc/admin/subscriptions/${subscriptionId}/usage`;
      
      const response = await adminApiService.makeAuthenticatedRequest(url, {
        method: 'PUT',
        body: JSON.stringify({
          usage: updatedData.usage
        })
      });

      const responseData = await response.json();

      if (responseData.success) {
        // Close modal and refresh data
        setIsEditSubscriptionOpen(false);
        await fetchSubscriptions();
        
        // Show success message
        console.log('Subscription updated successfully');
      } else {
        throw new Error(responseData.message || 'Failed to update subscription');
      }
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      // Show error message
      console.error('Failed to update subscription:', error.message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <main className="ml-72 pt-32 p-6 pb-16">
        {/* Page Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">
                AMC <span className="text-gradient">Management</span>
              </h1>
              <p className="text-sm text-muted-foreground">Manage AMC plans and user subscriptions</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="plans" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="plans">AMC Plans</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscription Management</TabsTrigger>
          </TabsList>
          <TabsContent value="plans" className="space-y-4 pt-0">
            {/* AMC Plans Cards */}
            <div className="grid md:grid-cols-3 gap-4 items-stretch mt-6">
              {amcPlans.map((plan, index) => (
                <Card key={plan._id || plan.id} className={`relative border-2 hover:shadow-lg transition-shadow flex flex-col h-full ${plan.isPopular ? 'border-blue-500' : ''}`}>
                  {plan.isPopular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-500 text-white px-3 py-1 text-xs font-semibold">
                        <Star className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className={`text-center pb-3 ${plan.isPopular ? 'pt-4' : ''}`}>
                    <CardTitle className="text-lg font-bold text-gray-800">{plan.name}</CardTitle>
                    <p className="text-xs text-gray-600 mt-1">{plan.description}</p>
                    <div className="mt-3">
                      <span className="text-2xl font-bold text-blue-600">₹{plan.price}</span>
                      <span className="text-sm text-gray-500">/{plan.period}</span>
                    </div>
                  </CardHeader>
                
                  <CardContent className="flex flex-col flex-grow p-4">
                    <div className="space-y-2 flex-grow">
                      {plan.features && plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center space-x-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-xs">
                            {typeof feature === 'string' ? feature : feature.title || feature.description}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-3 mt-auto space-y-2">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs" size="sm">
                        Subscribe to {plan.name}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full text-xs"
                        onClick={() => handleEditPlan(plan)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit Plan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-4 pt-3">
            {/* Subscription Management Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Subscription Management</h2>
                <p className="text-sm text-muted-foreground">Manage user subscriptions and warranty claims</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs">
                  <Download className="h-3 w-3 mr-2" />
                  Export Data
                </Button>
                <Button variant="outline" size="sm" onClick={fetchSubscriptions} disabled={subscriptionsLoading} className="text-xs">
                  <RefreshCw className={`h-3 w-3 mr-2 ${subscriptionsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  console.log('Current subscriptions:', userSubscriptions);
                  console.log('First subscription details:', userSubscriptions[0]?.userDetails);
                }} className="text-xs">
                  Debug Data
                </Button>
              </div>
            </div>

            {/* Subscription Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Total Subscriptions</p>
                      <p className="text-lg font-bold">
                        {subscriptionsLoading ? '...' : userSubscriptions.length}
                      </p>
                    </div>
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Active</p>
                      <p className="text-lg font-bold text-green-600">
                        {subscriptionsLoading ? '...' : userSubscriptions.filter(sub => sub && sub.status === 'Active').length}
                      </p>
                    </div>
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Expired</p>
                      <p className="text-lg font-bold text-red-600">
                        {subscriptionsLoading ? '...' : userSubscriptions.filter(sub => sub && sub.status === 'Expired').length}
                      </p>
                    </div>
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Warranty Claims</p>
                      <p className="text-lg font-bold text-orange-600">
                        {subscriptionsLoading ? '...' : userSubscriptions.filter(sub => sub && sub.warrantyClaimed).length}
                      </p>
                    </div>
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Subscription Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search subscriptions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[160px] text-sm">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Filter className="h-3 w-3 mr-2" />
                      More Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Message */}
            {subscriptionsError && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">{subscriptionsError}</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchSubscriptions}
                      className="ml-auto text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-2" />
                      Retry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Subscriptions Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-4 w-4" />
                  User Subscriptions
                  {subscriptionsLoading && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Loading subscriptions...
                    </div>
                  )}
                  {userDetailsLoading && !subscriptionsLoading && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Loading user details...
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {subscriptionsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span className="text-sm">Loading subscriptions...</span>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User Name</TableHead>
                        <TableHead>Subscription ID</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Brand(s)</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Warranty Claim</TableHead>
                        <TableHead>Number</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Remote Support</TableHead>
                        <TableHead>Home Visits</TableHead>
                        <TableHead>Software Installation</TableHead>
                        <TableHead>Antivirus</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscriptions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={16} className="text-center py-8 text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <Users className="h-12 w-12 opacity-50" />
                              <p>No subscriptions found</p>
                              <p className="text-sm">Try adjusting your search or filter criteria</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSubscriptions.map((subscription) => (
                        <TableRow key={subscription.id || subscription._id}>
                          {/* User Name */}
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {subscription.userDetails?.name || 
                                 subscription.userName || 
                                 subscription.name || 
                                 subscription.customerName ||
                                 'Unknown User'}
                              </span>
                              {subscription.userDetails?.profileImage && (
                                <img 
                                  src={subscription.userDetails.profileImage} 
                                  alt="Profile" 
                                  className="w-6 h-6 rounded-full mt-1"
                                />
                              )}
                            </div>
                          </TableCell>
                          
                          {/* Subscription ID */}
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-mono text-sm font-medium">
                                {subscription.subscriptionId || subscription._id || subscription.id || 'N/A'}
                              </span>
                            </div>
                          </TableCell>
                          
                          {/* Plan */}
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{subscription.planName || 'N/A'}</span>                            </div>
                          </TableCell>
                          
                          {/* Amount */}
                          <TableCell className="font-medium">
                            <div className="text-sm">
                              <div>Base: ₹{subscription.baseAmount || subscription.amount || 0}</div>
                              {subscription.gstAmount && (
                                <div className="text-xs text-gray-600">GST: ₹{subscription.gstAmount}</div>
                              )}
                              <div className="font-semibold">Total: ₹{subscription.amount || 0}</div>
                            </div>
                          </TableCell>

                          {/* Brands */}
                          <TableCell>
                            {(() => {
                              try {
                                const brands = Array.isArray(subscription.devices)
                                  ? Array.from(new Set(
                                      subscription.devices
                                        .map((d: any) => (d?.brand || '').toString().trim())
                                        .filter((b: string) => !!b)
                                    ))
                                  : [];
                                return brands.length > 0 ? brands.join(', ') : '—';
                              } catch {
                                return '—';
                              }
                            })()}
                          </TableCell>
                          
                          {/* Quantity */}
                          <TableCell>
                            <span className="font-medium">{subscription.quantity || 1}</span>
                          </TableCell>
                          
                          {/* Status */}
                          <TableCell>
                            <Badge 
                              variant={subscription.status === 'Active' ? 'default' : 'secondary'}
                              className={subscription.status === 'Active' ? 'bg-green-100 text-green-800' : ''}
                            >
                              {subscription.status || 'Unknown'}
                            </Badge>
                          </TableCell>
                          
                          {/* Start Date */}
                          <TableCell>
                            {subscription.startDate ? new Date(subscription.startDate).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          
                          {/* End Date */}
                          <TableCell>
                            {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          
                          {/* Warranty Claim */}
                          <TableCell>
                            {subscription.warrantyClaimed ? (
                              <Badge variant="destructive" className="bg-orange-100 text-orange-800">
                                Claimed
                              </Badge>
                            ) : (
                              <Badge variant="outline">Available</Badge>
                            )}
                          </TableCell>
                          
                          {/* Number */}
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {subscription.userDetails?.phone || 
                                 subscription.userPhone ||
                                 subscription.phoneNumber || 
                                 subscription.number || 
                                 subscription.phone ||
                                 subscription.customerPhone ||
                                 subscription.mobile ||
                                 'N/A'}
                              </span>
                              {subscription.userDetails?.isPhoneVerified && (
                                <Badge variant="outline" className="text-xs w-fit">
                                  Verified
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          
                          {/* Email */}
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">
                                {subscription.userDetails?.email || 
                                 subscription.userEmail || 
                                 subscription.email ||
                                 subscription.customerEmail ||
                                 'N/A'}
                              </span>
                              {subscription.userDetails?.isEmailVerified && (
                                <Badge variant="outline" className="text-xs w-fit">
                                  Verified
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          
                          {/* Remote Support */}
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {subscription.remoteSupportUsed || 0} / {subscription.remoteSupportLimit || '∞'}
                              </span>
                            </div>
                          </TableCell>
                          
                          {/* Home Visits */}
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {subscription.homeVisitsUsed || 0} / {subscription.homeVisitsLimit || 0}
                              </span>
                            </div>
                          </TableCell>
                          
                          {/* Software Installation */}
                          <TableCell>
                            <Badge variant={(subscription.planName === 'CARE PLAN' || subscription.planName === 'RELAX PLAN') ? 'default' : (subscription.softwareInstallation ? 'default' : 'secondary')}>
                              {(subscription.planName === 'CARE PLAN' || subscription.planName === 'RELAX PLAN') ? '1 year' : (subscription.softwareInstallation ? 'Yes' : 'No')}
                            </Badge>
                          </TableCell>
                          
                          {/* Antivirus */}
                          <TableCell>
                            <Badge variant={(subscription.planName === 'CARE PLAN' || subscription.planName === 'RELAX PLAN') ? 'default' : (subscription.antivirus ? 'default' : 'secondary')}>
                              {(subscription.planName === 'CARE PLAN' || subscription.planName === 'RELAX PLAN') ? '1 year' : (subscription.antivirus ? 'Yes' : 'No')}
                            </Badge>
                          </TableCell>
                          
                          {/* Actions */}
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewSubscription(subscription)}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditSubscription(subscription)}
                                title="Edit Subscription"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                  </div>
                          </TableCell>
                        </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                )}
              </CardContent>
            </Card>

            {/* View Subscription Details Dialog */}
            <Dialog open={isViewSubscriptionOpen} onOpenChange={setIsViewSubscriptionOpen}>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span>Subscription Details</span>
                    {selectedSubscription?.subscriptionId && (
                      <Badge variant="outline">{selectedSubscription.subscriptionId}</Badge>
                    )}
                  </DialogTitle>
                </DialogHeader>

                {selectedSubscription && (
                  <div className="space-y-6">
                    {/* Top summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-md border">
                        <p className="text-xs text-muted-foreground">User</p>
                        <p className="font-medium">{selectedSubscription.userDetails?.name || selectedSubscription.userName || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{selectedSubscription.userDetails?.email || selectedSubscription.userEmail || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{selectedSubscription.userDetails?.phone || selectedSubscription.userPhone || 'N/A'}</p>
                      </div>
                      <div className="p-4 rounded-md border">
                        <p className="text-xs text-muted-foreground">Plan</p>
                        <p className="font-medium">{selectedSubscription.planName}</p>
                        <p className="text-xs text-muted-foreground">Amount</p>
                        <div className="text-sm">
                          <div>Base: ₹{selectedSubscription.baseAmount || selectedSubscription.amount || 0}</div>
                          {selectedSubscription.gstAmount && (
                            <div className="text-xs text-gray-600">GST: ₹{selectedSubscription.gstAmount}</div>
                          )}
                          <div className="font-semibold">Total: ₹{selectedSubscription.amount || 0}</div>
                        </div>
                      </div>
                      <div className="p-4 rounded-md border space-y-1">
                        <p className="text-xs text-muted-foreground">Status</p>
                        <Badge className={selectedSubscription.status === 'Active' ? 'bg-green-100 text-green-800' : ''}>{selectedSubscription.status}</Badge>
                        <p className="text-xs text-muted-foreground mt-2">Payment</p>
                        <Badge variant="outline">{selectedSubscription.paymentStatus || 'N/A'}</Badge>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-md border">
                        <p className="text-xs text-muted-foreground">Start Date</p>
                        <p className="font-medium">{selectedSubscription.startDate ? new Date(selectedSubscription.startDate).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div className="p-4 rounded-md border">
                        <p className="text-xs text-muted-foreground">End Date</p>
                        <p className="font-medium">{selectedSubscription.endDate ? new Date(selectedSubscription.endDate).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div className="p-4 rounded-md border">
                        <p className="text-xs text-muted-foreground">Quantity</p>
                        <p className="font-medium">{selectedSubscription.quantity || 1}</p>
                      </div>
                    </div>

                    {/* Usage */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-md border">
                        <p className="text-xs text-muted-foreground">Remote Support</p>
                        <p className="font-medium">{selectedSubscription.remoteSupportUsed || 0} / {selectedSubscription.remoteSupportLimit || '∞'}</p>
                      </div>
                      <div className="p-4 rounded-md border">
                        <p className="text-xs text-muted-foreground">Home Visits</p>
                        <p className="font-medium">{selectedSubscription.homeVisitsUsed || 0} / {selectedSubscription.homeVisitsLimit || 0}</p>
                      </div>
                      <div className="p-4 rounded-md border">
                        <p className="text-xs text-muted-foreground">Warranty</p>
                        <Badge variant={selectedSubscription.warrantyClaimed ? 'destructive' : 'outline'}>
                          {selectedSubscription.warrantyClaimed ? 'Claimed' : 'Available'}
                        </Badge>
                      </div>
                    </div>

                    {/* Devices */}
                    <div className="space-y-3">
                      <h3 className="font-semibold">Devices</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(Array.isArray(selectedSubscription.devices) ? selectedSubscription.devices : []).map((d: any, idx: number) => (
                          <div key={d?._id || idx} className="p-4 rounded-md border space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">Device {idx + 1}</p>
                              {d?.serialNumberPhoto && (
                                <img src={d.serialNumberPhoto} alt="Device" className="w-12 h-12 object-cover rounded" />
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground">Type</p>
                                <p className="font-medium">{d?.deviceType || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Brand</p>
                                <p className="font-medium">{d?.brand || '—'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Serial Number</p>
                                <p className="font-medium break-all">{d?.serialNumber || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Model Number</p>
                                <p className="font-medium break-all">{d?.modelNumber || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {(!selectedSubscription.devices || selectedSubscription.devices.length === 0) && (
                          <div className="text-sm text-muted-foreground">No devices added.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>  
        </Tabs>

        {/* Edit AMC Plan Modal */}
        <EditAMCPlanModal
          isOpen={isEditPlanOpen}
          onClose={() => setIsEditPlanOpen(false)}
          plan={editingPlan}
          onSave={handleSavePlan}
        />

        {/* Edit Subscription Modal */}
        <Dialog open={isEditSubscriptionOpen} onOpenChange={setIsEditSubscriptionOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Subscription Usage</DialogTitle>
              <DialogDescription>
                Update the usage limits and counts for this subscription
              </DialogDescription>
            </DialogHeader>

            {editingSubscription && (
              <EditSubscriptionForm
                subscription={editingSubscription}
                onSave={handleUpdateSubscription}
                onCancel={() => setIsEditSubscriptionOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Issue Details Modal */}
        <Dialog open={isIssueModalOpen} onOpenChange={setIsIssueModalOpen}>
          <DialogContent className="max-w-lg mt-16">
            <DialogHeader>
              <DialogTitle className="text-lg">Warranty Claim Details</DialogTitle>
              <DialogDescription className="text-sm">
                Issue description and claim information
              </DialogDescription>
            </DialogHeader>

            {selectedClaim && (
              <div className="space-y-4">
                {/* Claim Information */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Claim ID</Label>
                    <div className="mt-1 p-2 bg-gray-50 rounded-md border">
                      <span className="font-mono text-xs font-medium">
                        {selectedClaim._id?.slice(-8) || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <Badge 
                        variant={
                          selectedClaim.status === 'pending' ? 'default' :
                          selectedClaim.status === 'approved' ? 'secondary' :
                          selectedClaim.status === 'rejected' ? 'destructive' :
                          selectedClaim.status === 'completed' ? 'outline' : 'default'
                        }
                        className="text-xs"
                      >
                        {selectedClaim.status?.charAt(0).toUpperCase() + selectedClaim.status?.slice(1) || 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* User Information */}
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">User</Label>
                    <div className="mt-1 p-2 bg-gray-50 rounded-md border">
                      <div className="text-sm">
                        <p className="font-medium">{selectedClaim.userId?.name || 'Unknown User'}</p>
                        <p className="text-xs text-muted-foreground">{selectedClaim.userId?.email || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground font-mono">{selectedClaim.userId?.phone || selectedClaim.userId?.mobile || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Information */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Service Type</Label>
                    <div className="mt-1 p-2 bg-gray-50 rounded-md border">
                      <Badge variant="outline" className="text-xs">
                        {selectedClaim.item || 'N/A'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Plan</Label>
                    <div className="mt-1 p-2 bg-gray-50 rounded-md border">
                      <Badge variant="secondary" className="text-xs">
                        {selectedClaim.planName || 'N/A'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Issue Description */}
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Issue Description</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md border min-h-[80px]">
                    <p className="text-xs leading-relaxed whitespace-pre-wrap">
                      {selectedClaim.issueDescription || 'No issue description provided'}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-3 border-t">
                  <Button variant="outline" size="sm" onClick={() => setIsIssueModalOpen(false)}>
                    Close
                  </Button>
                  {selectedClaim.status === 'pending' && (
                    <>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApproveWarrantyClaim(selectedClaim._id)}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleRejectWarrantyClaim(selectedClaim._id)}>
                        <XCircle className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                  {selectedClaim.status === 'approved' && selectedClaim.item === 'Home Visit Service' && (
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleOpenVendorModal(selectedClaim)}>
                      <UserPlus className="h-3 w-3 mr-1" />
                      Assign Vendor
                    </Button>
                  )}
                  {selectedClaim.status === 'approved' && (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleCompleteWarrantyClaim(selectedClaim._id)}>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Vendor Assignment Modal */}
        <Dialog open={isVendorModalOpen} onOpenChange={setIsVendorModalOpen}>
          <DialogContent className="max-w-sm mt-12">
            <DialogHeader>
              <DialogTitle className="text-base">Assign Vendor</DialogTitle>
              <DialogDescription className="text-xs">
                Select vendor for home visit
              </DialogDescription>
            </DialogHeader>

            {selectedClaimForVendor && (
              <div className="space-y-3">
                {/* Claim Information */}
                <div className="p-2 bg-gray-50 rounded-md border">
                  <div className="text-xs">
                    <p className="font-medium">Claim ID: {selectedClaimForVendor._id?.slice(-8)}</p>
                    <p className="text-muted-foreground">Service: {selectedClaimForVendor.item}</p>
                    <p className="text-muted-foreground">User: {selectedClaimForVendor.userId?.name}</p>
                    <p className="text-muted-foreground">Mobile: {selectedClaimForVendor.userId?.phone || selectedClaimForVendor.userId?.mobile || 'N/A'}</p>
                  </div>
                </div>

                {/* Issue Description */}
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Issue Description</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md border min-h-[50px]">
                    <p className="text-xs leading-relaxed whitespace-pre-wrap">
                      {selectedClaimForVendor.issueDescription || 'No issue description provided'}
                    </p>
                  </div>
                </div>

                {/* Vendor Selection */}
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Select Vendor</Label>
                  <select
                    value={selectedVendorId}
                    onChange={(e) => setSelectedVendorId(e.target.value)}
                    className="mt-1 w-full p-2 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose a vendor...</option>
                    {Array.isArray(vendors) && vendors.length > 0 ? (
                      vendors.map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.name} - {vendor.email} ({vendor.phone || 'No phone'})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No vendors available - Check vendor management</option>
                    )}
                  </select>
                </div>

                {/* Selected Vendor Details */}
                {selectedVendorId && (
                  <div className="p-2 bg-blue-50 rounded-md border">
                    <Label className="text-xs font-medium text-blue-700">Selected Vendor Details</Label>
                    {(() => {
                      const selectedVendor = vendors.find(v => v.id === selectedVendorId);
                      return selectedVendor ? (
                        <div className="mt-1 text-xs space-y-0.5">
                          <p><span className="font-medium">Name:</span> {selectedVendor.name}</p>
                          <p><span className="font-medium">Email:</span> {selectedVendor.email}</p>
                          <p><span className="font-medium">Phone:</span> {selectedVendor.phone || 'N/A'}</p>
                          <p><span className="font-medium">Address:</span> {selectedVendor.address?.street || 'N/A'}</p>
                          <p><span className="font-medium">City:</span> {selectedVendor.address?.city || 'N/A'}</p>
                          <p><span className="font-medium">Pincode:</span> {selectedVendor.address?.pincode || 'N/A'}</p>
                          <p><span className="font-medium">Status:</span> {selectedVendor.status || 'N/A'}</p>
                          <p><span className="font-medium">Verification:</span> {selectedVendor.verificationStatus || 'N/A'}</p>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">Vendor details not found</p>
                      );
                    })()}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" onClick={() => {
                    setIsVendorModalOpen(false);
                    setSelectedClaimForVendor(null);
                    setSelectedVendorId('');
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700" 
                    onClick={handleAssignVendor}
                    disabled={!selectedVendorId}
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Assign
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