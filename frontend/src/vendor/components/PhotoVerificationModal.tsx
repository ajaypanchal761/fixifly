import React, { useState } from 'react';
import { AlertTriangle, Camera, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PhotoVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (verification: { confirmed: boolean }) => void;
  caseId: string;
}

const PhotoVerificationModal: React.FC<PhotoVerificationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  caseId
}) => {
  const [verificationStep, setVerificationStep] = useState<'warning' | 'confirmation'>('warning');

  const handleConfirm = () => {
    if (verificationStep === 'warning') {
      setVerificationStep('confirmation');
    } else {
      onConfirm({ confirmed: true });
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
          <strong>Important:</strong> Please capture original photos only. 
          Uploading wrong or fake photos may result in account blocking.
        </AlertDescription>
      </Alert>
      
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">
          Case ID: <span className="font-mono font-medium">{caseId}</span>
        </p>
        <p className="text-sm text-gray-600">
          Please ensure you are uploading authentic photos of the work completed.
        </p>
      </div>

      <div className="flex gap-3">
        <Button 
          onClick={handleConfirm}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Yes, Original Photos
        </Button>
        <Button 
          onClick={handleReject}
          variant="outline"
          className="flex-1"
        >
          <XCircle className="w-4 h-4 mr-2" />
          Cancel Upload
        </Button>
      </div>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="space-y-4">
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>Final Confirmation:</strong> You are confirming that the photos you are about to upload 
          are original and authentic photos of the work completed for case {caseId}.
        </AlertDescription>
      </Alert>

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">
          Are you absolutely sure these are original photos?
        </p>
      </div>

      <div className="flex gap-3">
        <Button 
          onClick={handleConfirm}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Yes, Confirm Upload
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-blue-500" />
            Photo Verification
          </DialogTitle>
          <DialogDescription>
            Please verify that you are uploading original photos.
          </DialogDescription>
        </DialogHeader>

        {verificationStep === 'warning' && renderWarningStep()}
        {verificationStep === 'confirmation' && renderConfirmationStep()}
      </DialogContent>
    </Dialog>
  );
};

export default PhotoVerificationModal;


