import React, { useState } from 'react';
import { AlertTriangle, Camera, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CashPaymentVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (verification: { confirmed: boolean; cashPhoto?: string }) => void;
  billingAmount: number;
  caseId: string;
}

const CashPaymentVerificationModal: React.FC<CashPaymentVerificationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  billingAmount,
  caseId
}) => {
  const [verificationStep, setVerificationStep] = useState<'warning' | 'confirmation' | 'photo'>('warning');
  const [cashPhoto, setCashPhoto] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Here you would upload the photo to your server
      // For now, we'll just simulate the upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCashPhoto(URL.createObjectURL(file));
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirm = () => {
    if (verificationStep === 'warning') {
      setVerificationStep('confirmation');
    } else if (verificationStep === 'confirmation') {
      setVerificationStep('photo');
    } else {
      onConfirm({
        confirmed: true,
        cashPhoto: cashPhoto || undefined
      });
      onClose();
    }
  };

  const handleReject = () => {
    onConfirm({ confirmed: false });
    onClose();
  };

  const renderWarningStep = () => (
    <div className="space-y-4">
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>Important:</strong> Please confirm that the customer has actually paid in cash. 
          Wrong updates are considered fraud and may result in heavy penalties and permanent account blocking.
        </AlertDescription>
      </Alert>
      
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">
          Case ID: <span className="font-mono font-medium">{caseId}</span>
        </p>
        <p className="text-sm text-gray-600">
          Amount: <span className="font-semibold">₹{billingAmount.toLocaleString()}</span>
        </p>
      </div>

      <div className="flex gap-3">
        <Button 
          onClick={handleConfirm}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Yes, Customer Paid Cash
        </Button>
        <Button 
          onClick={handleReject}
          variant="outline"
          className="flex-1"
        >
          <XCircle className="w-4 h-4 mr-2" />
          No, Online Payment
        </Button>
      </div>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="space-y-4">
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>Final Confirmation:</strong> You are confirming that the customer has paid 
          ₹{billingAmount.toLocaleString()} in cash for case {caseId}. This action cannot be undone.
        </AlertDescription>
      </Alert>

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">
          Are you absolutely sure the customer paid in cash?
        </p>
      </div>

      <div className="flex gap-3">
        <Button 
          onClick={handleConfirm}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Yes, Confirm Cash Payment
        </Button>
        <Button 
          onClick={() => setVerificationStep('warning')}
          variant="outline"
          className="flex-1"
        >
          Go Back
        </Button>
      </div>
    </div>
  );

  const renderPhotoStep = () => (
    <div className="space-y-4">
      <Alert className="border-blue-200 bg-blue-50">
        <Camera className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Optional:</strong> Upload a photo of the cash received for verification purposes.
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        <Label htmlFor="cash-photo">Cash Photo (Optional)</Label>
        <Input
          id="cash-photo"
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          disabled={isUploading}
        />
        {isUploading && (
          <p className="text-sm text-gray-500">Uploading photo...</p>
        )}
        {cashPhoto && (
          <div className="mt-2">
            <img 
              src={cashPhoto} 
              alt="Cash received" 
              className="w-full h-32 object-cover rounded-lg border"
            />
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button 
          onClick={handleConfirm}
          className="flex-1 bg-green-600 hover:bg-green-700"
          disabled={isUploading}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Complete Cash Payment
        </Button>
        <Button 
          onClick={() => setVerificationStep('confirmation')}
          variant="outline"
          className="flex-1"
        >
          Go Back
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Cash Payment Verification
          </DialogTitle>
          <DialogDescription>
            Please verify the cash payment details before proceeding.
          </DialogDescription>
        </DialogHeader>

        {verificationStep === 'warning' && renderWarningStep()}
        {verificationStep === 'confirmation' && renderConfirmationStep()}
        {verificationStep === 'photo' && renderPhotoStep()}
      </DialogContent>
    </Dialog>
  );
};

export default CashPaymentVerificationModal;


