import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  DollarSign,
  Users,
  Activity
} from 'lucide-react';

interface VendorWallet {
  id: string;
  vendorId: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  isApproved: boolean;
  wallet: {
    currentBalance: number;
    hasInitialDeposit: boolean;
    initialDepositAmount: number;
    lastTransactionAt: string;
    summary: {
      totalDeposits: number;
      totalWithdrawals: number;
      totalEarnings: number;
      totalPenalties: number;
      totalRefunds: number;
      totalBonuses: number;
      transactionCounts: Record<string, number>;
    };
  };
  recentTransactions: Array<{
    _id: string;
    transactionId: string;
    amount: number;
    type: string;
    description: string;
    status: string;
    createdAt: string;
    formattedAmount: string;
    typeDisplay: string;
  }>;
}

interface WalletStatistics {
  overallStats: Array<{
    _id: string;
    totalAmount: number;
    count: number;
    avgAmount: number;
  }>;
  dailyVolume: Array<{
    _id: { year: number; month: number; day: number };
    totalAmount: number;
    count: number;
  }>;
  topVendors: Array<{
    _id: string;
    totalAmount: number;
    transactionCount: number;
  }>;
  totalBalances: {
    totalBalance: number;
    totalDeposits: number;
    vendorsWithDeposits: number;
    totalVendors: number;
  };
}

const AdminWalletManagement: React.FC = () => {
  const [vendors, setVendors] = useState<VendorWallet[]>([]);
  const [statistics, setStatistics] = useState<WalletStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<VendorWallet | null>(null);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    type: 'deposit',
    description: '',
    adminNotes: ''
  });
  const { toast } = useToast();

  // Fetch vendor wallets
  const fetchVendorWallets = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/wallets', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch vendor wallets');
      }

      const data = await response.json();
      setVendors(data.data.vendors);
    } catch (error) {
      console.error('Error fetching vendor wallets:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch vendor wallets',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch wallet statistics
  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/wallets/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const data = await response.json();
      setStatistics(data.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // Add manual transaction
  const handleAddTransaction = async () => {
    if (!selectedVendor || !newTransaction.amount || !newTransaction.description) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/wallets/${selectedVendor.vendorId}/transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTransaction),
      });

      if (!response.ok) {
        throw new Error('Failed to add transaction');
      }

      toast({
        title: 'Success',
        description: 'Transaction added successfully',
      });

      setIsAddTransactionOpen(false);
      setNewTransaction({ amount: '', type: 'deposit', description: '', adminNotes: '' });
      fetchVendorWallets();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to add transaction',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchVendorWallets();
    fetchStatistics();
  }, []);

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.vendorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wallet data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Wallet Management</h1>
          <p className="text-gray-600">Manage vendor wallets and transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchVendorWallets}>
            <Download className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{statistics.totalBalances.totalBalance.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Across {statistics.totalBalances.totalVendors} vendors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{statistics.totalBalances.totalDeposits.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {statistics.totalBalances.vendorsWithDeposits} vendors with deposits
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vendors.filter(v => v.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Out of {vendors.length} total vendors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vendors.filter(v => v.wallet.lastTransactionAt).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Vendors with recent transactions
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Wallets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Vendors Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Current Balance</TableHead>
                  <TableHead>Total Deposits</TableHead>
                  <TableHead>Last Transaction</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{vendor.name}</div>
                        <div className="text-sm text-gray-500">ID: {vendor.vendorId}</div>
                        <div className="text-sm text-gray-500">{vendor.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant={vendor.isActive ? 'default' : 'secondary'}>
                          {vendor.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant={vendor.isApproved ? 'default' : 'outline'}>
                          {vendor.isApproved ? 'Approved' : 'Pending'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        ₹{vendor.wallet.currentBalance.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        ₹{vendor.wallet.summary.totalDeposits.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {vendor.wallet.lastTransactionAt
                          ? new Date(vendor.wallet.lastTransactionAt).toLocaleDateString()
                          : 'No transactions'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedVendor(vendor);
                            setIsAddTransactionOpen(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Transaction
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Transaction Dialog */}
      <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Manual Transaction</DialogTitle>
            <DialogDescription>
              Add a manual transaction for {selectedVendor?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                placeholder="Enter amount"
              />
            </div>
            <div>
              <Label htmlFor="type">Transaction Type</Label>
              <Select
                value={newTransaction.type}
                onValueChange={(value) => setNewTransaction({ ...newTransaction, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="earning">Earning</SelectItem>
                  <SelectItem value="penalty">Penalty</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                placeholder="Enter description"
              />
            </div>
            <div>
              <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
              <Input
                id="adminNotes"
                value={newTransaction.adminNotes}
                onChange={(e) => setNewTransaction({ ...newTransaction, adminNotes: e.target.value })}
                placeholder="Enter admin notes"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleAddTransaction} className="flex-1">
                Add Transaction
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAddTransactionOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWalletManagement;
