import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
  useMediaQuery,
  Container,
  AppBar,
  Toolbar,
  Drawer,
  ListItemIcon,
  ListItemButton,
  Fab
} from "@mui/material";
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  CheckCircle as CheckCircleIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Group as GroupIcon,
  Chat as ChatIcon,
  BarChart as BarChartIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  ArrowBack as ArrowBackIcon
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { getPayments, createPayment, markPaymentReceived, getUserBalances } from "../api/payments";
import { getGroups } from "../api/groups";

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newPayment, setNewPayment] = useState({
    amount: "",
    description: "",
    group_id: "",
    recipient_id: "",
    payment_method: "cash"
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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

  // Load data only when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsData, groupsData, balancesData] = await Promise.all([
        getPayments(),
        getGroups(),
        getUserBalances()
      ]);
      setPayments(paymentsData);
      setGroups(groupsData);
      setBalances(balancesData);
    } catch (err) {
      console.error("Failed to load data:", err);
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      setError("Failed to load data: " + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async () => {
    if (newPayment.amount && newPayment.recipient_id && newPayment.group_id) {
      try {
        await createPayment({
          amount: parseFloat(newPayment.amount),
          description: newPayment.description,
          group_id: parseInt(newPayment.group_id),
          recipient_id: parseInt(newPayment.recipient_id),
          payment_method: newPayment.payment_method
        });
        
        await loadData(); // Reload all data
        
        setNewPayment({
          amount: "",
          description: "",
          group_id: "",
          recipient_id: "",
          payment_method: "cash"
        });
        setOpenCreateDialog(false);
        setSuccess("Payment created successfully!");
      } catch (err) {
        setError("Failed to create payment: " + (err.response?.data?.msg || err.message));
      }
    }
  };

  const handleMarkReceived = async (paymentId) => {
    try {
      await markPaymentReceived(paymentId);
      await loadData(); // Reload data
      setSuccess("Payment marked as received!");
    } catch (err) {
      setError("Failed to mark payment: " + (err.response?.data?.msg || err.message));
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
          Payments
        </Typography>
        <Button
          color="inherit"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDialog(true)}
          sx={{ fontSize: '0.875rem' }}
        >
          Add
        </Button>
      </Toolbar>
    </AppBar>
  );

  const renderDesktopAppBar = () => (
    <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <PaymentIcon sx={{ mr: 2 }} />
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Payments & Balances
        </Typography>
        <Button
          color="inherit"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDialog(true)}
        >
          Record Payment
        </Button>
      </Toolbar>
    </AppBar>
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'cash': return '💵';
      case 'bank_transfer': return '🏦';
      case 'paypal': return '📱';
      case 'venmo': return '📱';
      default: return '💳';
    }
  };

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
              Please log in to view your payments
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
                Payments & Balances
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Track payments and manage group balances
              </Typography>
            </Box>
          )}

          {/* Quick Stats */}
          <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: 4 }}>
            <Grid item size={{ xs: 6, sm: 4, md: 3 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center', p: isMobile ? 2 : 3 }}>
                  <Typography variant={isMobile ? "h5" : "h6"} color="primary" sx={{ fontWeight: 600 }}>
                    {payments.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Payments
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item size={{ xs: 6, sm: 4, md: 3 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center', p: isMobile ? 2 : 3 }}>
                  <Typography variant={isMobile ? "h5" : "h6"} color="success.main" sx={{ fontWeight: 600 }}>
                    {payments.filter(p => p.status === 'completed').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item size={{ xs: 6, sm: 4, md: 3 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center', p: isMobile ? 2 : 3 }}>
                  <Typography variant={isMobile ? "h5" : "h6"} color="warning.main" sx={{ fontWeight: 600 }}>
                    {payments.filter(p => p.status === 'pending').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item size={{ xs: 6, sm: 4, md: 3 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center', p: isMobile ? 2 : 3 }}>
                  <Typography variant={isMobile ? "h5" : "h6"} color="primary" sx={{ fontWeight: 600 }}>
                    {balances.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Balances
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons={isMobile ? "auto" : false}
              allowScrollButtonsMobile
            >
              <Tab label="Payment History" />
              <Tab label="Group Balances" />
            </Tabs>
          </Box>

          {/* Tab Content */}
          {activeTab === 0 && (
            <Box>
              {/* Quick filter: All / Sent / Received */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip
                  label={`All (${payments.length})`}
                  color="primary"
                  variant="filled"
                />
                <Chip
                  label={`Sent (${payments.filter(p => p.sender_id === user?.id).length})`}
                  variant="outlined"
                />
                <Chip
                  label={`Received (${payments.filter(p => p.recipient_id === user?.id).length})`}
                  variant="outlined"
                />
              </Box>
              {payments.length === 0 ? (
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: isMobile ? 6 : 8 }}>
                    <PaymentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant={isMobile ? "h6" : "h5"} color="text.secondary" gutterBottom>
                      No payments yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, px: isMobile ? 2 : 0 }}>
                      Record your first payment to start tracking transactions.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setOpenCreateDialog(true)}
                      size={isMobile ? "large" : "medium"}
                    >
                      Record First Payment
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Grid container spacing={isMobile ? 2 : 3}>
                  {payments.map((payment) => (
                    <Grid key={payment.id} item size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                      <Card 
                        sx={{ 
                          height: '100%',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: theme.shadows[8],
                          }
                        }}
                      >
                        <CardContent sx={{ p: isMobile ? 2 : 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Typography 
                              variant={isMobile ? "h6" : "h5"} 
                              component="h2"
                              sx={{ fontWeight: 600, flex: 1, mr: 1 }}
                            >
                              {formatCurrency(payment.amount)}
                            </Typography>
                            <Chip
                              label={payment.status}
                              size={isMobile ? "small" : "medium"}
                              color={getStatusColor(payment.status)}
                            />
                          </Box>
                          
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mb: 1.5, 
                              lineHeight: 1.4,
                              fontSize: isMobile ? '0.875rem' : '1rem'
                            }}
                          >
                            {payment.description || "No description"}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Chip
                              size={isMobile ? 'small' : 'medium'}
                              icon={<PersonIcon />}
                              label={`Paid by ${payment.sender_name} → ${payment.recipient_name}`}
                              variant="outlined"
                            />
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="caption" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                {getPaymentMethodIcon(payment.payment_method)}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                              >
                                {payment.payment_method.replace('_', ' ')}
                              </Typography>
                            </Box>
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                            >
                              {new Date(payment.created_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                          
                          {payment.status === 'pending' && payment.recipient_id === user?.id && (
                            <Button
                              variant="outlined"
                              size={isMobile ? "small" : "medium"}
                              startIcon={<CheckCircleIcon />}
                              onClick={() => handleMarkReceived(payment.id)}
                              sx={{ mt: 2 }}
                              fullWidth
                            >
                              Mark Received
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              {balances.length === 0 ? (
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: isMobile ? 6 : 8 }}>
                    <AccountBalanceIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant={isMobile ? "h6" : "h5"} color="text.secondary" gutterBottom>
                      No balances yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, px: isMobile ? 2 : 0 }}>
                      Group balances will appear here once you have expenses and payments.
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                <Grid container spacing={isMobile ? 2 : 3}>
                  {balances.map((balance) => (
                    <Grid key={balance.id} item size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                      <Card 
                        sx={{ 
                          height: '100%',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: theme.shadows[8],
                          }
                        }}
                      >
                        <CardContent sx={{ p: isMobile ? 2 : 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <Typography 
                            variant={isMobile ? "h6" : "h5"} 
                            component="h2"
                            sx={{ fontWeight: 600, mb: 1 }}
                          >
                            {balance.group?.name || "Unknown Group"}
                          </Typography>
                          
                          <Typography 
                            variant="h6" 
                            color={balance.balance >= 0 ? "success.main" : "error.main"}
                            sx={{ 
                              fontWeight: 600, 
                              mb: 2,
                              fontSize: isMobile ? '1.1rem' : '1.25rem'
                            }}
                          >
                            {formatCurrency(Math.abs(balance.balance))}
                            <Typography 
                              component="span" 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ ml: 1, fontSize: isMobile ? '0.8rem' : '0.875rem' }}
                            >
                              {balance.balance >= 0 ? "owed to you" : "you owe"}
                            </Typography>
                          </Typography>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                            <Chip
                              label={balance.member_count || 0}
                              size={isMobile ? "small" : "medium"}
                              icon={<PersonIcon />}
                              variant="outlined"
                            />
                            <Button
                              variant="outlined"
                              size={isMobile ? "small" : "medium"}
                              onClick={() => navigate(`/groups/${balance.group_id}`)}
                            >
                              View Group
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {/* Floating Action Button for Mobile */}
          {isMobile && payments.length > 0 && (
            <Fab
              color="primary"
              aria-label="record payment"
              onClick={() => setOpenCreateDialog(true)}
              sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                zIndex: 1000
              }}
            >
              <AddIcon />
            </Fab>
          )}
        </Container>
      </Box>

      {/* Create Payment Dialog */}
      <Dialog 
        open={openCreateDialog} 
        onClose={() => setOpenCreateDialog(false)}
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
                onClick={() => setOpenCreateDialog(false)}
                aria-label="close"
                sx={{ mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
              Record Payment
            </Box>
          )}
          {!isMobile && "Record Payment"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Amount"
            type="number"
            fullWidth
            variant="outlined"
            value={newPayment.amount}
            onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
            sx={{ mb: 2, mt: isMobile ? 0 : 1 }}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
            }}
          />
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>Group</InputLabel>
            <Select
              value={newPayment.group_id}
              label="Group"
              onChange={(e) => setNewPayment({ ...newPayment, group_id: e.target.value })}
            >
              {groups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  {group.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>Recipient</InputLabel>
            <Select
              value={newPayment.recipient_id}
              label="Recipient"
              onChange={(e) => setNewPayment({ ...newPayment, recipient_id: e.target.value })}
            >
              {groups
                .find(g => g.id === parseInt(newPayment.group_id))
                ?.members?.map((member) => (
                  <MenuItem key={member.id} value={member.id}>
                    {member.username}
                  </MenuItem>
                )) || []}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={newPayment.payment_method}
              label="Payment Method"
              onChange={(e) => setNewPayment({ ...newPayment, payment_method: e.target.value })}
            >
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
              <MenuItem value="paypal">PayPal</MenuItem>
              <MenuItem value="venmo">Venmo</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            multiline
            rows={isMobile ? 3 : 4}
            variant="outlined"
            value={newPayment.description}
            onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ p: isMobile ? 2 : 3 }}>
          <Button onClick={() => setOpenCreateDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreatePayment} 
            variant="contained"
            disabled={!newPayment.amount || !newPayment.recipient_id || !newPayment.group_id}
          >
            Record Payment
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