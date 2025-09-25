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

interface VendorWallet {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  vendorPhone: string;
  currentBalance: number;
  totalEarnings: number;
  totalWithdrawals: number;
  pendingAmount: number;
  lastTransaction: string;
  status: 'active' | 'suspended' | 'pending';
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

const AdminVendorWalletManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isViewWalletOpen, setIsViewWalletOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<VendorWallet | null>(null);
  const [isViewTransactionsOpen, setIsViewTransactionsOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');

  // Mock data - will be replaced with API calls
  const [vendorWallets, setVendorWallets] = useState<VendorWallet[]>([
    {
      id: '1',
      vendorId: 'vendor_001',
      vendorName: 'John Smith',
      vendorEmail: 'john@example.com',
      vendorPhone: '+91 98765 43210',
      currentBalance: 15000,
      totalEarnings: 25000,
      totalWithdrawals: 10000,
      pendingAmount: 2500,
      lastTransaction: '2024-01-15T10:30:00Z',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      vendorId: 'vendor_002',
      vendorName: 'Sarah Johnson',
      vendorEmail: 'sarah@example.com',
      vendorPhone: '+91 98765 43211',
      currentBalance: 8500,
      totalEarnings: 18000,
      totalWithdrawals: 9500,
      pendingAmount: 1200,
      lastTransaction: '2024-01-14T15:45:00Z',
      status: 'active',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-14T15:45:00Z'
    },
    {
      id: '3',
      vendorId: 'vendor_003',
      vendorName: 'Mike Wilson',
      vendorEmail: 'mike@example.com',
      vendorPhone: '+91 98765 43212',
      currentBalance: 0,
      totalEarnings: 5000,
      totalWithdrawals: 5000,
      pendingAmount: 0,
      lastTransaction: '2024-01-10T09:20:00Z',
      status: 'suspended',
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-10T09:20:00Z'
    }
  ]);

  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([
    {
      id: 'txn_001',
      vendorId: 'vendor_001',
      type: 'credit',
      amount: 2500,
      description: 'Service completion payment',
      reference: 'BOOK_12345',
      status: 'completed',
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: 'txn_002',
      vendorId: 'vendor_001',
      type: 'debit',
      amount: 1000,
      description: 'Withdrawal to bank account',
      reference: 'WTH_001',
      status: 'completed',
      createdAt: '2024-01-14T14:20:00Z'
    },
    {
      id: 'txn_003',
      vendorId: 'vendor_002',
      type: 'credit',
      amount: 1200,
      description: 'Service completion payment',
      reference: 'BOOK_12346',
      status: 'pending',
      createdAt: '2024-01-14T15:45:00Z'
    }
  ]);

  const [newTransaction, setNewTransaction] = useState({
    vendorId: '',
    type: 'credit',
    amount: '',
    description: '',
    reference: ''
  });

  const filteredWallets = vendorWallets.filter(wallet => {
    const matchesSearch = wallet.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wallet.vendorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wallet.vendorPhone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || wallet.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredTransactions = walletTransactions.filter(transaction => {
    return selectedVendorId === '' || transaction.vendorId === selectedVendorId;
  });

  const handleViewWallet = (wallet: VendorWallet) => {
    setSelectedWallet(wallet);
    setIsViewWalletOpen(true);
  };

  const handleViewTransactions = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    setIsViewTransactionsOpen(true);
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

  const handleWalletStatusChange = (walletId: string, newStatus: 'active' | 'suspended' | 'pending') => {
    setVendorWallets(prev => prev.map(wallet => 
      wallet.id === walletId ? { ...wallet, status: newStatus } : wallet
    ));
  };

  // Calculate total stats
  const totalBalance = vendorWallets.reduce((sum, wallet) => sum + wallet.currentBalance, 0);
  const totalEarnings = vendorWallets.reduce((sum, wallet) => sum + wallet.totalEarnings, 0);
  const totalWithdrawals = vendorWallets.reduce((sum, wallet) => sum + wallet.totalWithdrawals, 0);
  const activeWallets = vendorWallets.filter(wallet => wallet.status === 'active').length;

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <main className="ml-72 pt-32 p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                Vendor <span className="text-gradient">Wallet</span> Management
              </h1>
              <p className="text-muted-foreground">Manage vendor wallets, transactions, and payments</p>
            </div>
            <Button onClick={() => setIsAddTransactionOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
                  <p className="text-2xl font-bold">₹{totalBalance.toLocaleString()}</p>
                </div>
                <Wallet className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold">₹{totalEarnings.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Withdrawals</p>
                  <p className="text-2xl font-bold">₹{totalWithdrawals.toLocaleString()}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Wallets</p>
                  <p className="text-2xl font-bold">{activeWallets}</p>
                </div>
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="wallets" className="space-y-6">
          <TabsList>
            <TabsTrigger value="wallets">Vendor Wallets</TabsTrigger>
            <TabsTrigger value="transactions">All Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="wallets" className="space-y-6">
            {/* Filters and Search */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search vendors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-48">
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
            <Card>
              <CardHeader>
                <CardTitle>Vendor Wallets ({filteredWallets.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Current Balance</TableHead>
                      <TableHead>Total Earnings</TableHead>
                      <TableHead>Pending Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Transaction</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWallets.map((wallet) => (
                      <TableRow key={wallet.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{wallet.vendorName}</p>
                            <p className="text-sm text-muted-foreground">{wallet.vendorEmail}</p>
                            <p className="text-sm text-muted-foreground">{wallet.vendorPhone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            <span className="font-medium">₹{wallet.currentBalance.toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">₹{wallet.totalEarnings.toLocaleString()}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4 text-orange-500" />
                            <span className="font-medium">₹{wallet.pendingAmount.toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={wallet.status}
                            onValueChange={(value) => handleWalletStatusChange(wallet.id, value as any)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {new Date(wallet.lastTransaction).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewWallet(wallet)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewTransactions(wallet.vendorId)}
                            >
                              <CreditCard className="w-3 h-3 mr-1" />
                              Transactions
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            {/* Transactions Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Transactions ({filteredTransactions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => {
                      const vendor = vendorWallets.find(w => w.vendorId === transaction.vendorId);
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <span className="font-mono text-sm">{transaction.id}</span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{vendor?.vendorName || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">{vendor?.vendorEmail || ''}</p>
                            </div>
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
                            {transaction.reference && (
                              <p className="text-xs text-muted-foreground">Ref: {transaction.reference}</p>
                            )}
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
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Transaction Dialog */}
        <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Transaction</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="vendorId">Select Vendor</Label>
                <Select value={newTransaction.vendorId} onValueChange={(value) => setNewTransaction(prev => ({ ...prev, vendorId: value }))}>
                  <SelectTrigger>
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
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="transactionType">Transaction Type</Label>
                  <Select value={newTransaction.type} onValueChange={(value) => setNewTransaction(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit">Credit</SelectItem>
                      <SelectItem value="debit">Debit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter amount"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter transaction description"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="reference">Reference (Optional)</Label>
                <Input
                  id="reference"
                  value={newTransaction.reference}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, reference: e.target.value }))}
                  placeholder="Enter reference number"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddTransaction} className="flex-1">
                  Add Transaction
                </Button>
                <Button variant="outline" onClick={() => setIsAddTransactionOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Wallet Dialog */}
        <Dialog open={isViewWalletOpen} onOpenChange={setIsViewWalletOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Wallet Details</DialogTitle>
            </DialogHeader>
            {selectedWallet && (
              <div className="space-y-6">
                {/* Vendor Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Vendor Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                      <p className="text-sm">{selectedWallet.vendorName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p className="text-sm">{selectedWallet.vendorEmail}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                      <p className="text-sm">{selectedWallet.vendorPhone}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                      <Badge variant={selectedWallet.status === 'active' ? 'default' : 'secondary'}>
                        {selectedWallet.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Wallet Summary */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Wallet Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
                            <p className="text-2xl font-bold text-green-600">₹{selectedWallet.currentBalance.toLocaleString()}</p>
                          </div>
                          <Wallet className="h-8 w-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                            <p className="text-2xl font-bold text-blue-600">₹{selectedWallet.totalEarnings.toLocaleString()}</p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Withdrawals</p>
                            <p className="text-2xl font-bold text-red-600">₹{selectedWallet.totalWithdrawals.toLocaleString()}</p>
                          </div>
                          <TrendingDown className="h-8 w-8 text-red-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Recent Transactions */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Recent Transactions</h3>
                  <div className="space-y-2">
                    {walletTransactions
                      .filter(t => t.vendorId === selectedWallet.vendorId)
                      .slice(0, 5)
                      .map((transaction) => (
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
                                {new Date(transaction.createdAt).toLocaleDateString()}
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
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => handleViewTransactions(selectedWallet.vendorId)} 
                    className="flex-1"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    View All Transactions
                  </Button>
                  <Button variant="outline" onClick={() => setIsViewWalletOpen(false)}>
                    Close
                  </Button>
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
      </main>
    </div>
  );
};

export default AdminVendorWalletManagement;
