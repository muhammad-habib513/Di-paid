import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  useTheme,
  useMediaQuery,
  Container,
  AppBar,
  Toolbar,
  Drawer,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItem,
  Divider,
  List,
  IconButton
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
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

export default function Profile() {
  const [profile, setProfile] = useState({
    username: "",
    email: "",
    full_name: "",
    phone: "",
    location: "",
    bio: ""
  });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
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

  useEffect(() => {
    if (isAuthenticated && user) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setProfile({
        username: user?.username || "",
        email: user?.email || "",
        full_name: user?.full_name || "",
        phone: user?.phone || "",
        location: user?.location || "",
        bio: user?.bio || ""
      });
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEditMode(false);
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
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
          Profile
        </Typography>
        {editMode && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              color="inherit"
              onClick={() => setEditMode(false)}
              disabled={saving}
            >
              <CancelIcon />
            </IconButton>
            <IconButton
              color="inherit"
              onClick={handleSaveProfile}
              disabled={saving}
            >
              <SaveIcon />
            </IconButton>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );

  const renderDesktopAppBar = () => (
    <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <PersonIcon sx={{ mr: 2 }} />
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Profile Settings
        </Typography>
        {editMode && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              color="inherit"
              startIcon={<CancelIcon />}
              onClick={() => setEditMode(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              color="inherit"
              startIcon={<SaveIcon />}
              onClick={handleSaveProfile}
              disabled={saving}
            >
              Save
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 3 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Please log in to view your profile
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
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
                Profile Settings
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage your account information and preferences
              </Typography>
            </Box>
          )}

          <Grid container spacing={isMobile ? 2 : 3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 600 }}>
                      Personal Information
                    </Typography>
                    {!editMode && (
                      <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => setEditMode(true)}
                        size={isMobile ? "small" : "medium"}
                      >
                        Edit
                      </Button>
                    )}
                  </Box>

                  <Grid container spacing={isMobile ? 2 : 3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Username"
                        fullWidth
                        value={profile.username}
                        onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                        disabled={!editMode}
                        variant="outlined"
                        size={isMobile ? "medium" : "large"}
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Email"
                        type="email"
                        fullWidth
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        disabled={!editMode}
                        variant="outlined"
                        size={isMobile ? "medium" : "large"}
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Full Name"
                        fullWidth
                        value={profile.full_name}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        disabled={!editMode}
                        variant="outlined"
                        size={isMobile ? "medium" : "large"}
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Phone"
                        fullWidth
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        disabled={!editMode}
                        variant="outlined"
                        size={isMobile ? "medium" : "large"}
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Location"
                        fullWidth
                        value={profile.location}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        disabled={!editMode}
                        variant="outlined"
                        size={isMobile ? "medium" : "large"}
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Bio"
                        fullWidth
                        multiline
                        rows={isMobile ? 3 : 4}
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        disabled={!editMode}
                        variant="outlined"
                        size={isMobile ? "medium" : "large"}
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                  </Grid>

                  {editMode && (
                    <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveProfile}
                        disabled={saving}
                        size={isMobile ? "large" : "medium"}
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={() => setEditMode(false)}
                        disabled={saving}
                        size={isMobile ? "large" : "medium"}
                      >
                        Cancel
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                  <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 600, mb: 2 }}>
                    Quick Actions
                  </Typography>
                  
                  <List>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <SecurityIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Security Settings"
                        secondary="Manage 2FA and security"
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate("/security")}
                      >
                        Settings
                      </Button>
                    </ListItem>
                    
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <NotificationsIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Notifications"
                        secondary="Manage notifications"
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate("/notifications")}
                      >
                        Settings
                      </Button>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
} 