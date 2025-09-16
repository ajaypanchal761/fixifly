import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import { 
  Menu, 
  X, 
  Users, 
  UserCheck, 
  Car, 
  Bus, 
  BarChart3, 
  Calendar, 
  FileText, 
  Package, 
  CreditCard,
  BookOpen,
  Shield,
  Headphones,
  LogOut,
  Bell,
  Search,
  RefreshCw,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Button, useMediaQuery, Avatar, Typography, Box as MuiBox, TextField, InputAdornment, Select, MenuItem } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';

const drawerWidth = 280;

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

const AdminHeader = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(true);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleLogoClick = () => {
    navigate("/admin");
  };

  const adminNavItems = [
    { name: "Dashboard", href: "/admin", icon: BarChart3 },
    { name: "User Management", href: "/admin/users", icon: Users },
    { name: "Vendor Management", href: "/admin/vendors", icon: UserCheck },
    { name: "Service Management", href: "/admin/services", icon: Car },
    { name: "Booking Management", href: "/admin/bookings", icon: Calendar },
    { name: "Payment Management", href: "/admin/payments", icon: FileText },
    { name: "Product Management", href: "/admin/products", icon: Package },
    { name: "Card Management", href: "/admin/cards", icon: CreditCard },
    { name: "Blog Management", href: "/admin/blogs", icon: BookOpen },
    { name: "AMC Management", href: "/admin/amc", icon: Shield },
    { name: "Support Management", href: "/admin/support", icon: Headphones },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar 
        position="fixed" 
        open={open}
        sx={{
          backgroundColor: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          boxShadow: 'var(--shadow-card)',
          height: '80px',
        }}
      >
         <Toolbar sx={{ minHeight: '80px !important', justifyContent: 'space-between', paddingX: 3 }}>
           {/* Left side - Menu Icon and Logo */}
           <Box sx={{ display: 'flex', alignItems: 'center' }}>
             <IconButton
               color="inherit"
               aria-label="open drawer"
               onClick={handleDrawerOpen}
               edge="start"
                 sx={[
                   {
                     mr: 2,
                     color: 'hsl(var(--foreground))',
                   },
                   open && { display: 'none' },
                 ]}
             >
               <Menu />
             </IconButton>
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
               <img 
                 src="/logofixifly.png" 
                 alt="Fixifly Logo" 
                 onClick={handleLogoClick}
                 style={{
                   height: '100px',
                   width: 'auto',
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
           </Box>
          
          {/* Right side - Date Filter, Refresh, and User Profile */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<CalendarIcon size={16} />}
              sx={{
                textTransform: 'none',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--foreground))',
                '&:hover': {
                  borderColor: 'hsl(var(--primary))',
                  backgroundColor: 'hsl(var(--muted))'
                }
              }}
            >
              This Month
            </Button>
            <IconButton
              color="inherit"
              aria-label="refresh"
              sx={{ 
                color: 'hsl(var(--foreground))',
                '&:hover': { backgroundColor: 'hsl(var(--muted))' }
              }}
            >
              <RefreshCw size={20} />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: 'hsl(var(--primary))',
                  fontSize: '0.875rem'
                }}
              >
                AT
              </Avatar>
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'hsl(var(--foreground))' }}>
                Admin User
              </Typography>
            </Box>
          </Box>
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
            backgroundColor: 'hsl(var(--sidebar-background))',
            color: 'hsl(var(--sidebar-foreground))',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        {/* Admin Panel Title */}
        <MuiBox sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: 3,
          backgroundColor: 'hsl(var(--sidebar-primary))',
          flexShrink: 0
        }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'hsl(var(--sidebar-primary-foreground))' }}>
            Admin Panel
          </Typography>
        </MuiBox>
        
        <Divider sx={{ borderColor: 'hsl(var(--sidebar-border))' }} />
        
        {/* Menu Options */}
        <MuiBox sx={{ 
          padding: 1,
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}>
          {adminNavItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = window.location.pathname === item.href;
            
            return (
              <Button
                key={item.name}
                component={Link}
                to={item.href}
                startIcon={<IconComponent size={20} />}
                fullWidth
                sx={{
                  justifyContent: 'flex-start',
                  padding: '12px 16px',
                  margin: '4px 0',
                  textTransform: 'none',
                  color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--sidebar-foreground))',
                  fontSize: '16px',
                  fontWeight: isActive ? 600 : 500,
                  backgroundColor: isActive ? 'hsl(var(--sidebar-accent))' : 'transparent',
                  '&:hover': {
                    backgroundColor: isActive ? 'hsl(var(--sidebar-accent))' : 'hsl(var(--sidebar-accent))',
                    color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--sidebar-accent-foreground))'
                  }
                }}
              >
                {item.name}
              </Button>
            );
          })}
          
          {/* Logout Button */}
          <Divider sx={{ margin: '16px 0', borderColor: 'hsl(var(--sidebar-border))' }} />
          <Button
            startIcon={<LogOut size={20} />}
            fullWidth
            onClick={() => {
              // Clear authentication data
              localStorage.removeItem('adminToken');
              localStorage.removeItem('adminData');
              // Redirect to admin login page
              navigate('/admin/login');
            }}
            sx={{
              justifyContent: 'flex-start',
              padding: '12px 16px',
              margin: '4px 0 30px 0',
              textTransform: 'none',
              color: 'hsl(var(--destructive))',
              fontSize: '16px',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: 'hsl(var(--destructive) / 0.1)',
                color: 'hsl(var(--destructive))'
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

export default AdminHeader;
