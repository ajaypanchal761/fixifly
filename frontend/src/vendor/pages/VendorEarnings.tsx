import VendorHeader from "../components/VendorHeader";
import VendorBottomNav from "../components/VendorBottomNav";
import Footer from "../../components/Footer";
import NotFound from "../../pages/NotFound";
import { useMediaQuery, useTheme } from "@mui/material";
import { DollarSign, TrendingUp, TrendingDown, Filter, Download, Wallet } from "lucide-react";
import { useState } from "react";

const VendorEarnings = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeFilter, setActiveFilter] = useState('All');

  // Show 404 error on desktop
  if (!isMobile) {
    return <NotFound />;
  }

  const transactionHistory = [
    {
      id: "TXN001",
      caseId: "CASE-2024-001",
      type: "Payment Received",
      amount: 2500,
      date: "2024-01-15",
      status: "completed",
      description: "Laptop repair service completed"
    },
    {
      id: "TXN002", 
      caseId: "CASE-2024-002",
      type: "Penalty on Cancellation",
      amount: -500,
      date: "2024-01-14",
      status: "completed",
      description: "Service cancelled by vendor"
    },
    {
      id: "TXN003",
      caseId: "CASE-2024-003", 
      type: "Cash Received by Customer",
      amount: 1800,
      date: "2024-01-13",
      status: "completed",
      description: "Mobile repair service"
    },
    {
      id: "TXN004",
      caseId: "CASE-2024-004",
      type: "Earning Added",
      amount: 3200,
      date: "2024-01-12",
      status: "completed", 
      description: "Desktop repair service"
    },
    {
      id: "TXN005",
      caseId: "CASE-2024-005",
      type: "Withdraw Transferred",
      amount: -5000,
      date: "2024-01-10",
      status: "completed",
      description: "Withdrawal to bank account"
    },
    {
      id: "TXN006",
      caseId: "CASE-2024-006",
      type: "Payment Received",
      amount: 1200,
      date: "2024-01-09",
      status: "completed",
      description: "AC repair service"
    }
  ];

  const totalEarnings = 15200;
  const availableBalance = 8200;
  const totalWithdrawn = 5000;

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
  const filteredTransactions = transactionHistory.filter(transaction => {
    switch (activeFilter) {
      case 'All':
        return true;
      case 'Payment Received':
        return transaction.type === 'Payment Received';
      case 'Withdraw':
        return transaction.type === 'Withdraw Transferred';
      case 'Penalty':
        return transaction.type === 'Penalty on Cancellation';
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
                    <h3 className="text-sm font-semibold text-foreground">Available Balance</h3>
                    <p className="text-lg font-bold text-primary">₹{availableBalance.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <button 
                    className="btn-tech text-sm py-2 px-6"
                    onClick={() => {
                      // Add withdraw functionality
                      alert('Withdraw functionality will be implemented soon!');
                    }}
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Filters */}
          <div className="service-card mb-6 md:hidden">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Filters</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button 
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  activeFilter === 'All' 
                    ? 'btn-tech' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                onClick={() => setActiveFilter('All')}
              >
                All
              </button>
              <button 
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  activeFilter === 'Payment Received' 
                    ? 'btn-tech' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                onClick={() => setActiveFilter('Payment Received')}
              >
                Payment
              </button>
              <button 
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  activeFilter === 'Withdraw' 
                    ? 'btn-tech' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                onClick={() => setActiveFilter('Withdraw')}
              >
                Withdraw
              </button>
              <button 
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  activeFilter === 'Penalty' 
                    ? 'btn-tech' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                onClick={() => setActiveFilter('Penalty')}
              >
                Penalty
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
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction, index) => (
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
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No transactions found for the selected filter.</p>
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