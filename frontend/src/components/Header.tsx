import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import { Menu, X, Home, Calendar, Wrench, Phone, User, FileText, Star, Info, LogOut, Store, Search, LogIn, Shield, ShieldCheck, RefreshCw, Download, Handshake, ExternalLink, Bell } from 'lucide-react';
import { Button, useMediaQuery, Avatar, Typography, Box as MuiBox, TextField, InputAdornment } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SearchSuggestions from './SearchSuggestions';
import { ProductSuggestion } from '../services/publicProductApi';
import logoFixifly from '@/assets/logofixifly.png';

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
    setShowMobileSearch(false); // Close search bar when drawer opens
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
    // Show suggestions if field is focused (user is interacting with search)
    setShowSuggestions(true);
  };

  const handleSearchInputFocus = () => {
    // Show suggestions when search field is focused, even if query is empty
    setShowSuggestions(true);
  };

  const toggleMobileSearch = () => {
    setShowMobileSearch(!showMobileSearch);
    // Show suggestions when mobile search is opened
    if (!showMobileSearch) {
      setShowSuggestions(true);
    }
  };

  // Close mobile search when clicking outside or pressing escape
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMobileSearch && isMobile) {
        const target = event.target as Element;
        // Don't close if clicking on search icon or search container
        if (!target.closest('.mobile-search-container') && !target.closest('.mobile-search-icon-button')) {
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

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [showMobileSearch, isMobile]);

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "My Profile", href: "/profile", icon: User },
    { name: "Booking", href: "/booking", icon: Calendar },
    { name: "AMC", href: "/amc", icon: Wrench },
    { name: "Support", href: "/support", icon: Phone },
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
          boxShadow: '0px 1px 2px rgba(0,0,0,0.08)',
          height: '76px',
          top: 0,
          paddingTop: '0px',
          marginBottom: '0px',
        }}
      >
        <Toolbar sx={{ minHeight: '76px !important', justifyContent: 'center', position: 'relative', paddingTop: '8px !important', paddingBottom: '4px !important' }}>
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
              src={logoFixifly}
              alt="Fixfly Logo"
              onClick={handleLogoClick}
              style={{
                height: isMobile ? '50px' : '60px',
                width: 'auto',
                marginLeft: isMobile ? '-10px' : '0',
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
                    target={undefined}
                    rel={undefined}
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
            </Box>
          )}

          {/* Mobile Search Icon, AMC Icon and Cart Icon - Hide when sidebar is open */}
          {isMobile && !open && (
            <Box sx={{ display: 'flex', alignItems: 'center', position: 'absolute', right: 16, gap: 1 }}>
              {/* Mobile Search Icon */}
              <IconButton
                className="mobile-search-icon-button"
                color="inherit"
                aria-label="search"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMobileSearch();
                }}
                sx={{
                  color: 'black',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <Search size={24} />
              </IconButton>
            </Box>
          )}

          {/* Mobile Search Bar - Shows when search icon is clicked and sidebar is closed */}
          {isMobile && showMobileSearch && !open && (
            <Box className="mobile-search-container" sx={{
              position: 'absolute',
              top: 'calc(100% - 20px)',
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
            overflow: 'visible',
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

        {/* Simplified Header - Removing User Profile for Guest-only flow */}
        <MuiBox sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: isMobile ? 1.5 : 2,
          backgroundColor: '#f8f9fa',
          flexShrink: 0
        }}>
          <img
            src={logoFixifly}
            alt="Fixfly"
            style={{ height: '40px', marginBottom: '8px' }}
          />
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1f2937' }}>
            Welcome to Fixfly
          </Typography>
        </MuiBox>

        <Divider />

        {/* Menu Options - Scrollable */}
        <MuiBox sx={{
          padding: isMobile ? 0.5 : 1,
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          paddingBottom: isMobile ? '100px' : '16px' // Extra space for mobile bottom nav
        }}>
          {[
            { name: "My Profile", icon: User, href: "/profile" },
            { name: "Services Booking T&C", icon: FileText, href: "/terms-conditions" },
            { name: "Privacy Policy", icon: ShieldCheck, href: "/privacy-policy" },
            { name: "Cancellation & Refund ", icon: RefreshCw, href: "/cancellation-refund-policy" },
            { name: "Tips & Tricks", icon: Info, href: "/tips-tricks" },
            { name: "About Fixfly", icon: Info, href: "/about" },
            { name: "Rate Us", icon: Star, href: "/rate-us" }
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

          {/* Download App and Rate Us Buttons - Mobile Only */}
          {isMobile && (
            <>
              <Divider sx={{ margin: '12px 0' }} />

              {/* Download Fixfly App Button */}
              <Button
                onClick={() => {
                  handleDrawerClose();
                  // Open app store or download page
                  window.open('https://play.google.com/store/apps/details?id=com.flixfy.user', '_blank');
                }}
                startIcon={<Download size={18} />}
                endIcon={<ExternalLink size={16} />}
                fullWidth
                sx={{
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  margin: '8px 0',
                  textTransform: 'none',
                  color: '#1f2937',
                  fontSize: '15px',
                  fontWeight: 600,
                  minHeight: '48px',
                  backgroundColor: '#f9fafb',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    backgroundColor: '#f3f4f6',
                    borderColor: '#d1d5db',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    transform: 'translateY(-1px)',
                    transition: 'all 0.2s ease-in-out'
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                  }
                }}
              >
                Download Fixfly App
              </Button>

              {/* Rate Us on Google Play Store Button */}
              <Button
                onClick={() => {
                  handleDrawerClose();
                  // Open Google Play Store rating page
                  window.open('https://play.google.com/store/apps/details?id=com.flixfy.user', '_blank');
                }}
                startIcon={<Star size={18} fill="#fbbf24" color="#fbbf24" />}
                endIcon={<ExternalLink size={16} />}
                fullWidth
                sx={{
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  margin: '8px 0',
                  textTransform: 'none',
                  color: '#1f2937',
                  fontSize: '15px',
                  fontWeight: 600,
                  minHeight: '48px',
                  backgroundColor: '#fef3c7',
                  border: '1.5px solid #fde68a',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    backgroundColor: '#fde68a',
                    borderColor: '#fcd34d',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    transform: 'translateY(-1px)',
                    transition: 'all 0.2s ease-in-out'
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                  },
                  '& .MuiButton-startIcon': {
                    marginRight: '8px',
                    '& svg': {
                      color: '#fbbf24',
                      fill: '#fbbf24'
                    }
                  }
                }}
              >
                Rate Us on Google Play
              </Button>

              {/* Join as a Partner Button */}
              <Button
                onClick={() => {
                  handleDrawerClose();
                  // Open Fixfly Partner app on Google Play Store
                  window.open('https://play.google.com/store/apps/details?id=com.fixfly.vendor', '_blank');
                }}
                startIcon={<Handshake size={18} />}
                endIcon={<ExternalLink size={16} />}
                fullWidth
                sx={{
                  justifyContent: 'flex-start',
                  padding: '12px 16px',
                  margin: '8px 0 24px 0',
                  textTransform: 'none',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 600,
                  minHeight: '48px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  borderRadius: '12px',
                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                  border: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    boxShadow: '0 4px 6px rgba(59, 130, 246, 0.4)',
                    transform: 'translateY(-1px)',
                    transition: 'all 0.2s ease-in-out'
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                    boxShadow: '0 2px 3px rgba(59, 130, 246, 0.3)'
                  }
                }}
              >
                Join as a Partner
              </Button>
            </>
          )}

          {/* Rate Us on Google Play Button - Desktop Only */}
          {!isMobile && (
            <>
              <Divider sx={{ margin: '12px 0' }} />
              <Button
                onClick={() => {
                  handleDrawerClose();
                  // Open Google Play Store rating page
                  window.open('https://play.google.com/store/apps/details?id=com.flixfy.user', '_blank');
                }}
                startIcon={<Star size={18} fill="#fbbf24" color="#fbbf24" />}
                endIcon={<ExternalLink size={16} />}
                fullWidth
                sx={{
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  margin: '8px 0',
                  textTransform: 'none',
                  color: '#1f2937',
                  fontSize: '15px',
                  fontWeight: 600,
                  minHeight: '48px',
                  backgroundColor: '#fef3c7',
                  border: '1.5px solid #fde68a',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    backgroundColor: '#fde68a',
                    borderColor: '#fcd34d',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    transform: 'translateY(-1px)',
                    transition: 'all 0.2s ease-in-out'
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                  },
                  '& .MuiButton-startIcon': {
                    marginRight: '8px',
                    '& svg': {
                      color: '#fbbf24',
                      fill: '#fbbf24'
                    }
                  }
                }}
              >
                Rate Us on Google Play
              </Button>
            </>
          )}
        </MuiBox>
      </Drawer>
    </Box>
  );
};

export default Header;