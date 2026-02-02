import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Wallet, Plus } from 'lucide-react';
import { useVendor } from '@/contexts/VendorContext';
import vendorApi from '@/services/vendorApi';
import { vendorDepositService } from '@/services/vendorDepositService';
import { useToast } from '@/hooks/use-toast';

interface WalletBalanceCheckProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  requiredAmount: number;
  action: 'decline' | 'close_cash_task';
  taskDetails?: {
    id: string;
    caseId: string;
    title: string;
  };
  onDepositSuccess?: () => void;
}

const WalletBalanceCheck: React.FC<WalletBalanceCheckProps> = ({
  isOpen,
  onClose,
  onProceed,
  requiredAmount,
  action,
  taskDetails,
  onDepositSuccess
}) => {
  const { vendor } = useVendor();
  const { toast } = useToast();
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  // Fetch wallet balance
  const fetchWalletBalance = async () => {
    try {
      setLoading(true);
      const response = await vendorDepositService.getWallet();
      if (response.success && response.data?.wallet) {
        const wallet = response.data.wallet;
        const currentBalance = wallet.currentBalance || 0;
        const totalDeposits = wallet.totalDeposits || 0;

        // Calculate display balance: show current balance minus security deposit
        const securityDeposit = wallet.securityDeposit || 0;
        let displayBalance = 0;
        if (currentBalance > securityDeposit) {
          displayBalance = currentBalance - securityDeposit;
        }

        setWalletBalance(displayBalance);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchWalletBalance();
    }
  }, [isOpen]);

  const hasSufficientBalance = walletBalance >= requiredAmount;
  const shortfall = requiredAmount - walletBalance;

  const getActionText = () => {
    switch (action) {
      case 'decline':
        return 'decline this task';
      case 'close_cash_task':
        return 'close this cash task';
      default:
        return 'perform this action';
    }
  };

  const getActionTitle = () => {
    switch (action) {
      case 'decline':
        return 'Insufficient Balance for Task Decline';
      case 'close_cash_task':
        return 'Insufficient Balance for Cash Task Closure';
      default:
        return 'Insufficient Balance';
    }
  };

  const handleDepositSuccess = () => {
    setIsDepositModalOpen(false);
    fetchWalletBalance(); // Refresh balance after deposit
    onDepositSuccess?.(); // Call parent callback if provided
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-orange-600" />
              {getActionTitle()}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Balance Display */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Current Wallet Balance:</span>
                <span className="text-lg font-bold text-gray-900">
                  {loading ? 'Loading...' : `₹${walletBalance.toLocaleString()}`}
                </span>
              </div>
            </div>

            {/* Insufficient Balance Warning */}
            {!hasSufficientBalance && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <div className="space-y-2">
                    <p className="font-bold text-lg">
                      Please add money to your wallet first.
                    </p>
                    <p>
                      <strong>Insufficient Balance:</strong> You need at least ₹{requiredAmount} to {getActionText()}.
                    </p>
                    <p>
                      Your current balance is ₹{walletBalance.toLocaleString()}.
                      You need to add ₹{shortfall.toLocaleString()} more.
                    </p>

                    {action === 'close_cash_task' && (
                      <p className="text-xs text-orange-700 mt-2">
                        <strong>Note:</strong> This amount will be deducted from your wallet for cash collection processing.
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Task Details */}
            {taskDetails && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">Task Details:</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p><strong>Task ID:</strong> {taskDetails.caseId}</p>
                  <p><strong>Service:</strong> {taskDetails.title}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {hasSufficientBalance ? (
                <Button
                  onClick={onProceed}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Proceed with {action === 'decline' ? 'Decline' : 'Closure'}
                </Button>
              ) : (
                <Button
                  onClick={() => setIsDepositModalOpen(true)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Funds
                </Button>
              )}

              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>

            {/* Additional Info */}
            <div className="text-xs text-gray-500 text-center">
              {action === 'decline' && (
                <p>Declining tasks incurs a ₹100 penalty from your wallet balance.</p>
              )}
              {action === 'close_cash_task' && (
                <div className="space-y-1">
                  <p>Closing cash tasks requires sufficient wallet balance for processing.</p>
                  <p><strong>Required Amount:</strong> ₹{requiredAmount.toLocaleString()}</p>
                  <p className="text-orange-600">This amount will be deducted from your wallet.</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deposit Modal - Reuse from VendorEarnings */}
      {isDepositModalOpen && (
        <DepositModal
          isOpen={isDepositModalOpen}
          onClose={() => setIsDepositModalOpen(false)}
          onSuccess={handleDepositSuccess}
        />
      )}
    </>
  );
};

// Simple Deposit Modal Component
const DepositModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ isOpen, onClose, onSuccess }) => {
  const { vendor } = useVendor();
  const { toast } = useToast();
  const [amount, setAmount] = useState('100');
  const [processing, setProcessing] = useState(false);

  const handleDeposit = async () => {
    if (!vendor) {
      toast({
        title: "Error",
        description: "Vendor information not available",
        variant: "destructive"
      });
      return;
    }

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount < 100) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount (minimum ₹100)",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);

    try {
      await vendorDepositService.processDepositPayment(
        depositAmount,
        vendor.fullName || `${vendor.firstName} ${vendor.lastName}`,
        vendor.email,
        vendor.phone,
        (response) => {
          // Payment successful
          toast({
            title: "Deposit Successful!",
            description: `₹${depositAmount.toLocaleString()} has been added to your wallet.`,
            variant: "default"
          });

          setProcessing(false);
          onSuccess();
        },
        (error) => {
          // Check if it's a payment cancellation
          if (error.message === 'PAYMENT_CANCELLED') {
            toast({
              title: "Payment Cancelled",
              description: "You cancelled the payment process.",
              variant: "default"
            });
          } else {
            toast({
              title: "Payment Failed",
              description: error.message || "Failed to process payment. Please try again.",
              variant: "destructive"
            });
          }
          setProcessing(false);
        }
      );
    } catch (error) {
      console.error('Error processing deposit:', error);
      toast({
        title: "Error",
        description: "Failed to process deposit. Please try again.",
        variant: "destructive"
      });
      setProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Funds to Wallet</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md"
              min="100"
            />
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleDeposit}
              className="flex-1"
              disabled={processing}
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Funds
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={processing}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletBalanceCheck;
