import React, { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { setupUserNotifications, testNotification } from '@/utils/notificationSetup';
import { toast } from 'sonner';

interface UserNotificationEnableProps {
  onTokenGenerated?: (token: string) => void;
}

const UserNotificationEnable: React.FC<UserNotificationEnableProps> = ({ onTokenGenerated }) => {
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

  const handleEnableNotifications = async () => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser');
      setStatus('error');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatus('idle');

    try {
      console.log('🔔 Setting up complete notification system for user...');
      
      // Use comprehensive notification setup
      const result = await setupUserNotifications();
      
      if (result.success) {
        setToken(result.fcmToken);
        setStatus('success');
        console.log('✅ Complete notification system setup successful!');
        
        if (onTokenGenerated) {
          onTokenGenerated(result.fcmToken);
        }
        
        // Test notification to verify it works
        setTimeout(() => {
          testNotification();
        }, 1000);
        
        toast.success('Notifications enabled successfully!');
      } else {
        setError(result.error || 'Failed to setup notifications');
        setStatus('error');
        toast.error('Failed to enable notifications');
      }
    } catch (err) {
      console.error('❌ Error enabling notifications:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
      toast.error('Failed to enable notifications');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            Notifications Not Supported
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-sm text-yellow-700">
            Push notifications are not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  if (status === 'denied') {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BellOff className="w-4 h-4 text-red-600" />
            Notifications Blocked
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-sm text-red-700">
            You have blocked notifications for this site. Please enable them in your browser settings to receive push notifications.
          </CardDescription>
          <div className="mt-3">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              size="sm"
            >
              Refresh Page
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200 bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-600" />
          Push Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        {token && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 font-medium">✅ Notifications Enabled Successfully!</p>
            <p className="text-xs text-green-600 mt-1">
              You will now receive push notifications for important updates, booking confirmations, and more.
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
            onClick={handleEnableNotifications}
            disabled={isLoading || status === 'success'}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="sm"
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
              🎉 You're all set! You'll receive notifications for important updates and announcements.
            </p>
          )}

          {status === 'idle' && (
            <p className="text-xs text-gray-600 text-center">
              Click the button above to enable push notifications and receive instant updates.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserNotificationEnable;
