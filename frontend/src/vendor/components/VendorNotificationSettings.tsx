import React, { useState, useEffect } from 'react';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Bell, BellOff, CheckCircle, XCircle, AlertCircle, Settings, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import vendorApi from '../../services/vendorApi';

interface VendorNotificationSettingsProps {
  vendorId: string;
  onClose?: () => void;
}

const VendorNotificationSettings: React.FC<VendorNotificationSettingsProps> = ({ 
  vendorId, 
  onClose 
}) => {
  const {
    token,
    permission,
    isSupported,
    requestNotificationPermission,
    saveTokenToBackend
  } = usePushNotifications();

  const [isLoading, setIsLoading] = useState(false);
  const [tokenSaved, setTokenSaved] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: true
  });

  // Load vendor notification settings
  useEffect(() => {
    const loadNotificationSettings = async () => {
      try {
        const response = await vendorApi.getVendorProfile();
        if (response.success && response.data.vendor) {
          setNotificationSettings((response.data.vendor as any).notificationSettings || {
            pushNotifications: true,
            emailNotifications: true,
            smsNotifications: true
          });
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    };

    loadNotificationSettings();
  }, []);

  // Save FCM token when generated
  useEffect(() => {
    if (token && vendorId) {
      saveTokenToBackend(vendorId, token).then((saved) => {
        setTokenSaved(saved);
        if (saved) {
          toast.success('Push notifications enabled successfully!');
        }
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
          toast.error('Failed to save notification settings');
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

  const handleSettingChange = async (setting: string, value: boolean) => {
    try {
      const updatedSettings = { ...notificationSettings, [setting]: value };
      setNotificationSettings(updatedSettings);

      // Update backend
      const response = await vendorApi.updateVendorProfile({
        notificationSettings: updatedSettings
      });

      if (response.success) {
        toast.success('Notification settings updated');
      } else {
        toast.error('Failed to update settings');
        // Revert on failure
        setNotificationSettings(notificationSettings);
      }
    } catch (error) {
      toast.error('Error updating settings');
      // Revert on failure
      setNotificationSettings(notificationSettings);
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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Settings className="h-6 w-6 text-blue-600" />
          <CardTitle className="text-xl">Notification Settings</CardTitle>
        </div>
        <CardDescription>
          Manage how you receive notifications about new tasks and updates
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Push Notification Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Push Notifications</span>
            </div>
            <Badge variant={getStatusColor()} className="flex items-center gap-1">
              {getStatusIcon()}
              {getStatusText()}
            </Badge>
          </div>

          {token && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Token saved successfully</span>
              </div>
              <div className="text-xs text-green-600 mt-1">
                You'll receive instant notifications for new tasks
              </div>
            </div>
          )}

          {!isSupported && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-700">
                Push notifications are not supported in this browser. Please use Chrome, Firefox, or Safari.
              </div>
            </div>
          )}

          {permission === 'denied' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-700">
                Notifications are blocked. Please enable them in your browser settings and refresh the page.
              </div>
            </div>
          )}

          {permission !== 'granted' && isSupported && (
            <Button
              onClick={handleEnableNotifications}
              disabled={isLoading}
              className="w-full"
              size="sm"
            >
              {isLoading ? 'Enabling...' : 'Enable Push Notifications'}
            </Button>
          )}
        </div>

        {/* Notification Preferences */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Notification Preferences</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Push Notifications</span>
              </div>
              <Switch
                checked={notificationSettings.pushNotifications}
                onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                disabled={!token}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-green-600" />
                <span className="text-sm">Email Notifications</span>
              </div>
              <Switch
                checked={notificationSettings.emailNotifications}
                onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-purple-600" />
                <span className="text-sm">SMS Notifications</span>
              </div>
              <Switch
                checked={notificationSettings.smsNotifications}
                onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
              />
            </div>
          </div>
        </div>

        {/* Information */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-700">
            <strong>💡 Tip:</strong> Enable push notifications to receive instant alerts when new tasks are assigned to you.
          </div>
        </div>

        {onClose && (
          <Button onClick={onClose} variant="outline" className="w-full">
            Close Settings
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default VendorNotificationSettings;
