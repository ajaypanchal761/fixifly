import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import { Menu, X, Home, Calendar, Wrench, Phone, ShoppingCart, User, FileText, Star, Info, LogOut, Store, Search, LogIn, Shield } from 'lucide-react';
import { Button, useMediaQuery, Avatar, Typography, Box as MuiBox, TextField, InputAdornment } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SearchSuggestions from './SearchSuggestions';
import { ProductSuggestion } from '../services/publicProductApi';

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
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showMobileSearch, setShowMobileSearch] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
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

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results page
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
      setShowMobileSearch(false);
    }
  };

  const handleSuggestionSelect = (suggestion: ProductSuggestion) => {
    setSearchQuery(suggestion.name);
    setShowSuggestions(false);
    setShowMobileSearch(false);
    // Navigate to search results with the selected product name
    navigate(`/search?q=${encodeURIComponent(suggestion.name)}`);
  };

  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchQuery(value);
    setShowSuggestions(value.trim().length >= 2);
  };

  const handleSearchInputFocus = () => {
    if (searchQuery.trim().length >= 2) {
      setShowSuggestions(true);
    }
  };

  const toggleMobileSearch = () => {
    setShowMobileSearch(!showMobileSearch);
    if (!showMobileSearch && searchQuery.trim().length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleCartClick = () => {
    navigate("/shop");
  };

  // Close mobile search when clicking outside or pressing escape
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMobileSearch && isMobile) {
        const target = event.target as Element;
        if (!target.closest('.mobile-search-container')) {
          setShowMobileSearch(false);
        }
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showMobileSearch) {
        setShowMobileSearch(false);
      }
    };

    if (showMobileSearch) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showMobileSearch, isMobile]);

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Booking", href: "/booking", icon: Calendar },
    { name: "AMC", href: "/amc", icon: Wrench },
    { name: "Support", href: "/support", icon: Phone },
    { name: "Shop", href: "/shop", icon: Store },
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
          
          {/* Center - Desktop Navigation Links */}
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

          {/* Right side - Search Bar and Cart Icon */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', position: 'absolute', right: 16, gap: 2 }}>
              {/* Search Bar */}
              <Box component="form" onSubmit={handleSearch} sx={{ position: 'relative' }}>
                <TextField
                  size="medium"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={handleSearchInputFocus}
                  sx={{
                    width: '300px',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '30px',
                      backgroundColor: '#f8f9fa',
                      height: '48px',
                      '& fieldset': {
                        borderColor: '#e5e7eb',
                        borderWidth: '2px',
                      },
                      '&:hover fieldset': {
                        borderColor: '#d1d5db',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                        borderWidth: '2px',
                      },
                    },
                    '& .MuiInputBase-input': {
                      padding: '12px 16px',
                      fontSize: '16px',
                      fontWeight: 400,
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={20} color="#6b7280" />
                      </InputAdornment>
                    ),
                  }}
                />
                {/* Search Suggestions */}
                <SearchSuggestions
                  query={searchQuery}
                  onSuggestionSelect={handleSuggestionSelect}
                  onClose={() => setShowSuggestions(false)}
                  isVisible={showSuggestions}
                />
              </Box>
              
              {/* AMC Subscription Icon */}
              <IconButton
                color="inherit"
                aria-label="AMC subscriptions"
                onClick={() => navigate('/amc')}
                sx={{
                  color: 'black',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <Shield size={24} />
              </IconButton>
              
              {/* Cart Icon */}
              <IconButton
                color="inherit"
                aria-label="shopping cart"
                onClick={handleCartClick}
                sx={{
                  color: 'black',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <ShoppingCart size={24} />
              </IconButton>
            </Box>
          )}

          {/* Mobile Search Icon, AMC Icon and Cart Icon - Hide when sidebar is open */}
          {isMobile && !open && (
            <Box sx={{ display: 'flex', alignItems: 'center', position: 'absolute', right: 16, gap: 1 }}>
              {/* Mobile Search Icon */}
              <IconButton
                color="inherit"
                aria-label="search"
                onClick={toggleMobileSearch}
                sx={{
                  color: 'black',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <Search size={24} />
              </IconButton>
              
              {/* Mobile AMC Subscription Icon */}
              <IconButton
                color="inherit"
                aria-label="AMC subscriptions"
                onClick={() => navigate('/amc')}
                sx={{
                  color: 'black',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <Shield size={24} />
              </IconButton>
              
              {/* Mobile Cart Icon */}
              <IconButton
                color="inherit"
                aria-label="shopping cart"
                onClick={handleCartClick}
                sx={{
                  color: 'black',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <ShoppingCart size={24} />
              </IconButton>
            </Box>
          )}

          {/* Mobile Search Bar - Shows when search icon is clicked and sidebar is closed */}
          {isMobile && showMobileSearch && !open && (
            <Box className="mobile-search-container" sx={{ 
              position: 'absolute', 
              top: '100%', 
              left: 0, 
              right: 0, 
              backgroundColor: 'white', 
              boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
              zIndex: 1000,
              padding: '12px 16px'
            }}>
              <Box component="form" onSubmit={handleSearch} sx={{ position: 'relative' }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={handleSearchInputFocus}
                  autoFocus
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '25px',
                      backgroundColor: '#f8f9fa',
                      '& fieldset': {
                        borderColor: '#e5e7eb',
                      },
                      '&:hover fieldset': {
                        borderColor: '#d1d5db',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                      },
                    },
                    '& .MuiInputBase-input': {
                      padding: '12px 16px',
                      fontSize: '16px',
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={20} color="#6b7280" />
                      </InputAdornment>
                    ),
                  }}
                />
                {/* Search Suggestions */}
                <SearchSuggestions
                  query={searchQuery}
                  onSuggestionSelect={handleSuggestionSelect}
                  onClose={() => setShowSuggestions(false)}
                  isVisible={showSuggestions}
                />
              </Box>
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
            zIndex: isMobile ? 10001 : 10000, // Higher z-index for mobile to appear above bottom nav
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
          padding: isMobile ? 1.5 : 2,
          backgroundColor: '#f8f9fa',
          flexShrink: 0
        }}>
          <Avatar
            src={isAuthenticated && user?.profileImage ? user.profileImage : undefined}
            sx={{
              width: isMobile ? 50 : 60,
              height: isMobile ? 50 : 60,
              marginBottom: isMobile ? 0.5 : 1,
              backgroundColor: isAuthenticated && user?.profileImage ? 'transparent' : '#3b82f6',
              fontSize: isMobile ? '1.2rem' : '1.5rem'
            }}
          >
            {isAuthenticated && user ? user.name.charAt(0).toUpperCase() : 'U'}
          </Avatar>
          <Typography variant="subtitle1" sx={{ 
            fontWeight: 'bold', 
            marginBottom: 0.25, 
            color: '#1f2937',
            fontSize: isMobile ? '0.9rem' : '1rem'
          }}>
            {isAuthenticated && user ? user.name : 'Guest User'}
          </Typography>
          <Typography variant="body2" sx={{ 
            color: '#6b7280', 
            marginBottom: isMobile ? 0.5 : 1,
            fontSize: isMobile ? '0.75rem' : '0.875rem'
          }}>
            {isAuthenticated && user ? user.phone : 'Not logged in'}
          </Typography>
        </MuiBox>
        
        <Divider />
        
        {/* Menu Options - No Scroll */}
        <MuiBox sx={{ 
          padding: isMobile ? 0.5 : 1,
          flex: 1,
          overflowY: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          paddingBottom: isMobile ? '100px' : '16px' // Extra space for mobile bottom nav
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
                startIcon={<IconComponent size={isMobile ? 16 : 20} />}
                fullWidth
                onClick={handleDrawerClose}
                sx={{
                  justifyContent: 'flex-start',
                  padding: isMobile ? '8px 12px' : '12px 16px',
                  margin: isMobile ? '2px 0' : '4px 0',
                  textTransform: 'none',
                  color: '#374151',
                  fontSize: isMobile ? '14px' : '16px',
                  fontWeight: 500,
                  minHeight: isMobile ? '40px' : 'auto',
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
          
          {/* Authentication Buttons */}
          <Divider sx={{ margin: isMobile ? '8px 0' : '-2px 0' }} />
          
          {isAuthenticated ? (
            // Show Logout button if user is authenticated
            <Button
              onClick={() => {
                logout();
                handleDrawerClose();
                navigate('/');
              }}
              startIcon={<LogOut size={isMobile ? 16 : 20} />}
              fullWidth
              sx={{
                justifyContent: 'flex-start',
                padding: isMobile ? '8px 12px' : '12px 16px',
                margin: isMobile ? '2px 0 20px 0' : '2px 0',
                textTransform: 'none',
                color: '#dc2626',
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: 500,
                minHeight: isMobile ? '40px' : 'auto',
                '&:hover': {
                  backgroundColor: '#fef2f2',
                  color: '#b91c1c'
                }
              }}
            >
              Logout
            </Button>
          ) : (
            // Show Login button if user is not authenticated
            <Button
              component={Link}
              to="/login"
              startIcon={<LogIn size={isMobile ? 16 : 20} />}
              fullWidth
              onClick={handleDrawerClose}
              sx={{
                justifyContent: 'flex-start',
                padding: isMobile ? '8px 12px' : '12px 16px',
                margin: isMobile ? '2px 0 20px 0' : '2px 0',
                textTransform: 'none',
                color: '#059669',
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: 500,
                minHeight: isMobile ? '40px' : 'auto',
                '&:hover': {
                  backgroundColor: '#ecfdf5',
                  color: '#047857'
                }
              }}
            >
              Login
            </Button>
          )}
        </MuiBox>
      </Drawer>
    </Box>
  );
};

export default Header;