import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Bell, BellOff, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { setupNotifications, testNotification } from '../../utils/notificationSetup';

interface VendorNotificationEnableProps {
  vendorId: string;
  onTokenGenerated?: (token: string) => void;
}

const VendorNotificationEnable: React.FC<VendorNotificationEnableProps> = ({ 
  vendorId, 
  onTokenGenerated 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'denied'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Check if notifications are supported
  const isSupported = 'Notification' in window && 'serviceWorker' in navigator;

  // Check current permission status
  useEffect(() => {
    if (isSupported) {
      const permission = Notification.permission;
      if (permission === 'granted') {
        setStatus('success');
      } else if (permission === 'denied') {
        setStatus('denied');
      }
    }
  }, [isSupported]);

  const enableNotifications = async () => {
    // PUSH NOTIFICATIONS DISABLED
    setError('Push notifications are currently disabled');
    setStatus('error');
    return;
    
    // if (!isSupported) {
    //   setError('Push notifications are not supported in this browser');
    //   setStatus('error');
    //   return;
    // }

    // setIsLoading(true);
    // setError(null);
    // setStatus('idle');

    // try {
    //   console.log('🔔 Setting up complete notification system for vendor:', vendorId);
    //   
    //   // Use comprehensive notification setup
    //   const result = await setupNotifications(vendorId);
    //   
    //   if (result.success) {
    //     setToken(result.fcmToken);
    //     setStatus('success');
    //     console.log('✅ Complete notification system setup successful!');
    //     
    //     if (onTokenGenerated) {
    //       onTokenGenerated(result.fcmToken);
    //     }
    //     
    //     // Test notification to verify it works
    //     setTimeout(() => {
    //       testNotification();
    //     }, 1000);
    //     
    //   } else {
    //     setError(result.error || 'Failed to setup notifications');
    //     setStatus('error');
    //   }
    // } catch (err) {
    //   console.error('❌ Error enabling notifications:', err);
    //   setError(err instanceof Error ? err.message : 'Unknown error');
    //   setStatus('error');
    // } finally {
    //   setIsLoading(false);
    // }
  };

  const saveTokenToBackend = async (fcmToken: string) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/vendors/update-fcm-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('vendorToken')}`
        },
        body: JSON.stringify({
          fcmToken,
          vendorId
        })
      });

      if (response.ok) {
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to save FCM token:', errorData);
        return false;
      }
    } catch (error) {
      console.error('❌ Error saving FCM token:', error);
      return false;
    }
  };

  const getStatusIcon = () => {
    if (!isSupported) return <XCircle className="h-5 w-5 text-red-500" />;
    if (status === 'denied') return <XCircle className="h-5 w-5 text-red-500" />;
    if (status === 'success') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === 'error') return <XCircle className="h-5 w-5 text-red-500" />;
    return <Bell className="h-5 w-5 text-blue-500" />;
  };

  const getStatusText = () => {
    if (!isSupported) return 'Not Supported';
    if (status === 'denied') return 'Permission Denied';
    if (status === 'success') return 'Notifications Enabled';
    if (status === 'error') return 'Error';
    return 'Enable Notifications';
  };

  const getStatusColor = () => {
    if (!isSupported) return 'bg-red-100 text-red-800';
    if (status === 'denied') return 'bg-red-100 text-red-800';
    if (status === 'success') return 'bg-green-100 text-green-800';
    if (status === 'error') return 'bg-red-100 text-red-800';
    return 'bg-blue-100 text-blue-800';
  };

  if (!isSupported) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <div className="flex items-center gap-2 text-red-700">
          <XCircle className="h-5 w-5" />
          <span className="font-medium">Push Notifications Not Supported</span>
        </div>
        <p className="text-sm text-red-600 mt-1">
          Your browser doesn't support push notifications. Please use a modern browser like Chrome, Firefox, or Safari.
        </p>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <div className="flex items-center gap-2 text-red-700">
          <XCircle className="h-5 w-5" />
          <span className="font-medium">Notifications Blocked</span>
        </div>
        <p className="text-sm text-red-600 mt-1">
          You have blocked notifications for this site. Please enable them in your browser settings to receive push notifications.
        </p>
        <div className="mt-3">
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            size="sm"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium">Push Notifications</span>
        </div>
        <Badge className={getStatusColor()}>
          {getStatusText()}
        </Badge>
      </div>

      {token && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 font-medium">✅ Notifications Enabled Successfully!</p>
          <p className="text-xs text-green-600 mt-1">
            You will now receive push notifications for new tasks and updates.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-medium">❌ Error</p>
          <p className="text-xs text-red-600 mt-1">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        <Button
          onClick={enableNotifications}
          disabled={isLoading || status === 'success'}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enabling Notifications...
            </>
          ) : status === 'success' ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Notifications Enabled
            </>
          ) : (
            <>
              <Bell className="h-4 w-4 mr-2" />
              Enable Push Notifications
            </>
          )}
        </Button>

        {status === 'success' && (
          <p className="text-xs text-green-600 text-center">
            🎉 You're all set! You'll receive notifications for new tasks and updates.
          </p>
        )}

        {status === 'idle' && (
          <p className="text-xs text-gray-600 text-center">
            Click the button above to enable push notifications and receive instant updates about new tasks.
          </p>
        )}
      </div>
    </div>
  );
};

export default VendorNotificationEnable;
