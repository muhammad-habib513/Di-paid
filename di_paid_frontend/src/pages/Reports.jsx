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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Container,
  AppBar,
  Toolbar,
  Drawer,
  ListItemIcon,
  ListItemButton,
  ListItem,
  ListItemText,
  Divider,
  List
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
  PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  getSpendingOverview,
  getMonthlySpendingTrends,
  getGroupSpendingBreakdown,
  getPaymentHistory,
  getExpenseCategories,
  getUserActivitySummary,
  getSettlementRecommendations,
  exportReport
} from "../api/reports";

// Simple chart components (in a real app, you'd use recharts or chart.js)
const SimpleBarChart = ({ data, title, color = "primary" }) => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mb: 3 }}>
      {title}
    </Typography>
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'end', 
      gap: 2, 
      height: 250, 
      mt: 2,
      p: 2,
      backgroundColor: 'background.default',
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'divider'
    }}>
      {data.map((item, index) => (
        <Box key={index} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box
            sx={{
              width: '85%',
              height: `${Math.max((item.value / Math.max(...data.map(d => d.value))) * 180, 20)}px`,
              backgroundColor: `${color}.main`,
              borderRadius: '8px 8px 0 0',
              mb: 2,
              boxShadow: 2,
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: `${color}.dark`,
                transform: 'scale(1.05)'
              }
            }}
          />
          <Typography variant="body2" sx={{ 
            textAlign: 'center', 
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'text.primary'
          }}>
            {item.label}
          </Typography>
          <Typography variant="caption" sx={{ 
            textAlign: 'center', 
            fontSize: '0.7rem',
            color: 'text.secondary',
            mt: 0.5
          }}>
            {item.value}
          </Typography>
        </Box>
      ))}
    </Box>
  </Box>
);

const SimplePieChart = ({ data, title, currencyCode = 'USD' }) => {
  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat(undefined, { 
        style: 'currency', 
        currency: currencyCode 
      }).format(amount);
    } catch {
      return `${currencyCode} ${Number(amount).toFixed(2)}`;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mb: 3 }}>
        {title}
      </Typography>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 2, 
        mt: 2,
        p: 2,
        backgroundColor: 'background.default',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}>
        {data.map((item, index) => (
          <Box key={index} sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            p: 2,
            backgroundColor: 'background.paper',
            borderRadius: 1,
            boxShadow: 1,
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: 3,
              transform: 'translateX(4px)'
            }
          }}>
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: item.color || `hsl(${index * 60}, 70%, 50%)`,
                boxShadow: 2,
                border: '2px solid white'
              }}
            />
            <Typography variant="body1" sx={{ flex: 1, fontWeight: 500 }}>
              {item.label}
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="primary">
              {formatCurrency(item.value)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default function Reports() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timeRange, setTimeRange] = useState('6');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [spendingOverview, setSpendingOverview] = useState({});
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [groupBreakdown, setGroupBreakdown] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [userActivity, setUserActivity] = useState({});
  const [settlementRecommendations, setSettlementRecommendations] = useState([]);
  const [balances, setBalances] = useState([]);
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

  useEffect(() => {
    if (isAuthenticated && user) {
      loadReports();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user, timeRange]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [
        overviewData,
        trendsData,
        breakdownData,
        historyData,
        categoriesData,
        activityData,
        recommendationsData,
        balancesData
      ] = await Promise.all([
        getSpendingOverview(),
        getMonthlySpendingTrends(parseInt(timeRange)),
        getGroupSpendingBreakdown(),
        getPaymentHistory({ months: timeRange }),
        getExpenseCategories(),
        getUserActivitySummary(),
        getSettlementRecommendations(),
        (async () => {
          try {
            const { getUserBalances } = await import('../api/payments');
            return await getUserBalances();
          } catch {
            return [];
          }
        })()
      ]);

      setSpendingOverview(overviewData);
      setMonthlyTrends(trendsData);
      setGroupBreakdown(breakdownData);
      setPaymentHistory(historyData);
      setExpenseCategories(categoriesData);
      setUserActivity(activityData);
      setSettlementRecommendations(recommendationsData);
      setBalances(balancesData);
    } catch (err) {
      console.error("Failed to load reports:", err);
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      setError("Failed to load reports: " + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (reportType, format = 'json') => {
    try {
      const blob = await exportReport(reportType, format, { months: timeRange });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report.${format === 'csv' ? 'csv' : 'json'}`;
      a.click();
      window.URL.revokeObjectURL(url);
      setSuccess(`Report exported successfully as ${format.toUpperCase()}`);
    } catch (err) {
      setError("Failed to export report: " + (err.response?.data?.msg || err.message));
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
          Reports
        </Typography>
        <IconButton
          color="inherit"
          onClick={loadReports}
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
        <BarChartIcon sx={{ mr: 2 }} />
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Reports & Analytics
        </Typography>
        <IconButton
          color="inherit"
          onClick={loadReports}
          disabled={loading}
        >
          <RefreshIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );

  const formatCurrency = (amount, currencyCode = selectedCurrency) => {
    try {
      return new Intl.NumberFormat(undefined, { 
        style: 'currency', 
        currency: currencyCode 
      }).format(amount);
    } catch {
      const currency = currencyOptions.find(c => c.code === currencyCode);
      return `${currency?.symbol || '$'} ${Number(amount).toFixed(2)}`;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
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
              Please log in to view reports
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
                Reports & Analytics
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Comprehensive insights into your spending patterns and group activities
              </Typography>
            </Box>
          )}

          {/* Time Range and Currency Filters */}
          <Card sx={{ mb: 3, p: 2, backgroundColor: 'background.paper', boxShadow: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <FormControl size={isMobile ? "small" : "medium"} sx={{ minWidth: isMobile ? 140 : 160 }}>
                  <InputLabel sx={{ color: 'text.primary', fontWeight: 500 }}>Time Range</InputLabel>
                  <Select
                    value={timeRange}
                    label="Time Range"
                    onChange={(e) => setTimeRange(e.target.value)}
                    sx={{ 
                      backgroundColor: 'background.default',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                        borderWidth: 2
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.dark'
                      }
                    }}
                  >
                    <MenuItem value="3">Last 3 months</MenuItem>
                    <MenuItem value="6">Last 6 months</MenuItem>
                    <MenuItem value="12">Last 12 months</MenuItem>
                    <MenuItem value="24">Last 2 years</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl size={isMobile ? "small" : "medium"} sx={{ minWidth: isMobile ? 120 : 140 }}>
                  <InputLabel sx={{ color: 'text.primary', fontWeight: 500 }}>Currency</InputLabel>
                  <Select
                    value={selectedCurrency}
                    label="Currency"
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    sx={{ 
                      backgroundColor: 'background.default',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                        borderWidth: 2
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.dark'
                      }
                    }}
                  >
                    {currencyOptions.map((currency) => (
                      <MenuItem key={currency.code} value={currency.code}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontWeight: 600 }}>{currency.symbol}</Typography>
                          <Typography>{currency.code}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleExport('spending', 'csv')}
                size={isMobile ? "small" : "medium"}
              >
                Export CSV
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleExport('spending', 'json')}
                size={isMobile ? "small" : "medium"}
              >
                Export JSON
              </Button>
            </Box>
          </Box>
          </Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons={isMobile ? "auto" : false}
              allowScrollButtonsMobile
            >
              <Tab label="Overview" />
              <Tab label="Spending Trends" />
              <Tab label="Group Breakdown" />
              <Tab label="Categories" />
              <Tab label="Activity" />
              <Tab label="Settlements" />
            </Tabs>
          </Box>

          {/* Tab Content */}
          {activeTab === 0 && (
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)'
              },
              gap: isMobile ? 2 : 3
            }}>
              <Card sx={{ 
                boxShadow: 3, 
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}>
                <CardContent sx={{ 
                  textAlign: 'center', 
                  p: isMobile ? 2 : 3,
                  backgroundColor: 'primary.light',
                  background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'
                }}>
                  <ReceiptIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant={isMobile ? "h5" : "h4"} color="primary" sx={{ fontWeight: 700, mb: 1 }}>
                    {formatCurrency(spendingOverview.total_spent || 0)}
                  </Typography>
                  <Typography variant="body1" color="text.primary" sx={{ fontWeight: 600 }}>
                    Total Spent
                  </Typography>
                </CardContent>
              </Card>
              
              <Card sx={{ 
                boxShadow: 3, 
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}>
                <CardContent sx={{ 
                  textAlign: 'center', 
                  p: isMobile ? 2 : 3,
                  backgroundColor: 'success.light',
                  background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)'
                }}>
                  <PaymentIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                  <Typography variant={isMobile ? "h5" : "h4"} color="success.main" sx={{ fontWeight: 700, mb: 1 }}>
                    {formatCurrency(spendingOverview.total_paid || 0)}
                  </Typography>
                  <Typography variant="body1" color="text.primary" sx={{ fontWeight: 600 }}>
                    Total Paid
                  </Typography>
                </CardContent>
              </Card>
              
              <Card sx={{ 
                boxShadow: 3, 
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}>
                <CardContent sx={{ 
                  textAlign: 'center', 
                  p: isMobile ? 2 : 3,
                  backgroundColor: 'warning.light',
                  background: 'linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%)'
                }}>
                  <ReceiptIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                  <Typography variant={isMobile ? "h5" : "h4"} color="warning.main" sx={{ fontWeight: 700, mb: 1 }}>
                    {formatCurrency(spendingOverview.outstanding_balance || 0)}
                  </Typography>
                  <Typography variant="body1" color="text.primary" sx={{ fontWeight: 600 }}>
                    Outstanding
                  </Typography>
                </CardContent>
              </Card>
              
              <Card sx={{ 
                boxShadow: 3, 
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}>
                <CardContent sx={{ 
                  textAlign: 'center', 
                  p: isMobile ? 2 : 3,
                  backgroundColor: 'info.light',
                  background: 'linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%)'
                }}>
                  <BarChartIcon sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
                  <Typography variant={isMobile ? "h5" : "h4"} color="info.main" sx={{ fontWeight: 700, mb: 1 }}>
                    {spendingOverview.active_groups || 0}
                  </Typography>
                  <Typography variant="body1" color="text.primary" sx={{ fontWeight: 600 }}>
                    Active Groups
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}

          {activeTab === 1 && (
            <Card sx={{ boxShadow: 4, borderRadius: 2 }}>
              <CardContent sx={{ p: 0 }}>
                <SimpleBarChart 
                  data={monthlyTrends} 
                  title="Monthly Spending Trends" 
                  color="primary"
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 2 && (
            <Card sx={{ boxShadow: 4, borderRadius: 2 }}>
              <CardContent sx={{ p: 0 }}>
                <SimplePieChart 
                  data={groupBreakdown} 
                  title="Spending by Group"
                  currencyCode={selectedCurrency}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 3 && (
            <Card sx={{ boxShadow: 4, borderRadius: 2 }}>
              <CardContent sx={{ p: 0 }}>
                <SimplePieChart 
                  data={expenseCategories} 
                  title="Spending by Category"
                  currencyCode={selectedCurrency}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 4 && (
            <Grid container spacing={isMobile ? 2 : 3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Recent Activity</Typography>
                    <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                      {userActivity.recent_activities?.map((activity, index) => (
                        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: '1px solid #eee' }}>
                          <Typography variant="body2">{activity.description}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(activity.date)}
                          </Typography>
                        </Box>
                      )) || (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                          No recent activity
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Activity Summary</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Total Expenses</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {userActivity.total_expenses || 0}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Total Payments</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {userActivity.total_payments || 0}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Groups Joined</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {userActivity.groups_joined || 0}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {activeTab === 5 && (
            <Grid container spacing={isMobile ? 2 : 3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Per-Group Balances</Typography>
                    {balances.length > 0 ? (
                      <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                        <Table size={isMobile ? "small" : "medium"}>
                          <TableHead>
                            <TableRow>
                              <TableCell>Group</TableCell>
                              <TableCell align="right">Balance</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {balances.map((b, index) => (
                              <TableRow key={index}>
                                <TableCell>{b.group_name}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: b.balance >= 0 ? 'success.main' : 'error.main' }}>
                                  {formatCurrency(b.balance)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                        No balances available
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Settlement Recommendations</Typography>
                    {settlementRecommendations.length > 0 ? (
                      <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                        <Table size={isMobile ? "small" : "medium"}>
                          <TableHead>
                            <TableRow>
                              <TableCell>Group</TableCell>
                              <TableCell>Action</TableCell>
                              <TableCell>Amount</TableCell>
                              <TableCell>Priority</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {settlementRecommendations.map((rec, index) => (
                              <TableRow key={index}>
                                <TableCell>{rec.group_name}</TableCell>
                                <TableCell>{rec.action}</TableCell>
                                <TableCell>{formatCurrency(rec.amount)}</TableCell>
                                <TableCell>
                                  <Chip 
                                    label={rec.priority} 
                                    size="small" 
                                    color={rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'success'}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                        No settlement recommendations at this time
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Container>
      </Box>

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
