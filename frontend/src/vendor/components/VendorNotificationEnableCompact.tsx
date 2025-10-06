import React, { useState, useEffect } from 'react';
import { IconButton, Tooltip, Badge } from '@mui/material';
import { Bell, BellOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { setupNotifications, testNotification } from '../../utils/notificationSetup';

interface VendorNotificationEnableCompactProps {
  vendorId: string;
  onTokenGenerated?: (token: string) => void;
}

const VendorNotificationEnableCompact: React.FC<VendorNotificationEnableCompactProps> = ({ 
  vendorId, 
  onTokenGenerated 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'denied'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Debug logging
  console.log('🔔 VendorNotificationEnableCompact rendered for vendor:', vendorId);

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
    if (!isSupported) {
      setError('Push notifications are not supported in this browser');
      setStatus('error');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatus('idle');

    try {
      console.log('🔔 Setting up complete notification system for vendor:', vendorId);
      
      // Use comprehensive notification setup
      const result = await setupNotifications(vendorId);
      
      if (result.success) {
        setStatus('success');
        console.log('✅ Complete notification system setup successful!');
        
        if (onTokenGenerated) {
          onTokenGenerated(result.fcmToken);
        }
        
        // Test notification to verify it works
        setTimeout(() => {
          testNotification();
        }, 1000);
        
      } else {
        setError(result.error || 'Failed to setup notifications');
        setStatus('error');
      }
    } catch (err) {
      console.error('❌ Error enabling notifications:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const saveTokenToBackend = async (fcmToken: string) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/vendors/update-fcm-token`, {
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

  const getIcon = () => {
    if (!isSupported) return <XCircle className="h-5 w-5" />;
    if (status === 'denied') return <XCircle className="h-5 w-5" />;
    if (status === 'success') return <CheckCircle className="h-5 w-5" />;
    if (status === 'error') return <XCircle className="h-5 w-5" />;
    return <Bell className="h-5 w-5" />;
  };

  const getTooltipText = () => {
    if (!isSupported) return 'Notifications not supported';
    if (status === 'denied') return 'Notifications blocked - enable in browser';
    if (status === 'success') return 'Notifications enabled';
    if (status === 'error') return 'Error enabling notifications';
    return 'Enable push notifications';
  };

  const getColor = () => {
    if (!isSupported) return 'error';
    if (status === 'denied') return 'error';
    if (status === 'success') return 'success';
    if (status === 'error') return 'error';
    return 'primary';
  };

  if (!isSupported) {
    return (
      <Tooltip title="Push notifications not supported">
        <IconButton color="error" size="small">
          <XCircle className="h-5 w-5" />
        </IconButton>
      </Tooltip>
    );
  }

  if (status === 'denied') {
    return (
      <Tooltip title="Notifications blocked - enable in browser settings">
        <IconButton color="error" size="small">
          <XCircle className="h-5 w-5" />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={getTooltipText()}>
      <IconButton
        onClick={enableNotifications}
        disabled={isLoading || status === 'success'}
        color={getColor() as any}
        size="small"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          getIcon()
        )}
      </IconButton>
    </Tooltip>
  );
};

export default VendorNotificationEnableCompact;
