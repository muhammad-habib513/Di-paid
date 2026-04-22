import React, { useState, useEffect } from "react";
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button,
  useTheme,
  useMediaQuery,
  Container,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  ListItemButton,
  Chip,
  Fade
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Group as GroupIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  Chat as ChatIcon,
  BarChart as BarChartIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  AttachMoney
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import QuickActionCard from "../components/QuickActionCard";
import StatCard from "../components/StatCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { getSpendingOverview } from "../api/reports";

export default function DashboardMui() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalPaid: 0,
    outstandingBalance: 0,
    activeGroups: 0
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getSpendingOverview();
        setStats(data);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadStats();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const navigationItems = [
    { title: 'Groups', path: '/groups', icon: <GroupIcon />, description: 'Manage your bill splitting groups' },
    { title: 'Expenses', path: '/expenses', icon: <ReceiptIcon />, description: 'Track and manage your expenses' },
    { title: 'Payments', path: '/payments', icon: <PaymentIcon />, description: 'Record and track payments between members' },
    { title: 'Chat', path: '/chat', icon: <ChatIcon />, description: 'Real-time messaging with your group members' },
    { title: 'Reports & Analytics', path: '/reports', icon: <BarChartIcon />, description: 'View detailed reports and spending insights' },
    { title: 'Security', path: '/security', icon: <SecurityIcon />, description: 'Manage 2FA, sessions, and security settings' },
    { title: 'Profile', path: '/profile', icon: <PersonIcon />, description: 'Update your profile and settings' },
    { title: 'Notifications', path: '/notifications', icon: <NotificationsIcon />, description: 'View and manage your notifications' }
  ];

  const renderNavigationDrawer = () => (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={isMobile ? drawerOpen : true}
      onClose={() => setDrawerOpen(false)}
      sx={{
        width: 280,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          top: isMobile ? 0 : 64,
          height: isMobile ? '100%' : 'calc(100% - 64px)',
        },
      }}
    >
      <Box sx={{ overflow: 'auto', mt: isMobile ? 0 : 1 }}>
        <List>
          {navigationItems.map((item) => (
            <ListItemButton
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.title}
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: location.pathname === item.path ? 600 : 400
                }}
              />
            </ListItemButton>
          ))}
        </List>
        <Divider />
        <List>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </List>
      </Box>
    </Drawer>
  );

  const renderMobileAppBar = () => (
    <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={() => setDrawerOpen(true)}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Di-Paid
        </Typography>
        <Typography variant="body2" sx={{ mr: 2 }}>
          {user?.username || 'User'}
        </Typography>
      </Toolbar>
    </AppBar>
  );

  const renderDesktopAppBar = () => (
    <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <DashboardIcon sx={{ mr: 2 }} />
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Di-Paid Dashboard
        </Typography>
        <Typography variant="body2" sx={{ mr: 2 }}>
          Welcome, {user?.username || 'User'}!
        </Typography>
        <Button color="inherit" onClick={handleLogout}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );

  const renderDashboardContent = () => {
    if (loading) {
      return <LoadingSpinner message="Loading dashboard..." fullScreen />;
    }

    return (
      <Container maxWidth="xl" sx={{ mt: isMobile ? 8 : 9, mb: 3 }}>
        <Fade in={true} timeout={600}>
          <Box>
            <Box sx={{ mb: 4 }}>
              <Typography 
                variant={isMobile ? "h5" : "h4"} 
                component="h1" 
                gutterBottom
                sx={{ fontWeight: 600 }}
              >
                Welcome back, {user?.username || 'User'}! 👋
              </Typography>
              <Typography 
                variant={isMobile ? "body1" : "h6"} 
                color="text.secondary"
                sx={{ mb: 3 }}
              >
                Here's your financial overview and quick actions
              </Typography>
            </Box>

            {/* Quick Stats */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Financial Overview
              </Typography>
              <Grid container spacing={isMobile ? 2 : 3}>
                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                  <StatCard
                    title="Total Spent"
                    value={`$${(stats.totalSpent || 0).toFixed(2)}`}
                    icon={<AttachMoney />}
                    color="primary"
                    trend="up"
                    trendValue="+12%"
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                  <StatCard
                    title="Total Paid"
                    value={`$${(stats.totalPaid || 0).toFixed(2)}`}
                    icon={<AccountBalance />}
                    color="success"
                    trend="up"
                    trendValue="+8%"
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                  <StatCard
                    title="Outstanding"
                    value={`$${(stats.outstandingBalance || 0).toFixed(2)}`}
                    icon={<TrendingDown />}
                    color="warning"
                    trend="down"
                    trendValue="-5%"
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                  <StatCard
                    title="Active Groups"
                    value={stats.activeGroups || 0}
                    icon={<GroupIcon />}
                    color="info"
                    trend="up"
                    trendValue="+2"
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Quick Actions */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Quick Actions
              </Typography>
              <Grid container spacing={isMobile ? 2 : 3}>
                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                  <QuickActionCard
                    title="Add Expense"
                    description="Record a new expense"
                    icon={<ReceiptIcon />}
                    color="primary"
                    action="/expenses"
                    onClick={() => handleNavigation('/expenses')}
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                  <QuickActionCard
                    title="Create Group"
                    description="Start a new group"
                    icon={<GroupIcon />}
                    color="success"
                    action="/groups"
                    onClick={() => handleNavigation('/groups')}
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                  <QuickActionCard
                    title="View Reports"
                    description="Check your analytics"
                    icon={<BarChartIcon />}
                    color="info"
                    action="/reports"
                    onClick={() => handleNavigation('/reports')}
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                  <QuickActionCard
                    title="Send Payment"
                    description="Record a payment"
                    icon={<PaymentIcon />}
                    color="warning"
                    action="/payments"
                    onClick={() => handleNavigation('/payments')}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Main Navigation */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                All Features
              </Typography>
              <Grid container spacing={isMobile ? 2 : 3}>
                {navigationItems.map((item) => (
                  <Grid key={item.path} item size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 6,
                        },
                      }}
                      onClick={() => handleNavigation(item.path)}
                    >
                      <CardContent sx={{ 
                        p: isMobile ? 2 : 3,
                        textAlign: 'center',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}>
                        <Box>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            mb: 2,
                            color: 'primary.main'
                          }}>
                            {React.cloneElement(item.icon, { 
                              sx: { fontSize: isMobile ? 32 : 40 } 
                            })}
                          </Box>
                          <Typography 
                            variant={isMobile ? "h6" : "h5"} 
                            gutterBottom
                            sx={{ fontWeight: 600, mb: 1 }}
                          >
                            {item.title}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              mb: 2,
                              lineHeight: 1.4,
                              fontSize: isMobile ? '0.875rem' : '1rem'
                            }}
                          >
                            {item.description}
                          </Typography>
                        </Box>
                        <Button 
                          variant="outlined" 
                          fullWidth
                          sx={{ 
                            mt: 'auto',
                            py: isMobile ? 1 : 1.5,
                            fontSize: isMobile ? '0.875rem' : '1rem',
                            borderRadius: 2
                          }}
                        >
                          Open {item.title}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        </Fade>
      </Container>
    );
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {isMobile ? renderMobileAppBar() : renderDesktopAppBar()}
      {renderNavigationDrawer()}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          width: isMobile ? '100%' : 'calc(100% - 280px)',
          ml: isMobile ? 0 : '280px'
        }}
      >
        {renderDashboardContent()}
      </Box>
    </Box>
  );
}
