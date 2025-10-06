import React, { useState, useEffect } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Bell, BellOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const PushNotificationTest = ({ vendorId }) => {
  const {
    token,
    permission,
    isSupported,
    requestNotificationPermission,
    saveTokenToBackend
  } = usePushNotifications();

  const [isLoading, setIsLoading] = useState(false);
  const [tokenSaved, setTokenSaved] = useState(false);

  useEffect(() => {
    if (token && vendorId) {
      saveTokenToBackend(vendorId, token).then((saved) => {
        setTokenSaved(saved);
      });
    }
  }, [token, vendorId, saveTokenToBackend]);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const fcmToken = await requestNotificationPermission();
      if (fcmToken && vendorId) {
        const saved = await saveTokenToBackend(vendorId, fcmToken);
        setTokenSaved(saved);
        if (saved) {
          toast.success('Push notifications enabled successfully!');
        } else {
          toast.error('Failed to save token to backend');
        }
      } else {
        toast.error('Failed to get notification permission');
      }
    } catch (error) {
      toast.error('Error enabling notifications: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!isSupported) return <XCircle className="h-5 w-5 text-red-500" />;
    if (permission === 'denied') return <XCircle className="h-5 w-5 text-red-500" />;
    if (permission === 'granted' && token) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <AlertCircle className="h-5 w-5 text-yellow-500" />;
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

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Enable push notifications to receive real-time updates about new tasks and assignments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant={getStatusColor()} className="flex items-center gap-1">
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </div>

        {token && (
          <div className="space-y-2">
            <span className="text-sm font-medium">FCM Token:</span>
            <div className="p-2 bg-gray-100 rounded text-xs font-mono break-all">
              {token.substring(0, 50)}...
            </div>
          </div>
        )}

        {tokenSaved && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            Token saved to backend
          </div>
        )}

        {!isSupported && (
          <div className="text-sm text-red-600">
            Push notifications are not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.
          </div>
        )}

        {permission === 'denied' && (
          <div className="text-sm text-red-600">
            Notifications are blocked. Please enable them in your browser settings and refresh the page.
          </div>
        )}

        {permission === 'granted' && !token && (
          <div className="text-sm text-yellow-600">
            Permission granted but no token received. Please try again.
          </div>
        )}

        {permission !== 'granted' && isSupported && (
          <Button
            onClick={handleEnableNotifications}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Enabling...' : 'Enable Notifications'}
          </Button>
        )}

        {permission === 'granted' && token && (
          <div className="text-sm text-green-600">
            ✅ Push notifications are enabled and ready to receive updates!
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PushNotificationTest;
