import React, { useState } from 'react';
// Firebase/FCM removed - push notifications disabled
// import { usePushNotifications } from '../../hooks/usePushNotifications';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Bell, CheckCircle, XCircle, AlertCircle, Settings } from 'lucide-react';
// import VendorNotificationSettings from './VendorNotificationSettings';

interface VendorNotificationStatusProps {
  vendorId: string;
  compact?: boolean;
}

const VendorNotificationStatus: React.FC<VendorNotificationStatusProps> = ({ 
  vendorId, 
  compact = false 
}) => {
  // Firebase/FCM removed - all notification functionality disabled
  const token = null;
  const permission = 'default';
  const isSupported = false;
  const [showSettings, setShowSettings] = useState(false);

  // Push notifications disabled - no auto-enable
  // useEffect(() => {
  //   // Disabled
  // }, []);

  // Component completely disabled - return null to prevent any rendering
  // All notification functionality removed (Firebase/FCM removed)
  return null;
  
  // OLD CODE - DISABLED
  // if (compact) {
  //   return (
  //     <div className="flex items-center gap-2">
  //       <Badge variant={getStatusColor()} className="flex items-center gap-1 text-xs">
  //         {getStatusIcon()}
  //         {getStatusText()}
  //       </Badge>
  //       <Button
  //         onClick={() => setShowSettings(true)}
  //         variant="outline"
  //         size="sm"
  //         className="h-6 px-2"
  //       >
  //         <Settings className="h-3 w-3" />
  //       </Button>
  //     </div>
  //   );
  // }

  // return (
  //   <>
  //     <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
  //       ... old code ...
  //     </div>
  //   </>
  // );
};

export default VendorNotificationStatus;
