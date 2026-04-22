import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
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
  Avatar,
  AvatarGroup,
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
  Edit as EditIcon,
  Receipt as ReceiptIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Payment as PaymentIcon,
  Chat as ChatIcon,
  BarChart as BarChartIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  ArrowBack as ArrowBackIcon
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { getExpenses, createExpense, deleteExpense, settleExpense } from "../api/expenses";
import { getGroups } from "../api/groups";

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openExpenseDialog, setOpenExpenseDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [newExpense, setNewExpense] = useState({
    title: "",
    amount: "",
    description: "",
    group_id: "",
    split_type: "equal",
    currency: "USD",
    split_data: {}
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

  const currencyOptions = [
    { code: 'USD', symbol: '$' },
    { code: 'EUR', symbol: '€' },
    { code: 'GBP', symbol: '£' },
    { code: 'PKR', symbol: '₨' },
    { code: 'INR', symbol: '₹' },
    { code: 'AED', symbol: 'د.إ' }
  ];

  // Load expenses only when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadExpenses();
      loadGroups();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await getExpenses();
      setExpenses(data);
    } catch (err) {
      console.error("Failed to load expenses:", err);
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      setError("Failed to load expenses: " + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const data = await getGroups();
      setGroups(data);
    } catch (err) {
      console.error("Failed to load groups:", err);
    }
  };

  const loadGroupMembers = async (groupId) => {
    try {
      const group = groups.find(g => g.id === parseInt(groupId));
      if (group && group.members) {
        setGroupMembers(group.members);
      }
    } catch (err) {
      console.error("Failed to load group members:", err);
    }
  };

  const handleCreateExpense = async () => {
    if (newExpense.title && newExpense.amount && newExpense.group_id) {
      try {
        const createdExpense = await createExpense({
          title: newExpense.title,
          amount: parseFloat(newExpense.amount),
          description: newExpense.description,
          group_id: parseInt(newExpense.group_id),
          split_type: newExpense.split_type,
          currency: newExpense.currency,
          split_data: newExpense.split_data
        });
        
        // Reload expenses to get the updated list with shares
        await loadExpenses();
        
        setNewExpense({
          title: "",
          amount: "",
          description: "",
          group_id: "",
          split_type: "equal",
          currency: "USD",
          split_data: {}
        });
        setOpenCreateDialog(false);
        setSuccess("Expense created successfully!");
      } catch (err) {
        setError("Failed to create expense: " + (err.response?.data?.msg || err.message));
      }
    }
  };

  const handleViewExpense = (expense) => {
    setSelectedExpense(expense);
    setOpenExpenseDialog(true);
  };

  const handleDeleteExpense = async (expenseId) => {
    try {
      await deleteExpense(expenseId);
      setExpenses(expenses.filter(e => e.id !== expenseId));
      setSuccess("Expense deleted successfully!");
    } catch (err) {
      setError("Failed to delete expense: " + (err.response?.data?.msg || err.message));
    }
  };

  const handleSettleExpense = async (shareId) => {
    try {
      await settleExpense(selectedExpense.id, { share_id: shareId });
      setSuccess("Payment recorded successfully!");
      // Reload the selected expense to get updated share status
      const updatedExpense = await getExpense(selectedExpense.id);
      setSelectedExpense(updatedExpense);
      // Also reload the expenses list
      await loadExpenses();
    } catch (err) {
      setError("Failed to record payment: " + (err.response?.data?.msg || err.message));
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

  const handleGroupChange = (groupId) => {
    setNewExpense({ ...newExpense, group_id: groupId, split_data: {} });
    loadGroupMembers(groupId);
  };

  const handleSplitTypeChange = (splitType) => {
    setNewExpense({ ...newExpense, split_type: splitType, split_data: {} });
  };

  const handleSplitDataChange = (userId, value) => {
    const newSplitData = { ...newExpense.split_data };
    newSplitData[userId] = parseFloat(value) || 0;
    setNewExpense({ ...newExpense, split_data: newSplitData });
  };

  const calculateTotalSplit = () => {
    if (newExpense.split_type === 'percentage') {
      return Object.values(newExpense.split_data).reduce((sum, val) => sum + (val || 0), 0);
    } else if (newExpense.split_type === 'custom') {
      return Object.values(newExpense.split_data).reduce((sum, val) => sum + (val || 0), 0);
    }
    return 0;
  };

  const isSplitValid = () => {
    if (newExpense.split_type === 'equal') return true;
    if (newExpense.split_type === 'percentage') {
      return Math.abs(calculateTotalSplit() - 100) < 0.01;
    }
    if (newExpense.split_type === 'custom') {
      return Math.abs(calculateTotalSplit() - parseFloat(newExpense.amount || 0)) < 0.01;
    }
    return false;
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
          Expenses
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
        <ReceiptIcon sx={{ mr: 2 }} />
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          My Expenses
        </Typography>
        <Button
          color="inherit"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDialog(true)}
        >
          Add Expense
        </Button>
      </Toolbar>
    </AppBar>
  );

  const formatCurrency = (amount, currencyCode = 'USD') => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode }).format(amount);
    } catch {
      return `${currencyCode} ${Number(amount).toFixed(2)}`;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      default: return 'default';
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
              Please log in to view your expenses
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
                My Expenses
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Track and manage your shared expenses
              </Typography>
            </Box>
          )}

          {expenses.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: isMobile ? 6 : 8 }}>
                <ReceiptIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant={isMobile ? "h6" : "h5"} color="text.secondary" gutterBottom>
                  No expenses yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, px: isMobile ? 2 : 0 }}>
                  Create your first expense to start tracking shared costs with your groups.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCreateDialog(true)}
                  size={isMobile ? "large" : "medium"}
                >
                  Create Your First Expense
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)'
              },
              gap: isMobile ? 2 : 3
            }}>
              {expenses.map((expense) => (
                <Box key={expense.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[8],
                      }
                    }}
                    onClick={() => handleViewExpense(expense)}
                  >
                    <CardContent sx={{ p: isMobile ? 2 : 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography 
                          variant={isMobile ? "h6" : "h5"} 
                          component="h2"
                          sx={{ fontWeight: 600, flex: 1, mr: 1 }}
                        >
                          {expense.title}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteExpense(expense.id);
                          }}
                          color="error"
                          sx={{ flexShrink: 0 }}
                        >
                          <DeleteIcon fontSize={isMobile ? "small" : "medium"} />
                        </IconButton>
                      </Box>
                      
                      <Typography 
                        variant="h6" 
                        color="primary" 
                        sx={{ 
                          fontWeight: 600, 
                          mb: 1,
                          fontSize: isMobile ? '1.1rem' : '1.25rem'
                        }}
                      >
                        {formatCurrency(expense.amount, expense.currency || 'USD')}
                      </Typography>
                      
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: 2, 
                          flex: 1,
                          lineHeight: 1.4,
                          fontSize: isMobile ? '0.875rem' : '1rem'
                        }}
                      >
                        {expense.description || "No description"}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                        <Chip
                          label={expense.group?.name || expense.group_name || "Unknown Group"}
                          size={isMobile ? "small" : "medium"}
                          icon={<GroupIcon />}
                          variant="outlined"
                        />
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                        >
                          {new Date(expense.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          )}

          {/* Floating Action Button for Mobile */}
          {isMobile && expenses.length > 0 && (
            <Fab
              color="primary"
              aria-label="add expense"
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

      {/* Create Expense Dialog */}
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
              Create New Expense
            </Box>
          )}
          {!isMobile && "Create New Expense"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Expense Title"
            fullWidth
            variant="outlined"
            value={newExpense.title}
            onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
            sx={{ mb: 2, mt: isMobile ? 0 : 1 }}
          />
          <TextField
            margin="dense"
            label="Amount"
            type="number"
            fullWidth
            variant="outlined"
            value={newExpense.amount}
            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>Currency</InputLabel>
            <Select
              value={newExpense.currency}
              label="Currency"
              onChange={(e) => setNewExpense({ ...newExpense, currency: e.target.value })}
            >
              {currencyOptions.map((c) => (
                <MenuItem key={c.code} value={c.code}>
                  {c.code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>Group</InputLabel>
            <Select
              value={newExpense.group_id}
              label="Group"
              onChange={(e) => handleGroupChange(e.target.value)}
            >
              {groups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  {group.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>Split Type</InputLabel>
            <Select
              value={newExpense.split_type}
              label="Split Type"
              onChange={(e) => handleSplitTypeChange(e.target.value)}
            >
              <MenuItem value="equal">Equal Split</MenuItem>
              <MenuItem value="percentage">Percentage</MenuItem>
              <MenuItem value="custom">Custom Amounts</MenuItem>
            </Select>
          </FormControl>
          
          {/* Split Configuration */}
          {newExpense.split_type !== 'equal' && newExpense.group_id && groupMembers.length > 0 && (
            <Box sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {newExpense.split_type === 'percentage' ? 'Percentage Split' : 'Custom Amount Split'}
              </Typography>
              {groupMembers.map((member) => (
                <Box key={member.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography sx={{ minWidth: 120, mr: 2 }}>
                    {member.username}
                  </Typography>
                  <TextField
                    size="small"
                    type="number"
                    value={newExpense.split_data[member.id] || ''}
                    onChange={(e) => handleSplitDataChange(member.id, e.target.value)}
                    label={newExpense.split_type === 'percentage' ? 'Percentage' : 'Amount'}
                    sx={{ width: 120, mr: 1 }}
                    inputProps={{ 
                      min: 0, 
                      max: newExpense.split_type === 'percentage' ? 100 : newExpense.amount,
                      step: newExpense.split_type === 'percentage' ? 0.1 : 0.01
                    }}
                  />
                  {newExpense.split_type === 'percentage' && (
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      %
                    </Typography>
                  )}
                  {newExpense.split_type === 'custom' && (
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      {newExpense.currency}
                    </Typography>
                  )}
                </Box>
              ))}
              <Typography 
                variant="body2" 
                color={isSplitValid() ? 'success.main' : 'error.main'}
                sx={{ mt: 1, fontWeight: 600 }}
              >
                Total: {calculateTotalSplit()}{newExpense.split_type === 'percentage' ? '%' : ` ${newExpense.currency}`}
                {newExpense.split_type === 'percentage' && ' (must equal 100%)'}
                {newExpense.split_type === 'custom' && ` (must equal ${newExpense.amount} ${newExpense.currency})`}
              </Typography>
            </Box>
          )}
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            multiline
            rows={isMobile ? 3 : 4}
            variant="outlined"
            value={newExpense.description}
            onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ p: isMobile ? 2 : 3 }}>
          <Button onClick={() => setOpenCreateDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateExpense} 
            variant="contained"
            disabled={!newExpense.title || !newExpense.amount || !newExpense.group_id || !isSplitValid()}
          >
            Create Expense
          </Button>
        </DialogActions>
      </Dialog>

      {/* Expense Detail Dialog */}
      <Dialog 
        open={openExpenseDialog} 
        onClose={() => setOpenExpenseDialog(false)}
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
                onClick={() => setOpenExpenseDialog(false)}
                aria-label="close"
                sx={{ mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
              {selectedExpense?.title}
            </Box>
          )}
          {!isMobile && selectedExpense?.title}
        </DialogTitle>
        <DialogContent>
          {selectedExpense && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" color="primary" sx={{ fontWeight: 600, mb: 1 }}>
                  {formatCurrency(selectedExpense.amount, selectedExpense.currency || 'USD')}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {selectedExpense.description || "No description"}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={selectedExpense.group?.name || selectedExpense.group_name}
                    icon={<GroupIcon />}
                    variant="outlined"
                  />
                  <Chip
                    label={selectedExpense.split_type}
                    variant="outlined"
                  />
                  <Chip
                    label={selectedExpense.currency || 'USD'}
                    variant="outlined"
                  />
                </Box>
              </Box>
              
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Expense Shares
              </Typography>
              
              {selectedExpense.shares && selectedExpense.shares.length > 0 ? (
                <List>
                  {selectedExpense.shares.map((share) => (
                    <ListItem key={share.id} sx={{ px: 0 }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {share.user?.username?.charAt(0)?.toUpperCase()}
                      </Avatar>
                      <ListItemText
                        primary={share.user?.username}
                        secondary={`${formatCurrency(share.amount, selectedExpense.currency || 'USD')} - ${share.status}`}
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
                            label={share.status}
                            size={isMobile ? "small" : "medium"}
                            color={getStatusColor(share.status)}
                          />
                          {share.status === 'pending' && share.user?.id !== user?.id && (
                            <Button
                              variant="outlined"
                              size={isMobile ? "small" : "medium"}
                              onClick={() => handleSettleExpense(share.id)}
                            >
                              Mark Paid
                            </Button>
                          )}
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No shares found
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: isMobile ? 2 : 3 }}>
          <Button onClick={() => setOpenExpenseDialog(false)}>
            Close
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
