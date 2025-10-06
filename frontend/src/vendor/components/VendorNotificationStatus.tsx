import React, { useState, useEffect } from 'react';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Bell, BellOff, CheckCircle, XCircle, AlertCircle, Settings } from 'lucide-react';
import VendorNotificationSettings from './VendorNotificationSettings';

interface VendorNotificationStatusProps {
  vendorId: string;
  compact?: boolean;
}

const VendorNotificationStatus: React.FC<VendorNotificationStatusProps> = ({ 
  vendorId, 
  compact = false 
}) => {
  const {
    token,
    permission,
    isSupported,
    requestNotificationPermission
  } = usePushNotifications();

  const [showSettings, setShowSettings] = useState(false);

  // Automatically request permission and generate token when component mounts
  useEffect(() => {
    const autoEnableNotifications = async () => {
      if (isSupported && permission === 'default' && !token && vendorId) {
        console.log('🔔 Auto-enabling notifications for vendor:', vendorId);
        try {
          const fcmToken = await requestNotificationPermission();
          if (fcmToken) {
            console.log('✅ FCM token generated automatically for vendor:', vendorId);
          }
        } catch (error) {
          console.error('Error auto-enabling notifications:', error);
        }
      }
    };

    autoEnableNotifications();
  }, [isSupported, permission, token, vendorId, requestNotificationPermission]);

  const getStatusIcon = () => {
    if (!isSupported) return <XCircle className="h-4 w-4 text-red-500" />;
    if (permission === 'denied') return <XCircle className="h-4 w-4 text-red-500" />;
    if (permission === 'granted' && token) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (!isSupported) return 'Not Supported';
    if (permission === 'denied') return 'Blocked';
    if (permission === 'granted' && token) return 'Enabled';
    return 'Not Enabled';
  };

  const getStatusColor = () => {
    if (!isSupported) return 'destructive';
    if (permission === 'denied') return 'destructive';
    if (permission === 'granted' && token) return 'default';
    return 'secondary';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant={getStatusColor()} className="flex items-center gap-1 text-xs">
          {getStatusIcon()}
          {getStatusText()}
        </Badge>
        <Button
          onClick={() => setShowSettings(true)}
          variant="outline"
          size="sm"
          className="h-6 px-2"
        >
          <Settings className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-gray-900">Notifications</span>
          </div>
          <Badge variant={getStatusColor()} className="flex items-center gap-1">
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </div>

        {permission === 'granted' && token ? (
          <div className="text-sm text-green-600 mb-3">
            ✅ You'll receive instant notifications for new tasks
          </div>
        ) : (
          <div className="text-sm text-gray-600 mb-3">
            {!isSupported 
              ? 'Push notifications not supported in this browser'
              : permission === 'denied'
              ? 'Notifications are blocked. Enable in browser settings.'
              : 'Enable notifications to receive instant task alerts'
            }
          </div>
        )}

        <Button
          onClick={() => setShowSettings(true)}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Settings className="h-4 w-4 mr-2" />
          Notification Settings
        </Button>
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <VendorNotificationSettings 
              vendorId={vendorId} 
              onClose={() => setShowSettings(false)} 
            />
          </div>
        </div>
      )}
    </>
  );
};

export default VendorNotificationStatus;
