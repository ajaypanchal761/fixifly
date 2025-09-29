import VendorHeader from "../components/VendorHeader";
import VendorBottomNav from "../components/VendorBottomNav";
import VendorBenefitsModal from "../components/VendorBenefitsModal";
import Footer from "../../components/Footer";
import NotFound from "../../pages/NotFound";
import { useMediaQuery, useTheme } from "@mui/material";
import { DollarSign, TrendingUp, TrendingDown, Filter, Download, Wallet, Plus, AlertTriangle, CheckCircle, Edit } from "lucide-react";
import { useState, useEffect } from "react";
import { useVendor } from "@/contexts/VendorContext";
import { useToast } from "@/hooks/use-toast";
import { vendorDepositService } from "@/services/vendorDepositService";
import vendorApiService from "@/services/vendorApi";
import withdrawalService from "@/services/withdrawalService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

const VendorEarnings = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeFilter, setActiveFilter] = useState('All');
  const { vendor, updateVendor } = useVendor();
  
  // Defensive check for vendor context
  if (!vendor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vendor data...</p>
        </div>
      </div>
    );
  }
  const { toast } = useToast();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('3999');
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);
  
  // Withdrawal modal state
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false);

  // Show 404 error on desktop
  if (!isMobile) {
    return <NotFound />;
  }

  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [walletData, setWalletData] = useState({
    currentBalance: 0,
    hasInitialDeposit: false,
    initialDepositAmount: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    summary: {
      totalEarnings: 0,
      totalWithdrawals: 0
    }
  });
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [isUpdatingFromAPI, setIsUpdatingFromAPI] = useState(false);

  // Add sample transaction for testing if no transactions exist
  useEffect(() => {
    const balance = walletData.currentBalance || vendor?.wallet?.currentBalance || 0;
    if (transactionHistory.length === 0 && !loadingTransactions && balance > 0) {
      const sampleTransaction = {
        id: 'sample-deposit',
        caseId: 'DEP-001',
        type: 'Payment Received',
        amount: 3999,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: 'Initial security deposit'
      };
      setTransactionHistory([sampleTransaction]);
    }
  }, [transactionHistory.length, loadingTransactions, walletData.currentBalance, vendor?.wallet?.currentBalance]);

  // Fetch wallet data on component mount
  useEffect(() => {
    if (vendor?.vendorId) {
      console.log('🔄 Component mounted, fetching wallet data for vendor:', vendor.vendorId);
      fetchWalletData();
      fetchTransactionHistory();
      
      // Set up periodic auto-refresh every 30 seconds to keep data updated
      const intervalId = setInterval(() => {
        console.log('🔄 Periodic auto-refresh of wallet data');
        fetchWalletData();
        fetchTransactionHistory();
      }, 30000); // 30 seconds
      
      // Cleanup interval on unmount
      return () => clearInterval(intervalId);
    }
  }, [vendor?.vendorId]);

  // Also fetch wallet data when vendor context changes
  useEffect(() => {
    if (vendor?.wallet && !isUpdatingFromAPI) {
      console.log('🔄 Vendor wallet context updated:', vendor.wallet);
      // Update local wallet data from vendor context
      setWalletData({
        currentBalance: vendor.wallet.currentBalance || 0,
        hasInitialDeposit: vendor.wallet.hasInitialDeposit || false,
        initialDepositAmount: vendor.wallet.initialDepositAmount || 0,
        totalDeposits: vendor.wallet.totalDeposits || 0,
        totalWithdrawals: vendor.wallet.totalWithdrawals || 0,
        summary: {
          totalEarnings: 0,
          totalWithdrawals: vendor.wallet.totalWithdrawals || 0
        }
      });
      setLoadingWallet(false);
    }
  }, [vendor?.wallet, isUpdatingFromAPI]);

  // Function to refresh vendor profile data from API
  const refreshVendorProfile = async () => {
    try {
      console.log('🔄 Refreshing vendor profile from API...');
      const profileResponse = await vendorApiService.getVendorProfile();
      if (profileResponse.success && profileResponse.data.vendor) {
        updateVendor(profileResponse.data.vendor);
        console.log('✅ Vendor profile refreshed successfully');
        console.log('Updated vendor wallet:', profileResponse.data.vendor.wallet);
      }
    } catch (error) {
      console.error('❌ Failed to refresh vendor profile:', error);
    }
  };

  // Fetch wallet data from API
  const fetchWalletData = async () => {
    console.log('=== FETCH WALLET DATA CALLED ===');
    console.log('Vendor ID:', vendor?.vendorId);
    console.log('Vendor exists:', !!vendor);
    
    if (!vendor?.vendorId) {
      console.log('No vendor ID, setting loading to false');
      setLoadingWallet(false);
      return;
    }
    
    setIsUpdatingFromAPI(true);
    
    try {
      setLoadingWallet(true);
      const token = localStorage.getItem('vendorToken');
      console.log('Vendor token found:', token ? 'Yes' : 'No');
      console.log('Token length:', token ? token.length : 0);
      console.log('Token preview:', token ? token.substring(0, 50) + '...' : 'No token');
      
      if (!token) {
        console.warn('No vendor token found - cannot make API call');
        setWalletData({
          currentBalance: 0,
          hasInitialDeposit: false,
          initialDepositAmount: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
          summary: {
            totalEarnings: 0,
            totalWithdrawals: 0
          }
        });
        setLoadingWallet(false);
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      console.log('=== WALLET API CALL ===');
      console.log('API URL:', `${apiUrl}/api/vendor/wallet`);
      console.log('Token present:', token ? 'Yes' : 'No');
      console.log('Making API call...');
      
      const response = await fetch(`${apiUrl}/api/vendor/wallet`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response received, status:', response.status);
      console.log('Response ok:', response.ok);
      
      const responseText = await response.text();
      console.log('Raw response length:', responseText.length);
      console.log('Raw response preview:', responseText.substring(0, 200));
      
      // Parse the response
      const data = JSON.parse(responseText);
      console.log('Parsed response data:', data);

      if (!response.ok) {
        console.log('=== API RESPONSE ERROR ===');
        console.log('Response status:', response.status);
        console.log('Response statusText:', response.statusText);
        
        if (response.status === 404) {
          console.warn('Vendor wallet not found, using default data');
          return;
        }
        throw new Error(`HTTP ${response.status}: Failed to fetch wallet data`);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Server returned non-JSON response, server might not be running');
        return;
      }

      console.log('=== WALLET API RESPONSE ===');
      console.log('Response data:', data);
      
      if (data.success && data.data?.wallet) {
        const walletInfo = {
          currentBalance: data.data.wallet.currentBalance || 0,
          hasInitialDeposit: data.data.wallet.hasInitialDeposit || (data.data.wallet.currentBalance >= 3999),
          initialDepositAmount: data.data.wallet.initialDepositAmount || 0,
          totalDeposits: data.data.wallet.totalDeposits || 0,
          totalWithdrawals: data.data.wallet.totalWithdrawals || 0,
          summary: {
            totalEarnings: data.data.wallet.summary?.totalEarnings || 0,
            totalWithdrawals: data.data.wallet.summary?.totalWithdrawals || 0
          }
        };
      console.log('=== SETTING WALLET DATA ===');
      console.log('Raw wallet data from API:', data.data.wallet);
      console.log('Processed wallet info:', walletInfo);
      console.log('Current balance from API:', data.data.wallet.currentBalance);
      console.log('Setting currentBalance to:', walletInfo.currentBalance);
      
      // Update vendor context with latest wallet data
      if (updateVendor && vendor) {
        updateVendor({ wallet: walletInfo });
        console.log('✅ Vendor context updated with latest wallet data');
      }
      console.log('API response success:', data.success);
      console.log('API response data exists:', !!data.data);
      console.log('API response wallet exists:', !!data.data?.wallet);
      
      setWalletData(walletInfo);
      console.log('✅ Wallet data set in state');
        
        // Update vendor context with wallet data
        if (updateVendor) {
          updateVendor({
            wallet: {
              currentBalance: walletInfo.currentBalance,
              hasInitialDeposit: walletInfo.hasInitialDeposit,
              initialDepositAmount: walletInfo.initialDepositAmount,
              totalDeposits: walletInfo.totalDeposits,
              totalWithdrawals: walletInfo.totalWithdrawals
            }
          });
        }
        
        // Reset flag after updating vendor context
        setTimeout(() => {
          setIsUpdatingFromAPI(false);
        }, 100);
      } else {
        console.warn('Invalid wallet API response structure:', data);
      }
    } catch (error) {
      console.log('=== FETCH WALLET DATA ERROR ===');
      console.error('Error fetching wallet data:', error);
      console.log('Error message:', error.message);
      console.log('Error stack:', error.stack);
      
      // Check if it's a JSON parsing error (server not running)
      if (error.message.includes('Unexpected token') || error.message.includes('<!doctype')) {
        console.warn('Backend server appears to be down, using default wallet data');
      }
      
      // Keep default wallet data on error
    } finally {
      setLoadingWallet(false);
      setIsUpdatingFromAPI(false);
    }
  };

  // Fetch transaction history from API
  const fetchTransactionHistory = async () => {
    if (!vendor?.vendorId) {
      setLoadingTransactions(false);
      return;
    }
    
    try {
      setLoadingTransactions(true);
      const token = localStorage.getItem('vendorToken');
      
      if (!token) {
        console.warn('No vendor token found');
        setTransactionHistory([]);
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/vendor/wallet`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Wallet not found, create empty transaction history
          console.warn('Vendor wallet not found, using empty transaction history');
          setTransactionHistory([]);
          return;
        }
        throw new Error(`HTTP ${response.status}: Failed to fetch transaction history`);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Server returned non-JSON response, server might not be running');
        setTransactionHistory([]);
        return;
      }

      const data = await response.json();
      
      // Check if data structure is correct
      if (!data.success || !data.data || !Array.isArray(data.data.transactions)) {
        console.warn('Invalid API response structure:', data);
        setTransactionHistory([]);
        return;
      }
      
      // Transform API data to match component interface
      const transformedTransactions = data.data.transactions.map((transaction: any) => ({
        id: transaction._id || transaction.id,
        caseId: transaction.caseId || transaction.bookingId || `TXN-${(transaction._id || transaction.id).toString().slice(-6)}`,
        type: transaction.type === 'deposit' || transaction.type === 'earning' ? 'Payment Received' : 
              transaction.type === 'withdrawal' ? 'Withdraw Transferred' :
              transaction.type === 'penalty' ? 'Penalty on Cancellation' : 
              transaction.type === 'task_acceptance_fee' ? 'Task Fee' :
              transaction.type === 'cash_collection' ? 'Cash Collection' :
              transaction.type === 'manual_adjustment' ? 'Admin Adjustment' : 'Earning Added',
        amount: transaction.type === 'withdrawal' || transaction.type === 'penalty' || transaction.type === 'task_acceptance_fee' || transaction.type === 'cash_collection' ? 
                -Math.abs(transaction.amount) : 
                transaction.type === 'manual_adjustment' ? transaction.amount : Math.abs(transaction.amount),
        date: transaction.createdAt ? new Date(transaction.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: transaction.status || 'completed',
        description: transaction.description || 'Wallet transaction'
      }));
      
      setTransactionHistory(transformedTransactions);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      setTransactionHistory([]);
      
      // Check if it's a JSON parsing error (server not running)
      if (error.message.includes('Unexpected token') || error.message.includes('<!doctype')) {
        console.warn('Backend server appears to be down, using empty transaction history');
        // Removed toast notification for server unavailability
      } else {
        // Show user-friendly error message for other errors
        toast({
          title: "Error",
          description: "Failed to load transaction history. Please try again later.",
          variant: "destructive"
        });
      }
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Load wallet data and transaction history on component mount
  useEffect(() => {
    console.log('=== VENDOR EARNINGS useEffect CALLED ===');
    console.log('Vendor context:', vendor);
    console.log('Vendor ID:', vendor?.vendorId);
    console.log('Vendor Email:', vendor?.email);
    console.log('useEffect dependency vendor?.vendorId:', vendor?.vendorId);
    
    // Show alert for debugging
    if (vendor?.vendorId) {
      console.log('Vendor ID detected:', vendor.vendorId);
      console.log('This vendor should show ₹3,999 balance (fallback)');
    }
    
    // Test API connectivity first
    const testAPI = async () => {
      try {
        console.log('Testing API connectivity...');
        const response = await fetch('/health');
        const data = await response.text();
        console.log('Health check response:', data);
      } catch (error) {
        console.log('Health check failed:', error);
      }
    };
    
    testAPI();
    
    if (vendor?.vendorId) {
      console.log('✅ Vendor ID found, calling fetchWalletData for vendor:', vendor.vendorId);
      console.log('Vendor object:', vendor);
      fetchWalletData();
      fetchTransactionHistory();
    } else {
      console.warn('❌ No vendor ID found, setting loading to false');
      console.log('Vendor object:', vendor);
      setLoadingWallet(false);
      setLoadingTransactions(false);
    }
  }, [vendor?.vendorId]);

  // Calculate wallet values from state
  const totalEarnings = walletData.summary?.totalEarnings || 0;
  
  // Debug current balance calculation
  console.log('=== CURRENT BALANCE CALCULATION ===');
  console.log('walletData:', walletData);
  console.log('walletData.currentBalance:', walletData.currentBalance);
  console.log('typeof walletData.currentBalance:', typeof walletData.currentBalance);
  
  // Use actual balance from API with fallback to vendor context
  let currentBalance = walletData.currentBalance !== undefined ? walletData.currentBalance : (vendor?.wallet?.currentBalance || 0);
  
  // If still 0, try to get from vendor context
  if (currentBalance === 0 && vendor?.wallet?.currentBalance) {
    currentBalance = vendor.wallet.currentBalance;
    console.log('🔄 Using balance from vendor context:', currentBalance);
  }
  
  console.log('Final currentBalance:', currentBalance);
  console.log('walletData.currentBalance is undefined:', walletData.currentBalance === undefined);
  console.log('Vendor ID:', vendor?.vendorId);
  console.log('Using fallback logic for vendor:', vendor?.vendorId);
  
  const availableBalance = Math.max(0, currentBalance - 3999); // Available for withdrawal
  const totalWithdrawn = walletData.summary?.totalWithdrawals || 0;
  
  // Check hasInitialDeposit from multiple sources - once deposit is made, always show Yes
  const hasInitialDeposit = vendor?.wallet?.hasInitialDeposit || 
                           walletData.hasInitialDeposit || 
                           (currentBalance >= 3999 && currentBalance > 0) ||
                           (vendor?.wallet?.totalDeposits > 0) ||
                           (walletData.totalDeposits > 0);
  
  // Debug logging
  console.log('=== CURRENT STATE ===');
  console.log('Vendor ID:', vendor?.vendorId);
  console.log('Wallet data:', walletData);
  console.log('Current balance:', currentBalance);
  console.log('Has initial deposit:', hasInitialDeposit);
  console.log('Loading wallet:', loadingWallet);
  
  
  
  

  // Handle deposit
  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    
    // Validate amount based on deposit type
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid deposit amount.",
        variant: "destructive"
      });
      return;
    }
    
    if (!hasInitialDeposit && amount < 3999) {
      toast({
        title: "Minimum Initial Deposit Required",
        description: "You must deposit at least ₹3,999 for your initial deposit.",
        variant: "destructive"
      });
      return;
    }

    if (!vendor) {
      toast({
        title: "Error",
        description: "Vendor information not found. Please try logging in again.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessingDeposit(true);
    
    try {
      await vendorDepositService.processDepositPayment(
        amount,
        vendor.fullName,
        vendor.email,
        vendor.phone,
        (response) => {
          // Payment successful
          toast({
            title: "Deposit Successful!",
            description: `₹${amount.toLocaleString()} has been added to your wallet.${!hasInitialDeposit ? ' You can now access all features.' : ''}`,
          });

          // Automatic refresh wallet data after deposit - multiple attempts for reliability
          const refreshAfterDeposit = async (attempt = 1) => {
            console.log(`🔄 Auto-refreshing wallet data after deposit (attempt ${attempt})...`);
            console.log('Deposit amount:', amount);
            
            try {
              // Refresh vendor profile first to get latest data
              await refreshVendorProfile();
              
              // Then refresh wallet data and transactions
              await fetchWalletData();
              await fetchTransactionHistory();
              
              console.log(`✅ Auto-refresh attempt ${attempt} completed successfully`);
              
              // If this is the first attempt, try again after a short delay to ensure data is updated
              if (attempt === 1) {
                setTimeout(() => refreshAfterDeposit(2), 2000);
              }
            } catch (error) {
              console.error(`❌ Auto-refresh attempt ${attempt} failed:`, error);
              
              // Retry if first attempt failed
              if (attempt === 1) {
                setTimeout(() => refreshAfterDeposit(2), 3000);
              }
            }
          };
          
          // Start the refresh process immediately
          setTimeout(() => refreshAfterDeposit(1), 1000);

          setIsDepositModalOpen(false);
          setDepositAmount('3999');
          setIsProcessingDeposit(false);
        },
        (error) => {
          // Check if it's a payment cancellation
          if (error.message === 'PAYMENT_CANCELLED') {
            console.log('Deposit payment cancelled by user');
            setIsProcessingDeposit(false);
            // Don't show error toast for user cancellation
            return;
          }
          
          // Payment failed
          console.error('Deposit payment failed:', error);
          toast({
            title: "Deposit Failed",
            description: error.message || "There was an error processing your deposit. Please try again.",
            variant: "destructive"
          });
          setIsProcessingDeposit(false);
        }
      );
    } catch (error) {
      console.error('Error initiating deposit:', error);
      toast({
        title: "Deposit Failed",
        description: "There was an error initiating your deposit. Please try again.",
        variant: "destructive"
      });
      setIsProcessingDeposit(false);
    }
  };

  // Handle withdrawal
  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    
    // Validate amount
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount.",
        variant: "destructive"
      });
      return;
    }

    if (amount > walletData.currentBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You can only withdraw up to ₹${walletData.currentBalance.toLocaleString()}.`,
        variant: "destructive"
      });
      return;
    }

    if (!vendor) {
      toast({
        title: "Error",
        description: "Vendor information not found. Please try logging in again.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessingWithdraw(true);
    
    try {
      const response = await withdrawalService.createWithdrawalRequest(amount);
      
      toast({
        title: "Thank You!",
        description: `Your withdrawal request for ₹${amount.toLocaleString()} has been submitted successfully. It will be processed within 24-48 hours.`,
      });

      setIsWithdrawModalOpen(false);
      setWithdrawAmount('');
      setIsProcessingWithdraw(false);
      
      // Refresh wallet data after withdrawal request
      await fetchWalletData();
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast({
        title: "Withdrawal Failed",
        description: error.message || "There was an error processing your withdrawal request. Please try again.",
        variant: "destructive"
      });
      setIsProcessingWithdraw(false);
    }
  };

  // Export to Excel function
  const exportToExcel = () => {
    // Create CSV content
    const headers = ['Transaction ID', 'Case ID', 'Type', 'Amount', 'Date', 'Description', 'Status'];
    const csvContent = [
      headers.join(','),
      ...transactionHistory.map(transaction => [
        transaction.id,
        transaction.caseId,
        transaction.type,
        transaction.amount,
        transaction.date,
        `"${transaction.description}"`, // Wrap in quotes to handle commas
        transaction.status
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `vendor_earnings_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success message
    alert('Transaction data exported successfully!');
  };

  // Filter transactions based on active filter
  const filteredTransactions = (transactionHistory || []).filter(transaction => {
    if (!transaction || typeof transaction !== 'object') {
      return false;
    }
    
    switch (activeFilter) {
      case 'All':
        return true;
      case 'Payment Received':
        return transaction.type === 'Payment Received';
      case 'Withdraw':
        return transaction.type === 'Withdraw Transferred';
      case 'Penalty':
        return transaction.type === 'Penalty on Cancellation';
      case 'Admin Adjustment':
        return transaction.type === 'Admin Adjustment';
      default:
        return true;
    }
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "Payment Received":
      case "Earning Added":
      case "Cash Received by Customer":
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case "Withdraw Transferred":
      case "Penalty on Cancellation":
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      case "Admin Adjustment":
        return <Edit className="w-5 h-5 text-purple-600" />;
      default:
        return <DollarSign className="w-5 h-5 text-blue-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "Payment Received":
      case "Earning Added":
      case "Cash Received by Customer":
        return "text-green-600";
      case "Withdraw Transferred":
      case "Penalty on Cancellation":
        return "text-red-600";
      case "Admin Adjustment":
        return "text-purple-600";
      default:
        return "text-blue-600";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <VendorHeader />
      <main className="flex-1 pb-24 md:pb-0 pt-20 md:pt-0">
        <div className="container mx-auto px-4 py-4">
        <h1 className="text-3xl font-bold mb-4 md:hidden text-center">Vendor <span className="text-3xl font-bold text-gradient mb-4 md:hidden text-center"> Earning</span></h1>
        
          
          {/* Mandatory Deposit Alert */}
          {!hasInitialDeposit && (
            <div className="mb-6 md:hidden">
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <div className="space-y-3">
                    <div>
                      <strong>Mandatory Deposit Required:</strong> You must deposit ₹3,999 to access all features. 
                      This is a one-time requirement for new vendors.
                    </div>
                    <div className="flex justify-center">
                      <VendorBenefitsModal hasInitialDeposit={hasInitialDeposit}>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-orange-300 text-orange-700 hover:bg-orange-100"
                        >
                          🎁 View Certified Partner Benefits
                        </Button>
                      </VendorBenefitsModal>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Success Message for Deposit */}
          {hasInitialDeposit && (
            <div className="mb-6 md:hidden">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="space-y-3">
                    <div>
                      <strong>Deposit Complete:</strong> You have successfully made your initial deposit. 
                      You can now access all vendor features.
                    </div>
                    <div className="flex justify-center">
                      <VendorBenefitsModal hasInitialDeposit={hasInitialDeposit}>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-green-300 text-green-700 hover:bg-green-100"
                        >
                          🎁 View Your Benefits
                        </Button>
                      </VendorBenefitsModal>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          {/* Balance Overview */}
          <div className="grid grid-cols-1 gap-4 mb-8 md:hidden">
            {/* Available Balance */}
            <div className="service-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Current Balance</h3>
                    {loadingWallet ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-muted-foreground">Updating balance...</span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg font-bold text-primary">₹{currentBalance.toLocaleString()}</p>
                        {currentBalance >= 3999 && (
                          <p className="text-xs text-muted-foreground">
                            Available for withdrawal: ₹{availableBalance.toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className="bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-4"
                        disabled={isProcessingDeposit}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Deposit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Make Deposit</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="depositAmount">Deposit Amount (₹)</Label>
                          <Input
                            id="depositAmount"
                            type="number"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            placeholder="Enter amount"
                            min={hasInitialDeposit ? "1" : "3999"}
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            {hasInitialDeposit 
                              ? "Additional deposit - any amount above ₹1" 
                              : "Minimum initial deposit: ₹3,999"
                            }
                          </p>
                        </div>
                        
                        {/* View Benefits Button - Show for all vendors */}
                        <div className="text-center">
                          <VendorBenefitsModal hasInitialDeposit={hasInitialDeposit}>
                            <Button 
                              variant="outline" 
                              className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                            >
                              🎁 View Benefits of Certified Partner
                            </Button>
                          </VendorBenefitsModal>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleDeposit} 
                            className="flex-1"
                            disabled={isProcessingDeposit}
                          >
                            {isProcessingDeposit ? 'Processing...' : 'Deposit'}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setIsDepositModalOpen(false)}
                            disabled={isProcessingDeposit}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {/* Withdrawal Modal */}
                  <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Request Withdrawal</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="withdrawAmount">Withdrawal Amount (₹)</Label>
                          <Input
                            id="withdrawAmount"
                            type="number"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            placeholder="Enter amount"
                            min="1"
                            max={walletData.currentBalance}
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            Available balance: ₹{walletData.currentBalance.toLocaleString()}
                          </p>
                        </div>
                        
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Withdrawal requests are processed within 24-48 hours. Please ensure your bank details are up to date.
                          </AlertDescription>
                        </Alert>
                        
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleWithdraw} 
                            className="flex-1"
                            disabled={isProcessingWithdraw}
                          >
                            {isProcessingWithdraw ? 'Processing...' : 'Request for Withdrawal'}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setIsWithdrawModalOpen(false)}
                            disabled={isProcessingWithdraw}
                          >
                            Close
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <button 
                    className="btn-tech text-sm py-2 px-6"
                    onClick={() => setIsWithdrawModalOpen(true)}
                    disabled={!hasInitialDeposit}
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Filters */}
          <div className="mb-4 md:hidden">
            <div className="flex flex-wrap gap-1.5">
              <button 
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  activeFilter === 'All' 
                    ? 'btn-tech' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                onClick={() => setActiveFilter('All')}
              >
                All
              </button>
              <button 
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  activeFilter === 'Payment Received' 
                    ? 'btn-tech' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                onClick={() => setActiveFilter('Payment Received')}
              >
                Payment
              </button>
              <button 
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  activeFilter === 'Withdraw' 
                    ? 'btn-tech' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                onClick={() => setActiveFilter('Withdraw')}
              >
                Withdraw
              </button>
              <button 
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  activeFilter === 'Penalty' 
                    ? 'btn-tech' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                onClick={() => setActiveFilter('Penalty')}
              >
                Penalty
              </button>
              <button 
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  activeFilter === 'Admin Adjustment' 
                    ? 'btn-tech' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                onClick={() => setActiveFilter('Admin Adjustment')}
              >
                Admin
              </button>
            </div>
          </div>

          {/* Transaction History */}
          <div className="service-card mb-8 md:hidden">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Transaction History</h2>
              <button 
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                onClick={() => {
                  // Export transaction history to Excel
                  exportToExcel();
                }}
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
            
            <div className="space-y-4">
              {loadingTransactions ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading transaction history...</p>
                </div>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction, index) => {
                  if (!transaction || !transaction.id) {
                    return null;
                  }
                  
                  return (
                <div 
                  key={transaction.id} 
                  className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => {
                    // Show transaction details
                    alert(`Transaction Details:\n\nID: ${transaction.id}\nCase ID: ${transaction.caseId}\nType: ${transaction.type}\nAmount: ₹${Math.abs(transaction.amount).toLocaleString()}\nDate: ${transaction.date}\nDescription: ${transaction.description}`);
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <h3 className="font-semibold text-foreground">{transaction.type}</h3>
                        <p className="text-sm text-muted-foreground">Case ID: {transaction.caseId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${getTransactionColor(transaction.type)}`}>
                        {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">{transaction.date}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{transaction.description}</p>
                </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium text-muted-foreground">No transactions found</p>
                  <p className="text-sm text-muted-foreground">
                    {activeFilter === 'All' 
                      ? 'You haven\'t made any transactions yet. Make a deposit to get started!' 
                      : `No ${activeFilter.toLowerCase()} transactions found.`
                    }
                  </p>
                  {activeFilter === 'All' && (
                    <Button 
                      onClick={() => setIsDepositModalOpen(true)}
                      className="mt-4"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Make First Deposit
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <div className="md:hidden">
        <Footer />
        <VendorBottomNav />
      </div>
    </div>
  );
};

export default VendorEarnings;