import React, { useState, useEffect } from 'react';
import AdminHeader from '../components/AdminHeader';
import {
  Wallet,
  Search,
  Filter,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  User,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  AlertTriangle,
  MoreVertical,
  Download,
  RefreshCw,
  Plus,
  Minus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import adminApiService from '@/services/adminApi';

interface VendorWallet {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  vendorPhone: string;
  currentBalance: number;
  totalEarnings: number;
  totalWithdrawals: number;
  totalDeposits: number;
  securityDeposit: number;
  availableBalance: number;
  onlineCollected: number;
  cashCollected: number;
  isActive: boolean;
  isApproved: boolean;
  lastTransaction: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WalletTransaction {
  id: string;
  vendorId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  reference: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
}

interface WithdrawalRequest {
  _id: string;
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  vendorPhone: string;
  amount: number;
  status: 'pending' | 'approved' | 'declined' | 'processed';
  processedBy?: string;
  processedAt?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const AdminVendorWalletManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isViewWalletOpen, setIsViewWalletOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<VendorWallet | null>(null);
  const [isViewTransactionsOpen, setIsViewTransactionsOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');

  // State for vendor wallets data
  const [vendorWallets, setVendorWallets] = useState<VendorWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);

  // State for recent transactions in wallet details modal
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const [newTransaction, setNewTransaction] = useState({
    vendorId: '',
    type: 'credit',
    amount: '',
    description: '',
    reference: ''
  });

  // Edit wallet state
  const [isEditWalletOpen, setIsEditWalletOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<VendorWallet | null>(null);
  const [editForm, setEditForm] = useState({
    currentBalance: '',
    description: ''
  });

  // Fetch vendor wallets data
  const fetchVendorWallets = async () => {
    try {
      setLoading(true);
      setError(null);

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await adminApiService.makeAuthenticatedRequest(`${API_BASE_URL}/admin/wallets`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setVendorWallets(data.data.vendors);
      } else {
        throw new Error(data.message || 'Failed to fetch vendor wallets');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch withdrawal requests
  const fetchWithdrawalRequests = async () => {
    try {
      setLoadingWithdrawals(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      console.log('Fetching withdrawal requests from:', `${API_BASE_URL}/admin/withdrawals`);

      const response = await adminApiService.makeAuthenticatedRequest(`${API_BASE_URL}/admin/withdrawals`, {
        method: 'GET'
      }).catch((fetchError) => {
        console.error('Network error fetching withdrawal requests:', fetchError);
        // If it's a network error, it might be CORS or server not running
        if (fetchError instanceof TypeError && fetchError.message === 'Failed to fetch') {
          throw new Error('Cannot connect to server. Please make sure the backend server is running.');
        }
        throw fetchError;
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to fetch withdrawal requests';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${errorText || response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Withdrawal requests response:', data);

      if (data.success && data.data) {
        setWithdrawalRequests(data.data.requests || []);
      } else {
        console.warn('Unexpected response format:', data);
        setWithdrawalRequests([]);
      }
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
      // Don't show error to user if it's just a network issue, just set empty array
      setWithdrawalRequests([]);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  // Approve withdrawal request
  const approveWithdrawalRequest = async (requestId: string, adminNotes: string = '') => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await adminApiService.makeAuthenticatedRequest(`${API_BASE_URL}/admin/withdrawals/${requestId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminNotes })
      });

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = 'Failed to approve withdrawal request';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }
        throw new Error(`${errorMessage} (Status: ${response.status})`);
      }

      // Refresh withdrawal requests and vendor wallets
      await Promise.all([fetchWithdrawalRequests(), fetchVendorWallets()]);

      alert('Withdrawal request approved successfully!');
    } catch (error) {
      console.error('Error approving withdrawal request:', error);
      alert(`Failed to approve withdrawal request: ${error.message}`);
    }
  };

  // Decline withdrawal request
  const declineWithdrawalRequest = async (requestId: string, adminNotes: string = '') => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await adminApiService.makeAuthenticatedRequest(`${API_BASE_URL}/admin/withdrawals/${requestId}/decline`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminNotes })
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to decline withdrawal request';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Refresh withdrawal requests
      await fetchWithdrawalRequests();

      alert(data.message || 'Withdrawal request declined successfully!');
    } catch (error: any) {
      console.error('Error declining withdrawal request:', error);
      const errorMessage = error?.message || 'Failed to decline withdrawal request. Please try again.';
      alert(errorMessage);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchVendorWallets();
    fetchWithdrawalRequests();
  }, []);

  const filteredWallets = vendorWallets.filter(wallet => {
    const matchesSearch = wallet.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wallet.vendorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wallet.vendorPhone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && wallet.isActive && wallet.isApproved) ||
      (statusFilter === 'suspended' && !wallet.isActive) ||
      (statusFilter === 'pending' && !wallet.isApproved);
    return matchesSearch && matchesStatus;
  });

  const filteredTransactions = walletTransactions.filter(transaction => {
    return selectedVendorId === '' || transaction.vendorId === selectedVendorId;
  });

  // Fetch wallet details with transactions
  const fetchWalletDetails = async (vendorId: string) => {
    try {
      setLoadingTransactions(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await adminApiService.makeAuthenticatedRequest(
        `${API_BASE_URL}/admin/wallets/${vendorId}?limit=10`,
        {
          method: 'GET'
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Wallet details response:', data);
      console.log('Transactions data:', data.data?.transactions);
      console.log('Transactions count:', data.data?.transactions?.length);

      if (data.success && data.data && data.data.transactions) {
        // Transform transactions to match the expected format
        // Credit types: deposit, earning, refund, bonus
        // Debit types: withdrawal, penalty
        const creditTypes = ['deposit', 'earning', 'refund', 'bonus'];
        const transformedTransactions = data.data.transactions.map((txn: any) => {
          // Determine if it's a credit based on type OR if amount is positive
          // This ensures manual adjustments that ADD balance show as green/credit
          const isCredit = creditTypes.includes(txn.type?.toLowerCase()) || (txn.amount > 0);
          return {
            id: txn._id || txn.transactionId,
            vendorId: txn.vendorId,
            type: isCredit ? 'credit' : 'debit',
            amount: Math.abs(txn.amount || 0),
            description: txn.description || txn.type || 'Transaction',
            reference: txn.transactionId || txn._id,
            status: txn.status || 'completed',
            createdAt: txn.createdAt || txn.timestamp || new Date().toISOString()
          };
        });
        console.log('Transformed transactions:', transformedTransactions);
        setRecentTransactions(transformedTransactions);
      } else {
        console.log('No transactions found in response');
        setRecentTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching wallet details:', error);
      setRecentTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleViewWallet = async (wallet: VendorWallet) => {
    setSelectedWallet(wallet);
    setIsViewWalletOpen(true);
    // Fetch recent transactions when modal opens
    await fetchWalletDetails(wallet.vendorId);
  };

  const handleViewTransactions = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    setIsViewTransactionsOpen(true);
  };

  const handleEditWallet = (wallet: VendorWallet) => {
    setEditingWallet(wallet);
    setEditForm({
      currentBalance: wallet.availableBalance.toString(),
      description: ''
    });
    setIsEditWalletOpen(true);
  };

  const handleUpdateWallet = async () => {
    if (!editingWallet) return;

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await adminApiService.makeAuthenticatedRequest(`${API_BASE_URL}/admin/wallets/${editingWallet.vendorId}/adjust`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentBalance: parseFloat(editForm.currentBalance) + editingWallet.securityDeposit,
          description: editForm.description
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        // Update the wallet in the local state
        setVendorWallets(prev => prev.map(wallet =>
          wallet.vendorId === editingWallet.vendorId
            ? { ...wallet, currentBalance: parseFloat(editForm.currentBalance) + editingWallet.securityDeposit }
            : wallet
        ));

        setIsEditWalletOpen(false);
        setEditingWallet(null);
        setEditForm({ currentBalance: '', description: '', adjustmentType: 'credit' });

        // Show success message
        alert('Wallet balance updated successfully!');
      } else {
        throw new Error(data.message || 'Failed to update wallet');
      }
    } catch (error) {
      console.error('Error updating wallet:', error);
      alert('Failed to update wallet balance. Please try again.');
    }
  };

  const handleAddTransaction = () => {
    if (newTransaction.vendorId && newTransaction.amount && newTransaction.description) {
      const transaction: WalletTransaction = {
        id: `txn_${Date.now()}`,
        vendorId: newTransaction.vendorId,
        type: newTransaction.type as 'credit' | 'debit',
        amount: parseFloat(newTransaction.amount),
        description: newTransaction.description,
        reference: newTransaction.reference || `REF_${Date.now()}`,
        status: 'completed',
        createdAt: new Date().toISOString()
      };

      setWalletTransactions(prev => [transaction, ...prev]);

      // Update wallet balance
      setVendorWallets(prev => prev.map(wallet => {
        if (wallet.vendorId === newTransaction.vendorId) {
          const amount = parseFloat(newTransaction.amount);
          return {
            ...wallet,
            currentBalance: newTransaction.type === 'credit'
              ? wallet.currentBalance + amount
              : wallet.currentBalance - amount,
            totalEarnings: newTransaction.type === 'credit'
              ? wallet.totalEarnings + amount
              : wallet.totalEarnings,
            totalWithdrawals: newTransaction.type === 'debit'
              ? wallet.totalWithdrawals + amount
              : wallet.totalWithdrawals,
            lastTransaction: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
        return wallet;
      }));

      setNewTransaction({
        vendorId: '',
        type: 'credit',
        amount: '',
        description: '',
        reference: ''
      });
      setIsAddTransactionOpen(false);
    }
  };


  // Calculate total stats
  const totalBalance = vendorWallets.reduce((sum, wallet) => sum + wallet.availableBalance, 0);
  const totalDeposits = vendorWallets.reduce((sum, wallet) => sum + wallet.totalDeposits, 0);
  const totalEarnings = vendorWallets.reduce((sum, wallet) => sum + wallet.totalEarnings, 0);
  const totalWithdrawals = vendorWallets.reduce((sum, wallet) => sum + wallet.totalWithdrawals, 0);
  const activeWallets = vendorWallets.filter(wallet => wallet.isActive && wallet.isApproved).length;

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="ml-72 pt-32 p-6">
        {/* Page Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">
                Vendor <span className="text-gradient">Wallet</span> Management
              </h1>
              <p className="text-sm text-muted-foreground">Manage vendor wallets, transactions, and payments</p>
            </div>

          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Balance</p>
                  <p className="text-lg font-bold">₹{totalBalance.toLocaleString()}</p>
                </div>
                <Wallet className="h-6 w-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Deposits</p>
                  <p className="text-lg font-bold">₹{totalDeposits.toLocaleString()}</p>
                </div>
                <CreditCard className="h-6 w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Earnings</p>
                  <p className="text-lg font-bold">₹{totalEarnings.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Withdrawals</p>
                  <p className="text-lg font-bold">₹{totalWithdrawals.toLocaleString()}</p>
                </div>
                <TrendingDown className="h-6 w-6 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Active Wallets</p>
                  <p className="text-lg font-bold">{activeWallets}</p>
                </div>
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-center">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                <p className="text-sm">Loading vendor wallets...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <p className="text-sm">Error: {error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchVendorWallets}
                  className="ml-4 text-xs"
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="wallets" className="space-y-4">
          <TabsList>
            <TabsTrigger value="wallets">Vendor Wallets</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawal Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="wallets" className="space-y-4">
            {/* Filters and Search */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search vendors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 text-sm"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-40 text-sm">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Wallets Table */}
            {!loading && !error && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Vendor Wallets ({filteredWallets.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Available Balance</TableHead>
                        <TableHead>Total Deposits</TableHead>
                        <TableHead>Total Withdrawals</TableHead>
                        <TableHead>Total Earnings</TableHead>
                        <TableHead>Online Collected</TableHead>
                        <TableHead>Cash Collected</TableHead>
                        <TableHead>Last Transaction</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWallets.map((wallet) => (
                        <TableRow key={wallet.id}>
                          <TableCell>
                            <div className="text-sm font-medium">{wallet.vendorName}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">{wallet.vendorEmail}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">{wallet.vendorPhone}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-3 w-3 text-green-500" />
                              <span className="text-sm font-medium">₹{wallet.availableBalance.toLocaleString()}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <CreditCard className="h-3 w-3 text-blue-500" />
                              <span className="text-sm font-medium">₹{wallet.totalDeposits.toLocaleString()}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <TrendingDown className="h-3 w-3 text-red-500" />
                              <span className="text-sm font-medium">₹{wallet.totalWithdrawals.toLocaleString()}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium">₹{wallet.totalEarnings.toLocaleString()}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <CreditCard className="h-3 w-3 text-blue-500" />
                              <span className="text-sm font-medium">₹{wallet.onlineCollected.toLocaleString()}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Banknote className="h-3 w-3 text-orange-500" />
                              <span className="text-sm font-medium">₹{wallet.cashCollected.toLocaleString()}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs">
                              {wallet.lastTransaction
                                ? new Date(wallet.lastTransaction).toLocaleDateString()
                                : 'No transactions'
                              }
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewWallet(wallet)}
                                className="text-xs"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditWallet(wallet)}
                                className="text-xs"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
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
          </TabsContent>


          <TabsContent value="withdrawals" className="space-y-4">
            {/* Withdrawal Requests Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Withdrawal Requests ({withdrawalRequests.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {loadingWithdrawals ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-2 text-muted-foreground">Loading withdrawal requests...</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Request ID</TableHead>
                        <TableHead>Vendor Name</TableHead>
                        <TableHead>Vendor ID</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawalRequests.map((request) => (
                        <TableRow key={request._id}>
                          <TableCell className="font-mono text-sm">
                            {request._id.slice(-8)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {request.vendorName}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {request.vendorId}
                          </TableCell>
                          <TableCell>{request.vendorEmail}</TableCell>
                          <TableCell>{request.vendorPhone}</TableCell>
                          <TableCell className="font-medium">
                            ₹{request.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                request.status === 'pending' ? 'secondary' :
                                  request.status === 'approved' ? 'default' :
                                    request.status === 'declined' ? 'destructive' : 'outline'
                              }
                            >
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(request.createdAt).toLocaleString('en-IN', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </TableCell>
                          <TableCell>
                            {request.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    approveWithdrawalRequest(request._id, '');
                                  }}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    const notes = prompt('Add reason for decline:');
                                    if (notes !== null) {
                                      declineWithdrawalRequest(request._id, notes);
                                    }
                                  }}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Decline
                                </Button>
                              </div>
                            )}
                            {request.status !== 'pending' && (
                              <span className="text-sm text-muted-foreground">
                                {request.processedAt ?
                                  `Processed on ${new Date(request.processedAt).toLocaleString('en-IN', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  })}` :
                                  'Processed'
                                }
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {withdrawalRequests.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No withdrawal requests found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Transaction Dialog */}
        <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
          <DialogContent className="max-w-2xl mt-12">
            <DialogHeader>
              <DialogTitle className="text-lg">Add New Transaction</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="vendorId" className="text-sm">Select Vendor</Label>
                <Select value={newTransaction.vendorId} onValueChange={(value) => setNewTransaction(prev => ({ ...prev, vendorId: value }))}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendorWallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.vendorId}>
                        {wallet.vendorName} ({wallet.vendorEmail})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="transactionType" className="text-sm">Transaction Type</Label>
                  <Select value={newTransaction.type} onValueChange={(value) => setNewTransaction(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit">Credit</SelectItem>
                      <SelectItem value="debit">Debit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount" className="text-sm">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter amount"
                    className="text-sm"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm">Description</Label>
                <Textarea
                  id="description"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter transaction description"
                  rows={3}
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="reference" className="text-sm">Reference (Optional)</Label>
                <Input
                  id="reference"
                  value={newTransaction.reference}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, reference: e.target.value }))}
                  placeholder="Enter reference number"
                  className="text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddTransaction} className="flex-1 text-xs" size="sm">
                  Add Transaction
                </Button>
                <Button variant="outline" onClick={() => setIsAddTransactionOpen(false)} size="sm" className="text-xs">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Wallet Dialog */}
        <Dialog open={isViewWalletOpen} onOpenChange={(open) => {
          setIsViewWalletOpen(open);
          if (!open) {
            // Clear transactions when modal closes
            setRecentTransactions([]);
            setSelectedWallet(null);
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto mt-10">
            <DialogHeader>
              <DialogTitle className="text-lg">Wallet Details</DialogTitle>
            </DialogHeader>
            {selectedWallet && (
              <div className="space-y-4">
                {/* Vendor Information */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Vendor Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Name</Label>
                      <p className="text-xs">{selectedWallet.vendorName}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                      <p className="text-xs">{selectedWallet.vendorEmail}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Phone</Label>
                      <p className="text-xs">{selectedWallet.vendorPhone}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Status</Label>
                      <Badge variant={
                        selectedWallet.isActive && selectedWallet.isApproved ? 'default' :
                          !selectedWallet.isActive ? 'destructive' : 'secondary'
                      } className="text-xs">
                        {selectedWallet.isActive && selectedWallet.isApproved ? 'Active' :
                          !selectedWallet.isActive ? 'Suspended' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Wallet Summary */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Wallet Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <Card>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Current Balance</p>
                            <p className="text-lg font-bold text-green-600">₹{selectedWallet.availableBalance.toLocaleString()}</p>
                          </div>
                          <Wallet className="h-6 w-6 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Total Deposits</p>
                            <p className="text-lg font-bold text-blue-600">₹{selectedWallet.totalDeposits.toLocaleString()}</p>
                          </div>
                          <CreditCard className="h-6 w-6 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Total Earnings</p>
                            <p className="text-lg font-bold text-blue-600">₹{selectedWallet.totalEarnings.toLocaleString()}</p>
                          </div>
                          <TrendingUp className="h-6 w-6 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Cash Collected</p>
                            <p className="text-lg font-bold text-orange-600">₹{selectedWallet.cashCollected.toLocaleString()}</p>
                          </div>
                          <Banknote className="h-6 w-6 text-orange-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Recent Transactions */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Recent Transactions</h3>
                  {loadingTransactions ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                      <p className="text-sm text-muted-foreground">Loading transactions...</p>
                    </div>
                  ) : recentTransactions.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {recentTransactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            {transaction.type === 'credit' ? (
                              <Plus className="h-4 w-4 text-green-500" />
                            ) : (
                              <Minus className="h-4 w-4 text-red-500" />
                            )}
                            <div>
                              <p className="text-sm font-medium">{transaction.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(transaction.createdAt).toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-medium ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                              {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                            </p>
                            <Badge variant={
                              transaction.status === 'completed' ? 'default' :
                                transaction.status === 'pending' ? 'secondary' : 'destructive'
                            } className="text-xs">
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border rounded-lg">
                      <p className="text-sm text-muted-foreground">No recent transactions found</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">


                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* View Transactions Dialog */}
        <Dialog open={isViewTransactionsOpen} onOpenChange={setIsViewTransactionsOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Transaction History</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {filteredTransactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <span className="font-mono text-sm">{transaction.id}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.type === 'credit' ? 'default' : 'secondary'}>
                            {transaction.type === 'credit' ? (
                              <Plus className="w-3 h-3 mr-1" />
                            ) : (
                              <Minus className="w-3 h-3 mr-1" />
                            )}
                            {transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            <span className="font-medium">₹{transaction.amount.toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{transaction.description}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-mono">{transaction.reference}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            transaction.status === 'completed' ? 'default' :
                              transaction.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {transaction.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {transaction.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                            {transaction.status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No transactions found for this vendor.</p>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setIsViewTransactionsOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Wallet Dialog */}
        <Dialog open={isEditWalletOpen} onOpenChange={setIsEditWalletOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Wallet Balance</DialogTitle>
            </DialogHeader>
            {editingWallet && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor-name">Vendor</Label>
                  <Input
                    id="vendor-name"
                    value={`${editingWallet.vendorName} (${editingWallet.vendorId})`}
                    readOnly
                    className="bg-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current-balance">Available Balance</Label>
                  <Input
                    id="current-balance"
                    type="number"
                    value={editForm.currentBalance}
                    onChange={(e) => setEditForm(prev => ({ ...prev, currentBalance: e.target.value }))}
                    placeholder="Enter new available balance"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Reason for balance adjustment"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsEditWalletOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateWallet}>
                    Update Balance
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

export default AdminVendorWalletManagement;


