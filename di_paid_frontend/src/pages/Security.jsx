import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Snackbar,
  Switch,
  FormControlLabel,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Container,
  AppBar,
  Toolbar,
  Drawer,
  ListItemIcon,
  ListItemButton
} from "@mui/material";
import { 
  Security as SecurityIcon,
  QrCode as QrCodeIcon,
  Smartphone as SmartphoneIcon,
  Computer as ComputerIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Lock as LockIcon,
  Shield as ShieldIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Group as GroupIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  Chat as ChatIcon,
  BarChart as BarChartIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  ArrowBack as ArrowBackIcon
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  setup2FA,
  verify2FASetup,
  disable2FA,
  get2FAStatus,
  getSessions,
  revokeSession,
  revokeAllSessions,
  getSecuritySettings,
  updateSecuritySettings,
  getAuditLogs,
  changePassword
} from "../api/security";

export default function Security() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [twoFactorStatus, setTwoFactorStatus] = useState({});
  const [sessions, setSessions] = useState([]);
  const [securitySettings, setSecuritySettings] = useState({});
  const [auditLogs, setAuditLogs] = useState({ logs: [], total: 0, pages: 0, current_page: 1 });
  const [open2FADialog, setOpen2FADialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [twoFASetup, setTwoFASetup] = useState({});
  const [verificationCode, setVerificationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [setupStep, setSetupStep] = useState(0);
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
      loadSecurityData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      const [statusData, sessionsData, settingsData, logsData] = await Promise.all([
        get2FAStatus(),
        getSessions(),
        getSecuritySettings(),
        getAuditLogs()
      ]);
      setTwoFactorStatus(statusData);
      setSessions(sessionsData);
      setSecuritySettings(settingsData);
      setAuditLogs(logsData);
    } catch (err) {
      console.error("Failed to load security data:", err);
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      setError("Failed to load security data: " + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handle2FASetup = async () => {
    try {
      const data = await setup2FA();
      setTwoFASetup(data);
      setSetupStep(1);
    } catch (err) {
      setError("Failed to setup 2FA: " + (err.response?.data?.msg || err.message));
    }
  };

  const handle2FAVerification = async () => {
    try {
      await verify2FASetup(verificationCode);
      setSuccess("2FA enabled successfully!");
      setOpen2FADialog(false);
      setVerificationCode("");
      setSetupStep(0);
      await loadSecurityData();
    } catch (err) {
      setError("Failed to verify 2FA: " + (err.response?.data?.msg || err.message));
    }
  };

  const handle2FADisable = async () => {
    try {
      await disable2FA(verificationCode);
      setSuccess("2FA disabled successfully!");
      setOpen2FADialog(false);
      setVerificationCode("");
      await loadSecurityData();
    } catch (err) {
      setError("Failed to disable 2FA: " + (err.response?.data?.msg || err.message));
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await revokeSession(sessionId);
      setSuccess("Session revoked successfully!");
      await loadSecurityData();
    } catch (err) {
      setError("Failed to revoke session: " + (err.response?.data?.msg || err.message));
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      await revokeAllSessions();
      setSuccess("All sessions revoked successfully!");
      await loadSecurityData();
    } catch (err) {
      setError("Failed to revoke sessions: " + (err.response?.data?.msg || err.message));
    }
  };

  const handleUpdateSettings = async (newSettings) => {
    try {
      await updateSecuritySettings(newSettings);
      setSecuritySettings(newSettings);
      setSuccess("Security settings updated successfully!");
    } catch (err) {
      setError("Failed to update settings: " + (err.response?.data?.msg || err.message));
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    
    try {
      await changePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword
      });
      setSuccess("Password changed successfully!");
      setOpenPasswordDialog(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (err) {
      setError("Failed to change password: " + (err.response?.data?.msg || err.message));
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
          Security
        </Typography>
        <IconButton
          color="inherit"
          onClick={loadSecurityData}
          disabled={loading}
        >
          <RefreshIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );

  const renderDesktopAppBar = () => (
    <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <SecurityIcon sx={{ mr: 2 }} />
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Security Settings
        </Typography>
        <IconButton
          color="inherit"
          onClick={loadSecurityData}
          disabled={loading}
        >
          <RefreshIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDeviceIcon = (deviceInfo) => {
    if (deviceInfo.includes('Mobile') || deviceInfo.includes('Android') || deviceInfo.includes('iPhone')) {
      return <SmartphoneIcon />;
    }
    return <ComputerIcon />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 3 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Please log in to access security settings
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
                Security Settings
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage your account security, 2FA, sessions, and privacy settings
              </Typography>
            </Box>
          )}

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons={isMobile ? "auto" : false}
              allowScrollButtonsMobile
            >
              <Tab label="2FA" />
              <Tab label="Sessions" />
              <Tab label="Settings" />
              <Tab label="Audit Log" />
            </Tabs>
          </Box>

          {/* Tab Content */}
          {activeTab === 0 && (
            <Card>
              <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <ShieldIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 600 }}>
                    Two-Factor Authentication
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    Add an extra layer of security to your account by enabling two-factor authentication.
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Chip
                      label={twoFactorStatus.enabled ? "Enabled" : "Disabled"}
                      color={twoFactorStatus.enabled ? "success" : "default"}
                      icon={twoFactorStatus.enabled ? <CheckCircleIcon /> : <WarningIcon />}
                    />
                    {twoFactorStatus.enabled && (
                      <Typography variant="body2" color="text.secondary">
                        Last enabled: {formatDate(twoFactorStatus.enabled_at)}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  onClick={() => setOpen2FADialog(true)}
                  startIcon={twoFactorStatus.enabled ? <LockIcon /> : <ShieldIcon />}
                  color={twoFactorStatus.enabled ? "error" : "primary"}
                  size={isMobile ? "large" : "medium"}
                >
                  {twoFactorStatus.enabled ? "Disable 2FA" : "Enable 2FA"}
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 1 && (
            <Card>
              <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ComputerIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 600 }}>
                      Active Sessions
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleRevokeAllSessions}
                    size={isMobile ? "small" : "medium"}
                  >
                    Revoke All
                  </Button>
                </Box>

                {sessions.length > 0 ? (
                  <List>
                    {sessions.map((session) => (
                      <ListItem key={session.id} sx={{ px: 0 }}>
                        <ListItemIcon>
                          {getDeviceIcon(session.device_info)}
                        </ListItemIcon>
                        <ListItemText
                          primary={session.device_info}
                          secondary={`${session.location} • Last active: ${formatDate(session.last_activity)}`}
                          primaryTypographyProps={{
                            fontWeight: 600,
                            fontSize: isMobile ? '0.9rem' : '1rem'
                          }}
                          secondaryTypographyProps={{
                            fontSize: isMobile ? '0.8rem' : '0.875rem'
                          }}
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={session.current ? "Current" : "Active"}
                              size={isMobile ? "small" : "medium"}
                              color={session.current ? "primary" : "default"}
                              variant="outlined"
                            />
                            {!session.current && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRevokeSession(session.id)}
                              >
                                <DeleteIcon fontSize={isMobile ? "small" : "medium"} />
                              </IconButton>
                            )}
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No active sessions found
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 2 && (
            <Grid container spacing={isMobile ? 2 : 3}>
              <Grid sx={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <SettingsIcon sx={{ mr: 2, color: 'primary.main' }} />
                      <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 600 }}>
                        Security Preferences
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={securitySettings.email_notifications || false}
                            onChange={(e) => handleUpdateSettings({
                              ...securitySettings,
                              email_notifications: e.target.checked
                            })}
                          />
                        }
                        label="Email notifications for security events"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={securitySettings.login_alerts || false}
                            onChange={(e) => handleUpdateSettings({
                              ...securitySettings,
                              login_alerts: e.target.checked
                            })}
                          />
                        }
                        label="Login alerts"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={securitySettings.session_timeout || false}
                            onChange={(e) => handleUpdateSettings({
                              ...securitySettings,
                              session_timeout: e.target.checked
                            })}
                          />
                        }
                        label="Auto-logout after inactivity"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid sx={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <LockIcon sx={{ mr: 2, color: 'primary.main' }} />
                      <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 600 }}>
                        Password
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Change your account password to keep your account secure.
                    </Typography>
                    
                    <Button
                      variant="outlined"
                      onClick={() => setOpenPasswordDialog(true)}
                      startIcon={<LockIcon />}
                      size={isMobile ? "large" : "medium"}
                      fullWidth
                    >
                      Change Password
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {activeTab === 3 && (
            <Card>
              <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <HistoryIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 600 }}>
                    Security Audit Log
                  </Typography>
                </Box>

                {auditLogs.logs && auditLogs.logs.length > 0 ? (
                  <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                    <Table size={isMobile ? "small" : "medium"}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Event</TableCell>
                          <TableCell>IP Address</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {auditLogs.logs.map((log, index) => (
                          <TableRow key={index}>
                            <TableCell>{formatDate(log.timestamp)}</TableCell>
                            <TableCell>{log.event}</TableCell>
                            <TableCell>{log.ip_address}</TableCell>
                            <TableCell>
                              <Chip
                                label={log.status}
                                size="small"
                                color={log.status === 'success' ? 'success' : 'error'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No audit logs found
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
        </Container>
      </Box>

      {/* 2FA Setup Dialog */}
      <Dialog 
        open={open2FADialog} 
        onClose={() => setOpen2FADialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          {isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => setOpen2FADialog(false)}
                aria-label="close"
                sx={{ mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
              {twoFactorStatus.enabled ? "Disable 2FA" : "Setup 2FA"}
            </Box>
          )}
          {!isMobile && (twoFactorStatus.enabled ? "Disable 2FA" : "Setup 2FA")}
        </DialogTitle>
    <DialogContent>
  {!twoFactorStatus.enabled ? (
    <>
      <Stepper activeStep={setupStep} orientation={isMobile ? "vertical" : "horizontal"}>
        <Step>
          <StepLabel>Generate QR Code</StepLabel>
          {isMobile && (
            <StepContent>
              {/* Step 1 Content for Vertical Stepper (Mobile) */}
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Click the button below to generate a QR code for your authenticator app.
                </Typography>
                <Button variant="contained" onClick={handle2FASetup} startIcon={<QrCodeIcon />}>
                  Generate QR Code
                </Button>
              </Box>
            </StepContent>
          )}
        </Step>
        <Step>
          <StepLabel>Verify Setup</StepLabel>
          {isMobile && (
            <StepContent>
              {/* Step 2 Content for Vertical Stepper (Mobile) */}
              <Box sx={{ textAlign: 'center', py: 2 }}>
                {twoFASetup.qr_code && (
                  <Box sx={{ mb: 2 }}>
                    <img src={twoFASetup.qr_code} alt="QR Code" style={{ maxWidth: '200px', height: 'auto' }} />
                  </Box>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Scan the QR code with your authenticator app and enter the verification code.
                </Typography>
                <TextField fullWidth label="Verification Code" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} sx={{ mb: 2 }} />
                <Button variant="contained" onClick={handle2FAVerification} disabled={!verificationCode}>
                  Verify & Enable 2FA
                </Button>
              </Box>
            </StepContent>
          )}
        </Step>
      </Stepper>

      {/* Content for Horizontal Stepper (Desktop) */}
      {!isMobile && (
        <Box sx={{ mt: 3 }}>
          {setupStep === 0 && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Click the button below to generate a QR code for your authenticator app.
              </Typography>
              <Button variant="contained" onClick={handle2FASetup} startIcon={<QrCodeIcon />}>
                Generate QR Code
              </Button>
            </Box>
          )}
          {setupStep === 1 && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              {twoFASetup.qr_code && (
                <Box sx={{ mb: 2 }}>
                  <img src={twoFASetup.qr_code} alt="QR Code" style={{ maxWidth: '200px', height: 'auto' }} />
                </Box>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Scan the QR code with your authenticator app and enter the verification code.
              </Typography>
              <TextField fullWidth label="Verification Code" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} sx={{ mb: 2 }} />
              <Button variant="contained" onClick={handle2FAVerification} disabled={!verificationCode}>
                Verify & Enable 2FA
              </Button>
            </Box>
          )}
        </Box>
      )}
    </>
  ) : (
    <Box sx={{ textAlign: 'center', py: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Enter your current 2FA code to disable two-factor authentication.
      </Typography>
      <TextField fullWidth label="Verification Code" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} sx={{ mb: 2 }} />
      <Button variant="contained" color="error" onClick={handle2FADisable} disabled={!verificationCode}>
        Disable 2FA
      </Button>
    </Box>
  )}
</DialogContent>
        <DialogActions sx={{ p: isMobile ? 2 : 3 }}>
          <Button onClick={() => setOpen2FADialog(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog 
        open={openPasswordDialog} 
        onClose={() => setOpenPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          {isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => setOpenPasswordDialog(false)}
                aria-label="close"
                sx={{ mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
              Change Password
            </Box>
          )}
          {!isMobile && "Change Password"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="password"
            label="Current Password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            sx={{ mb: 2, mt: isMobile ? 0 : 1 }}
          />
          <TextField
            fullWidth
            type={showPassword ? "text" : "password"}
            label="New Password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            type="password"
            label="Confirm New Password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            error={passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== ""}
            helperText={passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== "" ? "Passwords do not match" : ""}
          />
        </DialogContent>
        <DialogActions sx={{ p: isMobile ? 2 : 3 }}>
          <Button onClick={() => setOpenPasswordDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleChangePassword} 
            variant="contained"
            disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword || passwordData.newPassword !== passwordData.confirmPassword}
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError("")}>
        <Alert onClose={() => setError("")} severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess("")}>
        <Alert onClose={() => setSuccess("")} severity="success" sx={{ width: "100%" }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
} 
