import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import { Menu, X, Home, Users, ShoppingBag, LogOut, User, FileText, Star, Info, Search, Lock, Award, Download, Bell, Store, CheckCircle, DollarSign } from 'lucide-react';
import { Button, useMediaQuery, Avatar, Typography, Box as MuiBox, TextField, InputAdornment, Badge } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { useVendor } from '@/contexts/VendorContext';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import VendorNotificationStatus from './VendorNotificationStatus';
import VendorNotificationEnable from './VendorNotificationEnable';
import VendorNotificationEnableCompact from './VendorNotificationEnableCompact';

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  variants: [
    {
      props: ({ open }) => open,
      style: {
        transition: theme.transitions.create('margin', {
          easing: theme.transitions.easing.easeOut,
          duration: theme.transitions.duration.enteringScreen,
        }),
        marginLeft: 0,
      },
    },
  ],
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  variants: [
    {
      props: ({ open }) => open,
      style: {
        width: `calc(100% - ${drawerWidth}px)`,
        marginLeft: `${drawerWidth}px`,
        transition: theme.transitions.create(['margin', 'width'], {
          easing: theme.transitions.easing.easeOut,
          duration: theme.transitions.duration.enteringScreen,
        }),
      },
    },
  ],
}));

const VendorHeader = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { vendor, isAuthenticated, logout } = useVendor();
  
  // Debug: Log vendor changes
  useEffect(() => {
    console.log('VendorHeader: Vendor data changed:', vendor);
  }, [vendor]);
  const [open, setOpen] = React.useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [vendorId, setVendorId] = useState<string>('');
  const [unreadCount, setUnreadCount] = useState(0);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Check if vendor has made the initial deposit - once deposit is made, always show Yes
  const hasInitialDeposit = vendor?.wallet?.hasInitialDeposit || 
                           (vendor?.wallet?.currentBalance >= 4000) ||
                           (vendor?.wallet?.totalDeposits > 0);

  // Get vendor ID for notifications and auto-enable notifications
  React.useEffect(() => {
    if (vendor && vendor.vendorId) {
      setVendorId(vendor.vendorId);
      console.log('🔔 Vendor ID set for notifications:', vendor.vendorId);
      
      // Set unread notifications count - in real implementation, fetch from API
      setUnreadCount(0); // No unread notifications initially
      
      // Auto-enable notifications in background
      const autoEnableNotifications = async () => {
        try {
          // Check if notifications are supported
          if ('Notification' in window && 'serviceWorker' in navigator) {
            const permission = Notification.permission;
            
            if (permission === 'default') {
              console.log('🔔 Auto-requesting notification permission for vendor:', vendor.vendorId);
              const result = await Notification.requestPermission();
              
              if (result === 'granted') {
                console.log('✅ Notification permission granted automatically');
                
                // Import and setup notifications
                const { setupNotifications } = await import('../../utils/notificationSetup');
                const notificationResult = await setupNotifications(vendor.vendorId);
                
                if (notificationResult.success) {
                  console.log('✅ Background notification setup successful for vendor:', vendor.vendorId);
                } else {
                  console.log('⚠️ Background notification setup failed:', notificationResult.error);
                }
              } else {
                console.log('❌ Notification permission denied automatically');
              }
            } else if (permission === 'granted') {
              console.log('✅ Notifications already enabled for vendor:', vendor.vendorId);
              
              // Still setup the notification system to ensure FCM token is generated
              try {
                const { setupNotifications } = await import('../../utils/notificationSetup');
                const notificationResult = await setupNotifications(vendor.vendorId);
                
                if (notificationResult.success) {
                  console.log('✅ Background notification setup successful for vendor:', vendor.vendorId);
                }
              } catch (error) {
                console.log('⚠️ Error setting up background notifications:', error);
              }
            } else {
              console.log('❌ Notifications blocked for vendor:', vendor.vendorId);
            }
          } else {
            console.log('❌ Push notifications not supported in this browser');
          }
        } catch (error) {
          console.error('❌ Error in auto-enable notifications:', error);
        }
      };
      
      // Run auto-enable after a short delay to ensure page is loaded
      setTimeout(autoEnableNotifications, 1000);
    }
  }, [vendor]);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const downloadCertificate = async () => {
    const vendorName = isAuthenticated && vendor ? `${vendor.firstName} ${vendor.lastName}` : 'Vendor Name';
    
    // Create a canvas to draw the certificate with vendor name
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = async () => {
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the certificate image
      ctx?.drawImage(img, 0, 0);
      
      // Add vendor name
      if (ctx) {
        ctx.font = 'bold 36px Arial';
        ctx.fillStyle = '#1e3a8a';
        ctx.textAlign = 'center';
        ctx.fillText(vendorName, canvas.width / 2, canvas.height / 2 + 50);
      }
      
      // Convert to PDF using jsPDF
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Convert canvas to image data
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate dimensions to fit A4 landscape
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      
      // Center the image
      const x = (pdfWidth - finalWidth) / 2;
      const y = (pdfHeight - finalHeight) / 2;
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
      
      // Download the PDF
      pdf.save(`Fixfly_Certificate_${vendorName.replace(/\s+/g, '_')}.pdf`);
    };
    
    img.src = '/certificate.jpg';
  };

  const handleLogoClick = () => {
    navigate("/vendor");
  };

  const vendorNavItems = [
    { name: "Profile", href: "/vendor/profile", icon: User },
    { name: "My Tasks", href: "/vendor", icon: ShoppingBag },
    { name: "Privacy Policy", href: "/vendor/privacy", icon: FileText },
  ];

  // Only show header on mobile devices
  if (!isMobile) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar 
        position="fixed" 
        open={open}
        sx={{
          backgroundColor: 'white',
          color: 'black',
          boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
          height: '60px',
          zIndex: 14000,
        }}
      >
         <Toolbar sx={{ minHeight: '60px !important', justifyContent: 'center', position: 'relative' }}>
           {/* Left side - Menu Icon and Logo */}
           <Box sx={{ display: 'flex', alignItems: 'center', position: 'absolute', left: 0 }}>
             <IconButton
               color="inherit"
               aria-label="open drawer"
               onClick={handleDrawerOpen}
               edge="start"
               sx={[
                 {
                   mr: 2,
                   ml: 1,
                   color: 'black',
                 },
                 open && { display: 'none' },
               ]}
             >
               <Menu />
             </IconButton>
             <img 
               src="/logofixifly.png" 
               alt="Fixfly Logo" 
               onClick={handleLogoClick}
               style={{
                 height: '85px',
                 width: 'auto',
                 marginLeft: '-10px',
                 cursor: 'pointer',
                 transition: 'opacity 0.2s ease-in-out'
               }}
               onMouseEnter={(e) => {
                 e.currentTarget.style.opacity = '0.8';
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.opacity = '1';
               }}
             />
           </Box>
          
          {/* Right side - Notifications - Hide when sidebar is open */}
          {!open && (
            <Box sx={{ display: 'flex', alignItems: 'center', position: 'absolute', right: 16, gap: 1 }}>
              {/* Hidden notification components - they work in background */}
              {vendorId && (
                <div style={{ display: 'none' }}>
                  <VendorNotificationStatus vendorId={vendorId} compact={true} />
                  <VendorNotificationEnableCompact 
                    vendorId={vendorId || 'unknown'} 
                    onTokenGenerated={(token) => {
                      console.log('✅ FCM Token generated for vendor:', vendorId);
                    }}
                  />
                </div>
              )}
              
              {/* Notification Bell Icon */}
              <IconButton
                color="inherit"
                aria-label="notifications"
                onClick={() => navigate("/vendor/notifications")}
                sx={{ 
                  color: 'black',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
                }}
              >
                <Badge 
                  badgeContent={unreadCount} 
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.75rem',
                      minWidth: '18px',
                      height: '18px',
                      borderRadius: '9px',
                    }
                  }}
                >
                  <Bell size={24} />
                </Badge>
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          zIndex: 15000,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
            zIndex: 15000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        }}
        variant="temporary"
        anchor="left"
        open={open}
        onClose={handleDrawerClose}
      >
        {/* Vendor Profile Section - Fixed at top */}
        <MuiBox sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          padding: 2,
          backgroundColor: '#f8f9fa',
          flexShrink: 0
        }}>
          {isAuthenticated && vendor?.profileImage ? (
            <img
              key={vendor.profileImage}
              src={vendor.profileImage}
              alt="Profile"
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                objectFit: 'cover',
                marginBottom: 8,
                border: '2px solid #e5e7eb'
              }}
              onLoad={() => console.log('VendorHeader: Image loaded:', vendor.profileImage)}
              onError={() => console.log('VendorHeader: Image failed to load:', vendor.profileImage)}
            />
          ) : (
            <Avatar
              sx={{
                width: 60,
                height: 60,
                marginBottom: 1,
                backgroundColor: '#3b82f6',
                fontSize: '1.5rem'
              }}
            >
              {isAuthenticated && vendor ? vendor.firstName.charAt(0).toUpperCase() : 'V'}
            </Avatar>
          )}
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', marginBottom: 0.25, color: '#1f2937' }}>
            {isAuthenticated && vendor ? `${vendor.firstName} ${vendor.lastName}` : 'Vendor Name'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280', marginBottom: 0.5 }}>
            {isAuthenticated && vendor ? `Vendor ID: ${vendor.vendorId}` : 'Vendor ID: V001'}
          </Typography>
          {/* Verified Partner Tag */}
          {hasInitialDeposit && (
            <MuiBox sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: 1
            }}>
              <Badge
                sx={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <CheckCircle size={12} />
                Verified Partner
              </Badge>
            </MuiBox>
          )}
        </MuiBox>
        
        <Divider />
        
        {/* Menu Options - No Scroll */}
        <MuiBox sx={{ 
          padding: 1,
          flex: 1,
          overflowY: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}>
          {[
            { name: "Profile", icon: User, href: "/vendor/profile", requiresDeposit: true },
            { name: "Certificate", icon: Award, href: null, requiresDeposit: true, isCertificate: true },
            { name: "My Tasks", icon: ShoppingBag, href: "/vendor", requiresDeposit: true },
            { name: "Privacy Policy", icon: FileText, href: "/vendor/privacy", requiresDeposit: true },
            { name: "Terms & Conditions", icon: FileText, href: "/vendor/terms", requiresDeposit: true },
            { name: "Deposit & Penalty", icon: DollarSign, href: "/vendor/deposit-penalty", requiresDeposit: true },
            { name: "About Fixfly", icon: Info, href: "/vendor/about", requiresDeposit: true },
            { name: "Penalty & Charges", icon: Star, href: "/vendor/penalty", requiresDeposit: true }
          ].map((item) => {
            const IconComponent = item.icon;
            const isDisabled = item.requiresDeposit && !hasInitialDeposit;
            
            return (
              <Button
                key={item.name}
                component={isDisabled ? 'div' : (item.isCertificate ? 'div' : Link)}
                to={isDisabled ? undefined : (item.isCertificate ? undefined : item.href)}
                startIcon={
                  <div className="relative">
                    <IconComponent size={20} />
                    {isDisabled && <Lock size={12} className="absolute -top-1 -right-1" />}
                  </div>
                }
                fullWidth
                onClick={isDisabled ? () => navigate("/vendor/earnings") : (item.isCertificate ? () => { setIsCertificateOpen(true); handleDrawerClose(); } : handleDrawerClose)}
                disabled={isDisabled}
                sx={{
                  justifyContent: 'flex-start',
                  padding: '12px 16px',
                  margin: '4px 0',
                  textTransform: 'none',
                  color: isDisabled ? '#9ca3af' : '#374151',
                  fontSize: '14px',
                  fontWeight: 500,
                  opacity: isDisabled ? 0.6 : 1,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  '&:hover': {
                    backgroundColor: isDisabled ? 'transparent' : '#f3f4f6',
                    color: isDisabled ? '#9ca3af' : '#1f2937'
                  }
                }}
              >
                {item.name}
              </Button>
            );
          })}
          
          {/* Logout Button - Only show when authenticated */}
          {isAuthenticated && (
            <>
              <Divider sx={{ margin: '8px 0' }} />
              <Button
                startIcon={<LogOut size={20} />}
                fullWidth
                onClick={() => {
                  logout();
                  navigate('/vendor/login');
                  handleDrawerClose();
                }}
                sx={{
                  justifyContent: 'flex-start',
                  padding: '12px 16px',
                  margin: '4px 0 8px 0',
                  textTransform: 'none',
                  color: '#dc2626',
                  fontSize: '14px',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: '#fef2f2',
                    color: '#b91c1c'
                  }
                }}
              >
                Logout
              </Button>
            </>
          )}

          {/* Download App and Rate Us Buttons */}
          <Divider sx={{ margin: '0px 0' }} />
          
          {/* Download Fixfly Partner App Button */}
          <Button
            onClick={() => {
              handleDrawerClose();
              // TODO: Add download functionality later
            }}
            startIcon={<Store size={22} />}
            fullWidth
            sx={{
              justifyContent: 'flex-start',
              padding: '10px 15px',
              margin: '6px 0',
              textTransform: 'none',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              minHeight: '48px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              border: 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
                transform: 'translateY(-1px)',
                transition: 'all 0.2s ease-in-out'
              },
              '&:active': {
                transform: 'translateY(0px)',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
              }
            }}
          >
            📱 Download Fixfly Partner App
          </Button>
        </MuiBox>
      </Drawer>

      {/* Certificate Modal */}
      <Dialog open={isCertificateOpen} onOpenChange={setIsCertificateOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-4">
          <DialogTitle className="sr-only">
            Fixfly Certificate - {isAuthenticated && vendor ? `${vendor.firstName} ${vendor.lastName}` : 'Vendor Name'}
          </DialogTitle>
          <div className="relative">
            <img 
              src="/certificate.jpg" 
              alt="Fixfly Certificate" 
              className="w-full h-auto"
            />
            {/* Overlay vendor name */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center" style={{ marginTop: '20px' }}>
                <h2 className="text-lg font-bold text-blue-900" style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {isAuthenticated && vendor ? `${vendor.firstName} ${vendor.lastName}` : 'Vendor Name'}
                </h2>
              </div>
            </div>
          </div>
          
          {/* Download Button - Below Certificate */}
          <div className="flex justify-center mt-4">
            <Button
              onClick={downloadCertificate}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="large"
              startIcon={<Download size={20} />}
            >
              Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default VendorHeader;
