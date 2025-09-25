import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import { Menu, X, Home, Users, ShoppingBag, LogOut, User, FileText, Star, Info, Search, Lock } from 'lucide-react';
import { Button, useMediaQuery, Avatar, Typography, Box as MuiBox, TextField, InputAdornment } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { useVendor } from '@/contexts/VendorContext';

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
  const [open, setOpen] = React.useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Check if vendor has made the initial deposit - once deposit is made, always show Yes
  const hasInitialDeposit = vendor?.wallet?.hasInitialDeposit || 
                           (vendor?.wallet?.currentBalance >= 4000) ||
                           (vendor?.wallet?.totalDeposits > 0);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
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
          height: '80px',
        }}
      >
         <Toolbar sx={{ minHeight: '80px !important', justifyContent: 'center', position: 'relative' }}>
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
               alt="Fixifly Logo" 
               onClick={handleLogoClick}
               style={{
                 height: '100px',
                 width: 'auto',
                 marginLeft: '-20px',
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
          
          {/* Right side - Search and Notifications - Hide when sidebar is open */}
          {!open && (
            <Box sx={{ display: 'flex', alignItems: 'center', position: 'absolute', right: 16, gap: 1 }}>
              <IconButton
                color="inherit"
                aria-label="search"
                onClick={() => hasInitialDeposit ? navigate("/vendor/search") : navigate("/vendor/earnings")}
                sx={{ 
                  color: hasInitialDeposit ? 'black' : 'gray',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
                }}
              >
                <div className="relative">
                  <Search size={20} />
                  {!hasInitialDeposit && <Lock size={10} className="absolute -top-1 -right-1" />}
                </div>
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
            zIndex: 10000,
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
          <Avatar
            src={isAuthenticated && vendor?.profileImage ? vendor.profileImage : undefined}
            sx={{
              width: 60,
              height: 60,
              marginBottom: 1,
              backgroundColor: isAuthenticated && vendor?.profileImage ? 'transparent' : '#3b82f6',
              fontSize: '1.5rem'
            }}
          >
            {isAuthenticated && vendor ? vendor.firstName.charAt(0).toUpperCase() : 'V'}
          </Avatar>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', marginBottom: 0.25, color: '#1f2937' }}>
            {isAuthenticated && vendor ? `${vendor.firstName} ${vendor.lastName}` : 'Vendor Name'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280', marginBottom: 1 }}>
            {isAuthenticated && vendor ? `Vendor ID: ${vendor.vendorId}` : 'Vendor ID: V001'}
          </Typography>
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
            { name: "My Tasks", icon: ShoppingBag, href: "/vendor", requiresDeposit: true },
            { name: "Privacy Policy", icon: FileText, href: "/vendor/privacy", requiresDeposit: true },
            { name: "Terms & Conditions", icon: FileText, href: "/vendor/terms", requiresDeposit: true },
            { name: "About Fixifly", icon: Info, href: "/vendor/about", requiresDeposit: true },
            { name: "Penalty & Charges", icon: Star, href: "/vendor/penalty", requiresDeposit: true }
          ].map((item) => {
            const IconComponent = item.icon;
            const isDisabled = item.requiresDeposit && !hasInitialDeposit;
            
            return (
              <Button
                key={item.name}
                component={isDisabled ? 'div' : Link}
                to={isDisabled ? undefined : item.href}
                startIcon={
                  <div className="relative">
                    <IconComponent size={20} />
                    {isDisabled && <Lock size={12} className="absolute -top-1 -right-1" />}
                  </div>
                }
                fullWidth
                onClick={isDisabled ? () => navigate("/vendor/earnings") : handleDrawerClose}
                disabled={isDisabled}
                sx={{
                  justifyContent: 'flex-start',
                  padding: '12px 16px',
                  margin: '4px 0',
                  textTransform: 'none',
                  color: isDisabled ? '#9ca3af' : '#374151',
                  fontSize: '16px',
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
                  margin: '4px 0 30px 0',
                  textTransform: 'none',
                  color: '#dc2626',
                  fontSize: '16px',
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
        </MuiBox>
      </Drawer>
    </Box>
  );
};

export default VendorHeader;
