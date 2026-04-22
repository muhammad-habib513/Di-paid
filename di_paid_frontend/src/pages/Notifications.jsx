import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  Badge,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Container,
  AppBar,
  Toolbar,
  Drawer,
  ListItemButton
} from "@mui/material";
import { 
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Payment as PaymentIcon,
  Group as GroupIcon,
  Receipt as ReceiptIcon,
  Settings as SettingsIcon,
  MarkEmailRead as MarkEmailReadIcon,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Chat as ChatIcon,
  BarChart as BarChartIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  ArrowBack as ArrowBackIcon
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences
} from "../api/notifications";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [preferences, setPreferences] = useState({});
  const [loading, setLoading] = useState(true);
  const [openPreferencesDialog, setOpenPreferencesDialog] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const navigationItems = [
    { title: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { title: 'Groups', path: '/groups', icon: <GroupIcon /> },
    { title: 'Expenses', path: '/expenses', icon: <ReceiptIcon /> },
    { title: 'Payments', path: '/payments', icon: <PaymentIcon /> },
    { title: 'Chat', path: '/chat', icon: <ChatIcon /> },
    { title: 'Reports', path: '/reports', icon: <BarChartIcon /> },
    { title: 'Security', path: '/security', icon: <SecurityIcon /> },
    { title: 'Profile', path: '/profile', icon: <PersonIcon /> },
    { title: 'Notifications', path: '/notifications', icon: <NotificationsIcon /> }
  ];

  // Load notifications only when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadNotifications();
      loadPreferences();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      setError("Failed to load notifications: " + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      const data = await getNotificationPreferences();
      setPreferences(data);
    } catch (err) {
      console.error("Failed to load preferences:", err);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setSuccess("Notification marked as read!");
    } catch (err) {
      setError("Failed to mark notification as read: " + (err.response?.data?.msg || err.message));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setSuccess("All notifications marked as read!");
    } catch (err) {
      setError("Failed to mark all notifications as read: " + (err.response?.data?.msg || err.message));
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
      setSuccess("Notification deleted!");
    } catch (err) {
      setError("Failed to delete notification: " + (err.response?.data?.msg || err.message));
    }
  };

  const handleUpdatePreferences = async (newPreferences) => {
    try {
      await updateNotificationPreferences(newPreferences);
      setPreferences(newPreferences);
      setOpenPreferencesDialog(false);
      setSuccess("Notification preferences updated!");
    } catch (err) {
      setError("Failed to update preferences: " + (err.response?.data?.msg || err.message));
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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
          Notifications
        </Typography>
        <Badge badgeContent={unreadCount} color="error" sx={{ mr: 2 }}>
          <NotificationsIcon />
        </Badge>
        <Button
          color="inherit"
          startIcon={<SettingsIcon />}
          onClick={() => setOpenPreferencesDialog(true)}
          sx={{ fontSize: '0.875rem' }}
        >
          Settings
        </Button>
      </Toolbar>
    </AppBar>
  );

  const renderDesktopAppBar = () => (
    <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <NotificationsIcon sx={{ mr: 2 }} />
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Notifications
        </Typography>
        <Button
          color="inherit"
          startIcon={<SettingsIcon />}
          onClick={() => setOpenPreferencesDialog(true)}
        >
          Preferences
        </Button>
      </Toolbar>
    </AppBar>
  );

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'payment':
        return <PaymentIcon color="primary" />;
      case 'payment_confirmed':
        return <CheckCircleIcon color="success" />;
      case 'expense':
        return <ReceiptIcon color="warning" />;
      case 'group':
        return <GroupIcon color="info" />;
      default:
        return <NotificationsIcon color="action" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'payment':
        return 'primary';
      case 'payment_confirmed':
        return 'success';
      case 'expense':
        return 'warning';
      case 'group':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Show loading while checking authentication
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show message if not authenticated
  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 3 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Please log in to view your notifications
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/login")}
              sx={{ mt: 2 }}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

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
        <Container maxWidth="xl" sx={{ mt: isMobile ? 8 : 9, mb: 3 }}>
          {!isMobile && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon sx={{ fontSize: 32 }} />
                </Badge>
                <Typography variant="h4" component="h1">
                  Notifications
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={() => setOpenPreferencesDialog(true)}
                >
                  Preferences
                </Button>
                {unreadCount > 0 && (
                  <Button
                    variant="contained"
                    startIcon={<MarkEmailReadIcon />}
                    onClick={handleMarkAllAsRead}
                  >
                    Mark All Read
                  </Button>
                )}
              </Box>
            </Box>
          )}

          {notifications.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: isMobile ? 6 : 8 }}>
                <NotificationsOffIcon sx={{ fontSize: isMobile ? 48 : 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant={isMobile ? "h6" : "h5"} color="text.secondary" gutterBottom>
                  No notifications yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ px: isMobile ? 2 : 0 }}>
                  You'll see notifications here when you receive payments, expenses are added, or other activities occur.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent sx={{ p: isMobile ? 1 : 3 }}>
                <List>
                  {notifications.map((notification, index) => (
                    <React.Fragment key={notification.id}>
                      <ListItem
                        sx={{
                          backgroundColor: notification.read ? 'transparent' : 'action.hover',
                          borderRadius: 1,
                          mb: 1,
                          px: isMobile ? 1 : 2
                        }}
                      >
                        <ListItemIcon>
                          {getNotificationIcon(notification.type)}
                        </ListItemIcon>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                            <Typography variant="body1" sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
                              {notification.message}
                            </Typography>
                            {!notification.read && (
                              <Chip 
                                label="New" 
                                size="small" 
                                color="error" 
                                variant="outlined"
                                sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
                              />
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
                              {formatDate(notification.created_at)}
                            </Typography>
                            <Chip 
                              label={notification.type.replace('_', ' ')} 
                              size="small" 
                              color={getNotificationColor(notification.type)}
                              variant="outlined"
                              sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
                            />
                          </Box>
                        </Box>
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {!notification.read && (
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleMarkAsRead(notification.id)}
                                title="Mark as read"
                              >
                                <CheckCircleIcon fontSize={isMobile ? "small" : "medium"} />
                              </IconButton>
                            )}
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteNotification(notification.id)}
                              title="Delete notification"
                            >
                              <DeleteIcon fontSize={isMobile ? "small" : "medium"} />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < notifications.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}

          {/* Mobile Mark All Read Button */}
          {isMobile && unreadCount > 0 && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="contained"
                startIcon={<MarkEmailReadIcon />}
                onClick={handleMarkAllAsRead}
                fullWidth
              >
                Mark All as Read
              </Button>
            </Box>
          )}
        </Container>
      </Box>

      {/* Notification Preferences Dialog */}
      <Dialog 
        open={openPreferencesDialog} 
        onClose={() => setOpenPreferencesDialog(false)} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          {isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => setOpenPreferencesDialog(false)}
                aria-label="close"
                sx={{ mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
              Notification Preferences
            </Box>
          )}
          {!isMobile && "Notification Preferences"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: isMobile ? 0 : 1 }}>
            <Box>
              <Typography variant={isMobile ? "h6" : "h5"} gutterBottom>
                Email Notifications
              </Typography>
            </Box>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.email_payments || false}
                    onChange={(e) => setPreferences({ ...preferences, email_payments: e.target.checked })}
                  />
                }
                label="Payment notifications"
              />
            </Box>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.email_expenses || false}
                    onChange={(e) => setPreferences({ ...preferences, email_expenses: e.target.checked })}
                  />
                }
                label="Expense notifications"
              />
            </Box>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.email_groups || false}
                    onChange={(e) => setPreferences({ ...preferences, email_groups: e.target.checked })}
                  />
                }
                label="Group activity notifications"
              />
            </Box>
            <Box>
              <Divider sx={{ my: isMobile ? 1 : 2 }} />
              <Typography variant={isMobile ? "h6" : "h5"} gutterBottom>
                In-App Notifications
              </Typography>
            </Box>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.in_app_payments || false}
                    onChange={(e) => setPreferences({ ...preferences, in_app_payments: e.target.checked })}
                  />
                }
                label="Payment notifications"
              />
            </Box>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.in_app_expenses || false}
                    onChange={(e) => setPreferences({ ...preferences, in_app_expenses: e.target.checked })}
                  />
                }
                label="Expense notifications"
              />
            </Box>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.in_app_groups || false}
                    onChange={(e) => setPreferences({ ...preferences, in_app_groups: e.target.checked })}
                  />
                }
                label="Group activity notifications"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: isMobile ? 2 : 3 }}>
          <Button onClick={() => setOpenPreferencesDialog(false)}>
            Cancel
          </Button>
          <Button onClick={() => handleUpdatePreferences(preferences)} variant="contained">
            Save Preferences
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError("")}>
        <Alert onClose={() => setError("")} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess("")}>
        <Alert onClose={() => setSuccess("")} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
} 