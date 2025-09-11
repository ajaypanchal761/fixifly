import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import { Menu, X, Home, Calendar, Wrench, Phone, ShoppingCart, User, FileText, Star, Info, LogOut } from 'lucide-react';
import { Button, useMediaQuery, Avatar, Typography, Box as MuiBox } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';

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


const Header = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Booking", href: "/booking", icon: Calendar },
    { name: "AMC", href: "/amc", icon: Wrench },
    { name: "Support", href: "/support", icon: Phone },
    { name: "Shop", href: "/shop", icon: ShoppingCart },
  ];

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
         <Toolbar sx={{ minHeight: '80px !important', justifyContent: 'space-between' }}>
           <Box sx={{ display: 'flex', alignItems: 'center' }}>
             {/* Menu Icon - Always visible on desktop and mobile */}
             <IconButton
               color="inherit"
               aria-label="open drawer"
               onClick={handleDrawerOpen}
               edge="start"
               sx={[
                 {
                   mr: 2,
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
                 marginLeft: isMobile ? '-20px' : '0',
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
          
          {/* Desktop Navigation Links */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {navItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Button
                    key={item.name}
                    component={Link}
                    to={item.href}
                    startIcon={<IconComponent size={18} />}
                    sx={{
                      color: 'black',
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '16px',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      },
                    }}
                  >
                    {item.name}
                  </Button>
                );
              })}
            </Box>
          )}

          {/* Mobile Cart Icon */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="shopping cart"
              sx={{
                color: 'black',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <ShoppingCart size={24} />
            </IconButton>
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
        variant={isMobile ? "temporary" : "persistent"}
        anchor="left"
        open={open}
        onClose={handleDrawerClose}
      >
        {/* Close Button for Desktop - Top Right Corner */}
        {!isMobile && (
          <MuiBox sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            padding: 1,
            position: 'absolute',
            top: 0,
            right: 0,
            zIndex: 1
          }}>
            <IconButton 
              onClick={handleDrawerClose}
              sx={{
                color: '#6b7280',
                '&:hover': {
                  backgroundColor: '#f3f4f6',
                  color: '#374151'
                }
              }}
            >
              <X size={20} />
            </IconButton>
          </MuiBox>
        )}

        {/* User Profile Section - Fixed at top */}
        <MuiBox sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          padding: 2,
          backgroundColor: '#f8f9fa',
          flexShrink: 0
        }}>
          <Avatar
            sx={{
              width: 60,
              height: 60,
              marginBottom: 1,
              backgroundColor: '#3b82f6',
              fontSize: '1.5rem'
            }}
          >
            U
          </Avatar>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', marginBottom: 0.25, color: '#1f2937' }}>
            John Doe
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280', marginBottom: 1 }}>
            +91 98765 43210
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
          minHeight: 0,
          paddingBottom: isMobile ? '120px' : '16px' // Extra space for mobile bottom nav
        }}>
          {[
            { name: "Profile", icon: User, href: "/profile" },
            { name: "Booking", icon: Calendar, href: "/booking" },
            { name: "AMC Plan", icon: Wrench, href: "/amc" },
            { name: "Services Booking T&C", icon: FileText, href: "/terms-conditions" },
            { name: "Tips & Tricks", icon: Info, href: "/tips" },
            { name: "About Fixfly", icon: Info, href: "/about" },
            { name: "Rate Us", icon: Star, href: "/rate" }
          ].map((item) => {
            const IconComponent = item.icon;
            return (
              <Button
                key={item.name}
                component={Link}
                to={item.href}
                startIcon={<IconComponent size={20} />}
                fullWidth
                onClick={handleDrawerClose}
                sx={{
                  justifyContent: 'flex-start',
                  padding: '12px 16px',
                  margin: '4px 0',
                  textTransform: 'none',
                  color: '#374151',
                  fontSize: '16px',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: '#f3f4f6',
                    color: '#1f2937'
                  }
                }}
              >
                {item.name}
              </Button>
            );
          })}
          
          {/* Logout Button - Right after Rate Us */}
          <Divider sx={{ margin: isMobile ? '8px 0' : '-2px 0' }} />
          <Button
            component="a"
            href="/logout"
            startIcon={<LogOut size={20} />}
            fullWidth
            sx={{
              justifyContent: 'flex-start',
              padding: '12px 16px',
              margin: isMobile ? '4px 0 30px 0' : '2px 0', // Reduced top margin on desktop
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
        </MuiBox>
      </Drawer>
    </Box>
  );
};

export default Header;