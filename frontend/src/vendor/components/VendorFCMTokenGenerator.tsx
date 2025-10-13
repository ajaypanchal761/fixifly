import React, { useState, useEffect } from 'react';
import { requestPermission } from '../../firebase-messaging';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface VendorFCMTokenGeneratorProps {
  vendorId: string;
  onTokenGenerated?: (token: string) => void;
}

const VendorFCMTokenGenerator: React.FC<VendorFCMTokenGeneratorProps> = ({ 
  vendorId, 
  onTokenGenerated 
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>(Notification.permission);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if notifications are supported
  const isSupported = 'Notification' in window && 'serviceWorker' in navigator;

  // Auto-generate token when component mounts
  useEffect(() => {
    if (isSupported && permission === 'default' && !token) {
      generateFCMToken();
    }
  }, [isSupported, permission, token]);

  const generateFCMToken = async () => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔔 Generating FCM token for vendor:', vendorId);
      
      const fcmToken = await requestPermission();
      
      if (fcmToken) {
        setToken(fcmToken);
        setPermission(Notification.permission);
        console.log('✅ FCM Token generated:', fcmToken.substring(0, 20) + '...');
        
        // Save token to backend
        await saveTokenToBackend(fcmToken);
        
        if (onTokenGenerated) {
          onTokenGenerated(fcmToken);
        }
      } else {
        setError('Failed to generate FCM token');
      }
    } catch (err) {
      console.error('❌ Error generating FCM token:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
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
        console.log('✅ FCM token saved to backend successfully');
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to save FCM token to backend:', errorData);
        setError('Failed to save token to backend');
        return false;
      }
    } catch (error) {
      console.error('❌ Error saving FCM token to backend:', error);
      setError('Failed to save token to backend');
      return false;
    }
  };

  const getStatusIcon = () => {
    if (!isSupported) return <XCircle className="h-4 w-4 text-red-500" />;
    if (permission === 'denied') return <XCircle className="h-4 w-4 text-red-500" />;
    if (permission === 'granted' && token) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (!isSupported) return 'Not Supported';
    if (permission === 'denied') return 'Permission Denied';
    if (permission === 'granted' && token) return 'Token Generated';
    if (permission === 'granted' && !token) return 'Permission Granted';
    return 'Request Permission';
  };

  const getStatusColor = () => {
    if (!isSupported) return 'bg-red-100 text-red-800';
    if (permission === 'denied') return 'bg-red-100 text-red-800';
    if (permission === 'granted' && token) return 'bg-green-100 text-green-800';
    if (permission === 'granted' && !token) return 'bg-yellow-100 text-yellow-800';
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
          Your browser doesn't support push notifications. Please use a modern browser.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium">FCM Token Status</span>
        </div>
        <Badge className={getStatusColor()}>
          {getStatusText()}
        </Badge>
      </div>

      {token && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 font-medium">✅ FCM Token Generated</p>
          <p className="text-xs text-green-600 mt-1 font-mono">
            {token.substring(0, 30)}...
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-medium">❌ Error</p>
          <p className="text-xs text-red-600 mt-1">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <Button
          onClick={generateFCMToken}
          disabled={isLoading || (permission === 'granted' && !!token)}
          className="w-full"
          variant={permission === 'granted' && token ? 'outline' : 'default'}
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : permission === 'granted' && token ? (
            'Token Generated'
          ) : (
            'Generate FCM Token'
          )}
        </Button>

        {permission === 'denied' && (
          <p className="text-xs text-red-600 text-center">
            Notification permission was denied. Please enable it in your browser settings.
          </p>
        )}
      </div>
    </div>
  );
};

export default VendorFCMTokenGenerator;
