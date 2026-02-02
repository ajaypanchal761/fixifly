import VendorHeader from "../components/VendorHeader";
import VendorBottomNav from "../components/VendorBottomNav";
import VendorBenefitsModal from "../components/VendorBenefitsModal";
import Footer from "../../components/Footer";
import NotFound from "../../pages/NotFound";
import { useMediaQuery, useTheme } from "@mui/material";
import { DollarSign, TrendingUp, TrendingDown, Filter, Download, Wallet, Plus, AlertTriangle, CheckCircle, Edit, Clock } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
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

// Helper function to format booking ID to FIXB format
const formatBookingId = (id?: string): string => {
  if (!id) return '—';

  // If already in FIX format, return as-is (uppercased)
  if (id.toUpperCase().startsWith('FIX')) {
    return id.toUpperCase();
  }

  // Remove CASE_ prefix if present
  const cleanId = id.replace(/^CASE_/i, '');

  // If it's a MongoDB ObjectId (24 hex chars), format as FIXB + last 8 chars
  if (/^[a-f0-9]{24}$/i.test(cleanId)) {
    return `FIXB${cleanId.slice(-8).toUpperCase()}`;
  }

  // If it's a shorter hex string (8+ chars), format as FIXB + last 8 chars
  if (/^[a-f0-9]{8,}$/i.test(cleanId)) {
    return `FIXB${cleanId.slice(-8).toUpperCase()}`;
  }

  // For TXN- or WR- prefixed IDs, return as-is
  if (id.startsWith('TXN-') || id.startsWith('WR-')) {
    return id;
  }

  // Fallback: return the ID as-is
  return id;
};

// Helper function to format description - hide raw ObjectIds and rename labels
const formatDescription = (description?: string): string => {
  if (!description) return '';

  // Replace "Cash collection" with "Collection deducted"
  let formatted = description.replace(/Cash collection/gi, 'Collection deducted');

  // Replace raw MongoDB ObjectIds (24 hex chars) with formatted version
  formatted = formatted.replace(/[a-f0-9]{24}/gi, (match) => {
    return `FIXB${match.slice(-8).toUpperCase()}`;
  });

  return formatted;
};

const VendorEarnings = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeFilter, setActiveFilter] = useState('All');
  const { vendor, updateVendor } = useVendor();
  const { toast } = useToast(); // Move useToast before any conditional returns

  // All useState hooks must be declared before ANY conditional returns
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('100');
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);

  // Withdrawal modal state
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false);
  const [pendingWithdrawalRequest, setPendingWithdrawalRequest] = useState(null);

  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [walletData, setWalletData] = useState({
    currentBalance: 0,
    hasInitialDeposit: false,
    initialDepositAmount: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    securityDeposit: 0,
    summary: {
      totalEarnings: 0,
      totalWithdrawals: 0
    }
  });
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [isUpdatingFromAPI, setIsUpdatingFromAPI] = useState(false);

  // Note: Sample transaction logic removed - now calculating balance from actual transaction history


  // Function to refresh vendor profile data from API
  const refreshVendorProfile = async () => {
    try {
      console.log('🔄 Refreshing vendor profile from API...');
      const profileResponse = await vendorApiService.getVendorProfile();
      if (profileResponse.success && profileResponse.data.vendor) {
        updateVendor(profileResponse.data.vendor);
        console.log('✅ Vendor profile refreshed successfully');
        console.log('Updated vendor wallet:', (profileResponse.data.vendor as any).wallet);
      }
    } catch (error) {
      console.error('❌ Failed to refresh vendor profile:', error);
    }
  };

  // Fetch wallet data from API
  const fetchWalletData = useCallback(async () => {
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
          securityDeposit: 0,
          summary: {
            totalEarnings: 0,
            totalWithdrawals: 0
          }
        });
        setLoadingWallet(false);
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      console.log('=== WALLET API CALL ===');
      console.log('API URL:', `${apiUrl}/vendors/wallet`);
      console.log('Token present:', token ? 'Yes' : 'No');
      console.log('Making API call...');

      let response;
      try {
        response = await fetch(`${apiUrl}/vendors/wallet`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          credentials: 'include'
        });
      } catch (networkError: any) {
        // Handle network errors gracefully - use cached data if available
        console.warn('⚠️ Network error fetching wallet data:', networkError.message);
        console.warn('Backend might be down - using cached data if available');
        // Don't throw - let the function continue with empty/default data
        setLoadingWallet(false);
        return;
      }

      console.log('Response received, status:', response.status);
      console.log('Response ok:', response.ok);

      const responseText = await response.text();
      console.log('Raw response length:', responseText.length);
      console.log('Raw response preview:', responseText.substring(0, 200));

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Server returned non-JSON response, server might not be running');
        setLoadingWallet(false);
        setIsUpdatingFromAPI(false);
        return;
      }

      // Parse the response safely
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed response data:', data);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        console.warn('Invalid JSON response, using default wallet data');
        setLoadingWallet(false);
        setIsUpdatingFromAPI(false);
        return;
      }

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

      // Response already checked above - data is parsed
      console.log('=== WALLET API RESPONSE ===');
      console.log('Response data:', data);

      if (data.success && data.data?.wallet) {
        const walletInfo = {
          currentBalance: data.data.wallet.currentBalance || 0,
          hasInitialDeposit: data.data.wallet.hasInitialDeposit || (data.data.wallet.currentBalance >= 0),
          initialDepositAmount: data.data.wallet.initialDepositAmount || 0,
          totalDeposits: data.data.wallet.totalDeposits || 0,
          totalWithdrawals: data.data.wallet.totalWithdrawals || 0,
          securityDeposit: data.data.wallet.securityDeposit || 0,
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
              totalWithdrawals: walletInfo.totalWithdrawals,
              securityDeposit: walletInfo.securityDeposit
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

      // Check if it's a network error or server not running
      if (error.message.includes('Network error') ||
        error.message.includes('Unexpected token') ||
        error.message.includes('<!doctype') ||
        error.message.includes('Failed to fetch')) {
        console.warn('Backend server appears to be down, using default wallet data');
        console.warn('Please ensure the backend server is running on http://localhost:5000');
      }

      // Keep default wallet data on error
    } finally {
      setLoadingWallet(false);
      setIsUpdatingFromAPI(false);
    }
  }, [vendor?.vendorId]);

  // Check for pending withdrawal requests
  const checkPendingWithdrawalRequest = useCallback(async () => {
    if (!vendor?.vendorId) return;

    try {
      const token = localStorage.getItem('vendorToken');
      if (!token) return;

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/vendors/withdrawal`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const pendingRequest = data.data.find((request: any) => request.status === 'pending');
          setPendingWithdrawalRequest(pendingRequest || null);
        }
      }
    } catch (error: any) {
      // Handle network errors gracefully
      if (error?.message?.includes('Failed to fetch') || error?.name === 'TypeError') {
        console.warn('⚠️ Network error checking withdrawal requests:', error.message);
      } else {
        console.error('Error checking pending withdrawal requests:', error);
      }
    }
  }, [vendor?.vendorId]);

  // Fetch transaction history from API
  const fetchTransactionHistory = useCallback(async () => {
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

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      let response;
      try {
        response = await fetch(`${apiUrl}/vendors/wallet`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          credentials: 'include'
        });
      } catch (networkError: any) {
        // Handle network errors gracefully - use cached data if available
        console.warn('⚠️ Network error fetching transaction history:', networkError.message);
        console.warn('Backend might be down - using empty transaction history');
        // Don't throw - let the function continue with empty/default data
        setTransactionHistory([]);
        setLoadingTransactions(false);
        return;
      }

      if (!response.ok) {
        if (response.status === 404) {
          // Wallet not found, create empty transaction history
          console.warn('Vendor wallet not found, using empty transaction history');
          setTransactionHistory([]);
          setLoadingTransactions(false);
          return;
        }

        // Try to get error message from response
        let errorMessage = `HTTP ${response.status}: Failed to fetch transaction history`;
        try {
          const errorText = await response.text();
          const errorData = errorText ? JSON.parse(errorText) : null;
          if (errorData?.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // Ignore parsing errors
        }

        throw new Error(errorMessage);
      }

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Server returned non-JSON response, server might not be running');
        setTransactionHistory([]);
        setLoadingTransactions(false);
        return;
      }

      // Parse response safely
      let data;
      try {
        const responseText = await response.text();
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        console.warn('Invalid JSON response, using empty transaction history');
        setTransactionHistory([]);
        setLoadingTransactions(false);
        return;
      }

      // Check if data structure is correct - handle both old and new response formats
      if (!data.success || !data.data) {
        console.warn('Invalid API response structure:', data);
        setTransactionHistory([]);
        setLoadingTransactions(false);
        return;
      }

      // Handle both old format (data.data.recentTransactions) and new format (data.data.recentTransactions)
      const transactions = data.data.recentTransactions || data.data.transactions || [];
      if (!Array.isArray(transactions)) {
        console.warn('Transactions is not an array:', transactions);
        setTransactionHistory([]);
        setLoadingTransactions(false);
        return;
      }

      // Debug: Log all transactions received from API
      console.log('=== TRANSACTION HISTORY DEBUG ===');
      console.log('Full API response:', data);
      console.log('All transactions from API:', transactions);
      console.log('Number of transactions:', transactions.length);
      console.log('Withdrawal request transactions:', transactions.filter((t: any) => t.type === 'withdrawal_request'));
      console.log('=== END TRANSACTION HISTORY DEBUG ===');

      // Transform API data to match component interface and sort by date (latest first)
      const transformedTransactions = transactions
        .sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || a.timestamp || 0);
          const dateB = new Date(b.createdAt || b.timestamp || 0);
          return dateB.getTime() - dateA.getTime();
        })
        .map((transaction: any) => {
          // Generate proper case ID based on transaction type
          let caseId = transaction.caseId || transaction.bookingId;

          console.log('Processing transaction:', {
            id: transaction._id || transaction.id,
            type: transaction.type,
            description: transaction.description,
            caseId: transaction.caseId,
            bookingId: transaction.bookingId,
            metadata: transaction.metadata,
            status: transaction.status
          });

          // Special logging for withdrawal requests (both old and new formats)
          if (transaction.type === 'withdrawal_request' || (transaction.type === 'manual_adjustment' && transaction.description && (transaction.description.includes('Withdrawal request submitted') || transaction.description.includes('Withdrawal approved') || transaction.description.includes('Withdrawal request declined')))) {
            console.log('🔍 Found withdrawal request transaction:', {
              id: transaction._id || transaction.id,
              type: transaction.type,
              amount: transaction.amount,
              status: transaction.status,
              metadataStatus: transaction.metadata?.status,
              description: transaction.description,
              metadata: transaction.metadata,
              isPending: transaction.status === 'pending' || transaction.metadata?.status === 'pending',
              isApproved: transaction.status === 'approved' || transaction.metadata?.status === 'approved',
              isRejected: transaction.status === 'rejected' || transaction.metadata?.status === 'rejected',
              isDeclined: transaction.description?.includes('declined') || transaction.description?.includes('Declined')
            });
          }

          if (!caseId) {
            if (transaction.type === 'deposit') {
              caseId = `TXN-${(transaction._id || transaction.id).toString().slice(-6)}`;
            } else if (transaction.type === 'withdrawal_request' || (transaction.type === 'manual_adjustment' && transaction.description && (transaction.description.includes('Withdrawal request submitted') || transaction.description.includes('Withdrawal approved')))) {
              caseId = `WR-${(transaction._id || transaction.id).toString().slice(-6)}`;
            } else if (transaction.type === 'earning') {
              // For earnings, prioritize booking ID from transaction data
              if (transaction.bookingId) {
                caseId = transaction.bookingId;
                console.log('Using transaction bookingId:', caseId);
              } else {
                // Try to extract booking reference from description
                const description = transaction.description || '';
                console.log('Earning transaction description:', description);

                // Try to extract FIX booking reference first
                const bookingRefMatch = description.match(/FIX[A-Z0-9]+/);
                if (bookingRefMatch) {
                  caseId = bookingRefMatch[0];
                  console.log('Found FIX booking reference:', caseId);
                } else {
                  // Try to extract booking ID from description (long alphanumeric string)
                  const bookingIdMatch = description.match(/[a-f0-9]{24}/);
                  if (bookingIdMatch) {
                    caseId = bookingIdMatch[0];
                    console.log('Found booking ID from description:', caseId);
                  } else {
                    // Try to extract any booking ID pattern
                    const anyBookingMatch = description.match(/[a-f0-9]{8,}/);
                    if (anyBookingMatch) {
                      caseId = anyBookingMatch[0];
                      console.log('Found any booking pattern:', caseId);
                    } else {
                      caseId = `CASE_${(transaction._id || transaction.id).toString().slice(-8)}`;
                      console.log('Using fallback case ID:', caseId);
                    }
                  }
                }
              }
            } else if (transaction.type === 'penalty') {
              // For penalties, prioritize booking ID from transaction data
              if (transaction.bookingId) {
                caseId = transaction.bookingId;
                console.log('Using penalty transaction bookingId:', caseId);
              } else {
                // Try to extract booking reference from description
                const description = transaction.description || '';
                const bookingRefMatch = description.match(/FIX[A-Z0-9]+/);
                if (bookingRefMatch) {
                  caseId = bookingRefMatch[0];
                  console.log('Found FIX booking reference for penalty:', caseId);
                } else {
                  caseId = (transaction._id || transaction.id).toString().slice(-8);
                  console.log('Using fallback case ID for penalty:', caseId);
                }
              }
            } else {
              caseId = `TXN-${(transaction._id || transaction.id).toString().slice(-6)}`;
            }
          }

          // Calculate amount for withdrawal requests (both old and new formats)
          let calculatedAmount = transaction.amount;
          const isWithdrawalRequest = transaction.type === 'withdrawal_request' || (transaction.type === 'manual_adjustment' && transaction.description && (transaction.description.includes('Withdrawal request submitted') || transaction.description.includes('Withdrawal approved') || transaction.description.includes('Withdrawal request declined') || transaction.description.includes('declined')));

          if (isWithdrawalRequest) {
            const isDeclined = transaction.description?.includes('declined') || transaction.status === 'rejected' || transaction.metadata?.status === 'rejected';

            if (isDeclined) {
              // For declined requests, extract amount from "Amount refunded: ₹100" or "Amount refunded: ₹100 (Request ID: ...)"
              if (transaction.description) {
                // Try multiple patterns to extract amount
                let match = transaction.description.match(/Amount refunded: ₹(\d+(?:,\d+)*)/);
                if (!match) {
                  // Try pattern with spaces: "Amount refunded: ₹ 100"
                  match = transaction.description.match(/Amount refunded:\s*₹\s*(\d+(?:,\d+)*)/);
                }
                if (!match) {
                  // Try to find any amount after "refunded"
                  match = transaction.description.match(/refunded[^₹]*₹\s*(\d+(?:,\d+)*)/);
                }
                if (match) {
                  calculatedAmount = parseInt(match[1].replace(/,/g, ''));
                } else {
                  // Fallback: use absolute value of transaction amount or try to extract from metadata
                  if (transaction.metadata?.amountAbove5000) {
                    calculatedAmount = Math.abs(transaction.metadata.amountAbove5000);
                  } else {
                    calculatedAmount = Math.abs(transaction.amount) || 0;
                  }
                }
              } else {
                // If no description, try metadata or use absolute value
                if (transaction.metadata?.amountAbove5000) {
                  calculatedAmount = Math.abs(transaction.metadata.amountAbove5000);
                } else {
                  calculatedAmount = Math.abs(transaction.amount) || 0;
                }
              }
            } else {
              // For pending/approved requests, use negative amount
              if (transaction.metadata && transaction.metadata.amountAbove5000) {
                calculatedAmount = -transaction.metadata.amountAbove5000;
              } else if (transaction.description) {
                // Extract amount from description: "Amount above ₹5,000: ₹100"
                const match = transaction.description.match(/Amount above ₹[\d,]+: ₹(\d+(?:,\d+)*)/);
                calculatedAmount = match ? -parseInt(match[1].replace(/,/g, '')) : Math.abs(transaction.amount);
              } else {
                calculatedAmount = -Math.abs(transaction.amount);
              }
            }

            console.log('Withdrawal request amount calculation:', {
              originalAmount: transaction.amount,
              metadataAmount: transaction.metadata?.amountAbove5000,
              extractedAmount: transaction.description ? (() => {
                const match = transaction.description.match(/Amount above ₹[\d,]+: ₹(\d+(?:,\d+)*)/) || transaction.description.match(/Amount refunded: ₹(\d+(?:,\d+)*)/);
                return match ? parseInt(match[1].replace(/,/g, '')) : 0;
              })() : 0,
              finalAmount: calculatedAmount,
              isPending: transaction.description?.includes('Withdrawal request submitted'),
              isApproved: transaction.description?.includes('Withdrawal approved'),
              isDeclined: isDeclined
            });
          }

          return {
            id: transaction._id || transaction.id,
            caseId: caseId,
            bookingId: transaction.bookingId || caseId, // Store bookingId separately
            type: transaction.type === 'deposit' || transaction.type === 'earning' ? 'Payment Received' :
              transaction.type === 'withdrawal' ? 'Withdrawal' :
                transaction.type === 'withdrawal_request' || (transaction.type === 'manual_adjustment' && transaction.description && (transaction.description.includes('Withdrawal request submitted') || transaction.description.includes('Withdrawal approved'))) ? 'Withdrawal Request' :
                  transaction.type === 'penalty' ? (transaction.description && transaction.description.includes('Auto-rejection') ? 'Auto-Rejection Penalty' : 'Penalty on Cancellation') :
                    transaction.type === 'task_acceptance_fee' ? 'Task Fee' :
                      transaction.type === 'cash_collection' ? 'Collection Deducted' :
                        transaction.type === 'manual_adjustment' ? 'Admin Adjustment' : 'Earning Added',
            amount: transaction.type === 'withdrawal' || transaction.type === 'penalty' || transaction.type === 'task_acceptance_fee' || transaction.type === 'cash_collection' ?
              -Math.abs(transaction.amount) :
              transaction.type === 'withdrawal_request' || (transaction.type === 'manual_adjustment' && transaction.description && (transaction.description.includes('Withdrawal request submitted') || transaction.description.includes('Withdrawal approved') || transaction.description.includes('Withdrawal request declined') || transaction.description.includes('declined'))) ? calculatedAmount :
                transaction.type === 'manual_adjustment' ? transaction.amount : Math.abs(transaction.amount),
            date: transaction.createdAt ? new Date(transaction.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            status: transaction.type === 'withdrawal_request' || (transaction.type === 'manual_adjustment' && transaction.description && (transaction.description.includes('Withdrawal request submitted') || transaction.description.includes('Withdrawal approved') || transaction.description.includes('Withdrawal request declined') || transaction.description.includes('declined'))) ?
              (transaction.status === 'rejected' ? 'rejected' :
                transaction.status === 'approved' ? 'approved' :
                  transaction.metadata?.status === 'rejected' ? 'rejected' :
                    transaction.metadata?.status === 'approved' ? 'approved' :
                      transaction.description?.includes('Withdrawal request declined') ? 'rejected' :
                        transaction.description?.includes('declined') ? 'rejected' :
                          transaction.description?.includes('Withdrawal approved') ? 'approved' :
                            transaction.status === 'pending' ? 'pending' : 'pending') :
              (transaction.status || 'completed'),
            description: (transaction.description || 'Wallet transaction')
              .replace(/10 minutes/g, '25 minutes')
              .replace(/10 minute/g, '25 minutes')
          };
        });

      // Debug: Log final transformed transactions
      console.log('📊 Final transformed transactions:', transformedTransactions);
      console.log('📊 Number of transformed transactions:', transformedTransactions.length);

      // Log withdrawal request transactions specifically
      const withdrawalTxns = transformedTransactions.filter(t => t.type === 'Withdrawal Request');
      if (withdrawalTxns.length > 0) {
        console.log('💰 Withdrawal Request Transactions:', withdrawalTxns.map(t => ({
          type: t.type,
          status: t.status,
          amount: t.amount,
          description: t.description
        })));
      }

      setTransactionHistory(transformedTransactions);
    } catch (error: any) {
      // Handle network errors gracefully
      if (error?.message?.includes('Network error') ||
        error?.message?.includes('Unexpected token') ||
        error?.message?.includes('<!doctype') ||
        error?.message?.includes('Failed to fetch') ||
        error?.name === 'TypeError') {
        console.warn('⚠️ Network error fetching transaction history - backend might be down');
        console.warn('Using empty transaction history');
        setTransactionHistory([]);
        setLoadingTransactions(false);
        return;
      }

      console.error('Error fetching transaction history:', error);
      setTransactionHistory([]);
      setLoadingTransactions(false);
      // Show user-friendly error message for other errors
      toast({
        title: "Error",
        description: "Failed to load transaction history. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoadingTransactions(false);
    }
  }, [vendor?.vendorId]);

  // Fetch wallet data on component mount
  useEffect(() => {
    if (vendor?.vendorId) {
      console.log('🔄 Component mounted, fetching wallet data for vendor:', vendor.vendorId);
      fetchWalletData();
      fetchTransactionHistory();
      checkPendingWithdrawalRequest();

      // Set up periodic auto-refresh every 30 seconds to keep data updated
      const intervalId = setInterval(() => {
        console.log('🔄 Periodic auto-refresh of wallet data');
        fetchWalletData();
        fetchTransactionHistory();
        checkPendingWithdrawalRequest();
      }, 30000); // 30 seconds

      // Cleanup interval on unmount
      return () => clearInterval(intervalId);
    }
  }, [vendor?.vendorId, fetchWalletData, fetchTransactionHistory, checkPendingWithdrawalRequest]);

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
        securityDeposit: vendor.wallet.securityDeposit || 0,
        summary: {
          totalEarnings: 0,
          totalWithdrawals: vendor.wallet.totalWithdrawals || 0
        }
      });
      setLoadingWallet(false);
    }
  }, [vendor?.wallet, isUpdatingFromAPI]);

  // Defensive check for vendor context - MOVED AFTER ALL HOOKS
  if (!vendor) {
    console.log('⚠️ VendorEarnings: No vendor found, showing loading');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vendor data...</p>
        </div>
      </div>
    );
  }

  // Show 404 error on desktop - MOVED AFTER ALL HOOKS
  console.log('🔍 VendorEarnings: isMobile check:', isMobile);
  console.log('🔍 VendorEarnings: User agent:', navigator.userAgent);
  if (!isMobile) {
    console.log('⚠️ VendorEarnings: Desktop detected, showing NotFound');
    return <NotFound />;
  }

  console.log('✅ VendorEarnings: Mobile detected, rendering component');

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

  // Calculate actual balance from transaction history if wallet data doesn't have it
  let actualCurrentBalance = currentBalance;

  if (actualCurrentBalance === 0 && transactionHistory.length > 0) {
    // Calculate balance from transaction history
    const calculatedBalance = transactionHistory.reduce((total, transaction) => {
      if (transaction.amount > 0) {
        return total + transaction.amount; // Add deposits/payments
      } else {
        return total + transaction.amount; // Subtract withdrawals/penalties
      }
    }, 0);

    actualCurrentBalance = Math.max(0, calculatedBalance);
    console.log('🔄 Calculated balance from transactions:', calculatedBalance);
  }

  const actualSecurityDeposit = walletData.securityDeposit || (vendor?.wallet?.securityDeposit) || 0;
  const availableBalance = Math.max(0, actualCurrentBalance - actualSecurityDeposit); // Available for withdrawal
  const withdrawableAmount = Math.max(0, availableBalance - 5000); // Amount above ₹5000 that can be withdrawn
  const totalWithdrawn = walletData.summary?.totalWithdrawals || 0;

  console.log('💰 Final Balance Calculation:');
  console.log('- API Balance:', currentBalance);
  console.log('- Calculated Balance:', actualCurrentBalance);
  console.log('- Available Balance:', availableBalance);

  // Check hasInitialDeposit from multiple sources - once deposit is made, always show Yes
  const hasInitialDeposit = vendor?.wallet?.hasInitialDeposit ||
    walletData.hasInitialDeposit ||
    (actualCurrentBalance >= actualSecurityDeposit && actualCurrentBalance > 0) ||
    (vendor?.wallet?.totalDeposits > 0) ||
    (walletData.totalDeposits > 0);

  // Debug logging
  console.log('=== CURRENT STATE ===');
  console.log('Vendor ID:', vendor?.vendorId);
  console.log('Wallet data:', walletData);
  console.log('Current balance:', actualCurrentBalance);
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

    if (!hasInitialDeposit && amount < actualSecurityDeposit) {
      toast({
        title: "Minimum Initial Deposit Required",
        description: `You must deposit at least ₹${actualSecurityDeposit.toLocaleString()} for your initial deposit.`,
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
          setDepositAmount('');
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

    // Check if available balance is less than ₹5000
    if (availableBalance < 5000) {
      toast({
        title: "Withdrawal Not Available",
        description: `Withdrawal will be available after your balance reaches ₹5,000. Current available balance: ₹${availableBalance.toLocaleString()}`,
        variant: "destructive"
      });
      setIsWithdrawModalOpen(false);
      return;
    }

    // Validate amount
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount.",
        variant: "destructive"
      });
      return;
    }

    // Check if withdrawal amount is valid (should be the amount above ₹5000)
    if (amount <= 0) {
      toast({
        title: "Invalid Withdrawal Amount",
        description: "Please enter a valid withdrawal amount.",
        variant: "destructive"
      });
      return;
    }

    // Check if withdrawal amount exceeds the amount available above ₹5000
    if (amount > withdrawableAmount) {
      toast({
        title: "Insufficient Withdrawable Amount",
        description: `You can only withdraw ₹${withdrawableAmount.toLocaleString()} (the amount above ₹5,000). Available balance: ₹${availableBalance.toLocaleString()}`,
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
        description: `Your withdrawal request for ₹${amount.toLocaleString()} (amount above ₹5,000) has been submitted successfully. Only ₹${amount.toLocaleString()} will be deducted from your wallet. It will be processed within 24-48 hours.`,
      });

      setIsWithdrawModalOpen(false);
      setWithdrawAmount('');
      setIsProcessingWithdraw(false);

      // Refresh wallet data and pending requests after withdrawal request
      await Promise.all([fetchWalletData(), fetchTransactionHistory(), checkPendingWithdrawalRequest()]);
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
    const headers = ['Transaction ID', 'Booking ID', 'Type', 'Amount', 'Date', 'Description', 'Status'];
    const csvContent = [
      headers.join(','),
      ...transactionHistory.map(transaction => [
        transaction.id,
        (transaction as any).bookingId || transaction.caseId || 'N/A',
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

    // Show all transactions now that 3999 system is gone
    return true;

    // Hide subscription-related transactions
    if (transaction.type && (
      transaction.type.toLowerCase().includes('subscription') ||
      transaction.type.toLowerCase().includes('initial deposit') ||
      transaction.description?.toLowerCase().includes('subscription') ||
      transaction.description?.toLowerCase().includes('initial deposit')
    )) {
      return false;
    }

    switch (activeFilter) {
      case 'All':
        return true;
      case 'Payment Received':
        return transaction.type === 'Payment Received';
      case 'Withdraw':
        return transaction.type === 'Withdraw Transferred' || transaction.type === 'Withdrawal Successful' || transaction.type === 'Withdrawal' || transaction.type === 'Withdrawal Request';
      case 'Penalty':
        return transaction.type === 'Penalty on Cancellation';
      case 'Admin Adjustment':
        return transaction.type === 'Admin Adjustment';
      default:
        return true;
    }
  });

  // Debug: Log filtered transactions
  console.log('Filtered transactions:', filteredTransactions);
  console.log('Withdrawal request transactions in filtered list:', filteredTransactions.filter((t: any) => t.type === 'Withdrawal Request'));

  const getTransactionIcon = (type: string, status?: string) => {
    switch (type) {
      case "Payment Received":
      case "Earning Added":
      case "Cash Received by Customer":
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case "Withdraw Transferred":
      case "Withdrawal Successful":
      case "Withdrawal":
      case "Penalty on Cancellation":
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      case "Withdrawal Request":
        return status === 'approved' ? <TrendingDown className="w-5 h-5 text-green-600" /> : <Clock className="w-5 h-5 text-orange-600" />;
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
      case "Withdrawal Successful":
      case "Withdrawal":
      case "Penalty on Cancellation":
      case "Auto-Rejection Penalty":
        return "text-red-600";
      case "Withdrawal Request":
        return "text-orange-600";
      case "Admin Adjustment":
        return "text-purple-600";
      default:
        return "text-blue-600";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <VendorHeader />
      <main className="flex-1 pb-24 md:pb-0 pt-16 md:pt-0 overflow-y-auto">
        <div className="container mx-auto px-4 py-4">
          {/* Mandatory Deposit Alert */}
          {!hasInitialDeposit && (
            <div className="mb-6 md:hidden">
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <div className="space-y-3">
                    <div>
                      <strong>Mandatory Deposit Required:</strong> You must deposit ₹{actualSecurityDeposit.toLocaleString()} to access all features.
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
                        <p className="text-lg font-bold text-primary">₹{availableBalance.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
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
                            min={hasInitialDeposit ? "1" : actualSecurityDeposit.toString()}
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            {hasInitialDeposit
                              ? "Additional deposit - any amount above ₹1"
                              : `Minimum initial deposit: ₹${actualSecurityDeposit.toLocaleString()}`
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
                            placeholder={availableBalance >= 5000 ? `Enter amount above ₹5,000 (max: ₹${withdrawableAmount.toLocaleString()})` : "Enter amount"}
                            min={availableBalance < 5000 ? "0" : "1"}
                            max={availableBalance >= 5000 ? withdrawableAmount : availableBalance}
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            Available balance: ₹{availableBalance.toLocaleString()}
                            {availableBalance >= 5000 && (
                              <span className="block text-orange-600 font-medium">
                                Withdrawable amount: ₹{withdrawableAmount.toLocaleString()} (amount above ₹5,000)
                              </span>
                            )}
                          </p>
                        </div>

                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-2">
                              <div>Withdrawal requests are processed within 24-48 hours. Please ensure your bank details are up to date.</div>
                              <div className="font-medium text-orange-700">
                                You can only withdraw amounts above ₹5,000. For example, if your balance is ₹5,100, you can withdraw ₹100.
                              </div>
                            </div>
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
                    onClick={() => {
                      if (pendingWithdrawalRequest) {
                        toast({
                          title: "Withdrawal Request Already Pending",
                          description: `You already have a pending withdrawal request for ₹${pendingWithdrawalRequest.amount.toLocaleString()}. Please wait for it to be processed before making a new request.`,
                          variant: "destructive"
                        });
                      } else if (availableBalance < 5000) {
                        toast({
                          title: "Withdrawal Not Available",
                          description: `Withdrawal will be available after your balance reaches ₹5,000. Current available balance: ₹${availableBalance.toLocaleString()}`,
                          variant: "destructive"
                        });
                      } else if (withdrawableAmount <= 0) {
                        toast({
                          title: "No Withdrawable Amount",
                          description: `You need more than ₹5,000 to withdraw. Current available balance: ₹${availableBalance.toLocaleString()}. You can only withdraw amounts above ₹5,000.`,
                          variant: "destructive"
                        });
                      } else {
                        setIsWithdrawModalOpen(true);
                      }
                    }}
                    disabled={!hasInitialDeposit || !!pendingWithdrawalRequest}
                  >
                    {pendingWithdrawalRequest ? 'Request Pending' : 'Withdraw'}
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Filters */}
          <div className="mb-4 md:hidden">
            <div className="flex flex-wrap gap-1.5">
              <button
                className={`text-xs px-2 py-1 rounded-md transition-colors ${activeFilter === 'All'
                  ? 'btn-tech'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                onClick={() => setActiveFilter('All')}
              >
                All
              </button>
              <button
                className={`text-xs px-2 py-1 rounded-md transition-colors ${activeFilter === 'Payment Received'
                  ? 'btn-tech'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                onClick={() => setActiveFilter('Payment Received')}
              >
                Payment
              </button>
              <button
                className={`text-xs px-2 py-1 rounded-md transition-colors ${activeFilter === 'Withdraw'
                  ? 'btn-tech'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                onClick={() => setActiveFilter('Withdraw')}
              >
                Withdraw
              </button>
              <button
                className={`text-xs px-2 py-1 rounded-md transition-colors ${activeFilter === 'Penalty'
                  ? 'btn-tech'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                onClick={() => setActiveFilter('Penalty')}
              >
                Penalty
              </button>
              <button
                className={`text-xs px-2 py-1 rounded-md transition-colors ${activeFilter === 'Admin Adjustment'
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
              <div className="flex gap-2">
                <button
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  onClick={() => {
                    fetchTransactionHistory();
                    checkPendingWithdrawalRequest();
                  }}
                >
                  Refresh
                </button>
              </div>
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
                      className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer break-words overflow-hidden"
                      onClick={() => {
                        // Show transaction details
                        const bookingId = formatBookingId((transaction as any).bookingId || transaction.caseId);
                        alert(`Transaction Details:\n\nID: ${transaction.id}\nBooking ID: ${bookingId}\nType: ${transaction.type}\nAmount: ₹${Math.abs(transaction.amount).toLocaleString()}\nDate: ${transaction.date}\nDescription: ${formatDescription(transaction.description)}`);
                      }}
                    >
                      <div className="flex items-center justify-between mb-3 gap-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {getTransactionIcon(transaction.type, transaction.status)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-foreground break-words">{transaction.type}</h3>
                              {transaction.type === 'Withdrawal Request' && (
                                <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${transaction.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                                  transaction.status === 'approved' ? 'bg-green-100 text-green-800' :
                                    transaction.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                      transaction.status === 'declined' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                  }`}>
                                  {transaction.status === 'approved' ? 'success' :
                                    transaction.status === 'rejected' ? 'rejected' :
                                      transaction.status === 'declined' ? 'rejected' :
                                        transaction.status}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground break-words">
                              Booking ID: {formatBookingId((transaction as any).bookingId || transaction.caseId)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`font-bold ${getTransactionColor(transaction.type)}`}>
                            {(() => {
                              // Use calculatedAmount if available (actual credited amount), otherwise use amount
                              const displayAmount = (transaction as any).calculatedAmount !== undefined
                                ? (transaction as any).calculatedAmount
                                : transaction.amount;
                              return (displayAmount > 0 ? '+' : '') + '₹' + Math.abs(displayAmount).toLocaleString();
                            })()}
                          </p>
                          <p className="text-sm text-muted-foreground">{transaction.date}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground break-words">{formatDescription(transaction.description)}</p>
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