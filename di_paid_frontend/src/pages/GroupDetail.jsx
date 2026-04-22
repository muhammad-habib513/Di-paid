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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Tabs,
  Tab,
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
  ListItemButton
} from "@mui/material";
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Group as GroupIcon,
  Chat as ChatIcon,
  BarChart as BarChartIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  ArrowBack as ArrowBackIcon
} from "@mui/icons-material";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getGroup, updateGroup, deleteGroup, addMember, removeMember } from "../api/groups";

export default function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openAddMemberDialog, setOpenAddMemberDialog] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    loadGroup();
  }, [groupId]);

  const loadGroup = async () => {
    try {
      setLoading(true);
      const data = await getGroup(groupId);
      setGroup(data);
      setEditForm({ name: data.name, description: data.description || "" });
    } catch (err) {
      setError("Failed to load group: " + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroup = async () => {
    try {
      await updateGroup(groupId, editForm);
      setGroup({ ...group, ...editForm });
      setOpenEditDialog(false);
      setSuccess("Group updated successfully!");
    } catch (err) {
      setError("Failed to update group: " + (err.response?.data?.msg || err.message));
    }
  };

  const handleDeleteGroup = async () => {
    if (window.confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      try {
        await deleteGroup(groupId);
        setSuccess("Group deleted successfully!");
        setTimeout(() => navigate("/groups"), 1000);
      } catch (err) {
        setError("Failed to delete group: " + (err.response?.data?.msg || err.message));
      }
    }
  };

  const handleAddMember = async () => {
    if (newMemberEmail.trim()) {
      try {
        // TODO: Implement add member by email
        setNewMemberEmail("");
        setOpenAddMemberDialog(false);
        setSuccess("Member added successfully!");
        loadGroup(); // Reload to get updated member list
      } catch (err) {
        setError("Failed to add member: " + (err.response?.data?.msg || err.message));
      }
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (window.confirm("Are you sure you want to remove this member?")) {
      try {
        await removeMember(groupId, memberId);
        setSuccess("Member removed successfully!");
        loadGroup(); // Reload to get updated member list
      } catch (err) {
        setError("Failed to remove member: " + (err.response?.data?.msg || err.message));
      }
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
          {group?.name || 'Group'}
        </Typography>
        <Button
          color="inherit"
          startIcon={<AddIcon />}
          onClick={() => setOpenAddMemberDialog(true)}
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
        <GroupIcon sx={{ mr: 2 }} />
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          {group?.name || 'Group Details'}
        </Typography>
        <Button
          color="inherit"
          startIcon={<AddIcon />}
          onClick={() => setOpenAddMemberDialog(true)}
        >
          Add Member
        </Button>
      </Toolbar>
    </AppBar>
  );

  const isAdmin = group?.members?.find(m => m.id === user?.id)?.role === 'admin';

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!group) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Group not found</Alert>
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
          {/* Header */}
          {!isMobile && (
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                  <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
                    {group.name}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    {group.description}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                  {isAdmin && (
                    <>
                      <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => setOpenEditDialog(true)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleDeleteGroup}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenAddMemberDialog(true)}
                  >
                    Add Member
                  </Button>
                </Box>
              </Box>
            </Box>
          )}

          {/* Quick Stats */}
          <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: 4 }}>
            <Grid item xs={6} sm={4} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center', p: isMobile ? 2 : 3 }}>
                  <Typography variant={isMobile ? "h5" : "h6"} color="primary" sx={{ fontWeight: 600 }}>
                    {group.members?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Members
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center', p: isMobile ? 2 : 3 }}>
                  <Typography variant={isMobile ? "h5" : "h6"} color="primary" sx={{ fontWeight: 600 }}>
                    0
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Expenses
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center', p: isMobile ? 2 : 3 }}>
                  <Typography variant={isMobile ? "h5" : "h6"} color="primary" sx={{ fontWeight: 600 }}>
                    $0
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Spent
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center', p: isMobile ? 2 : 3 }}>
                  <Typography variant={isMobile ? "h5" : "h6"} color="primary" sx={{ fontWeight: 600 }}>
                    0
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
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
              <Tab label="Members" />
              <Tab label="Expenses" />
              <Tab label="Payments" />
              <Tab label="Activity" />
            </Tabs>
          </Box>

          {/* Tab Content */}
          {activeTab === 0 && (
            <Card>
              <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 600 }}>
                    Group Members
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenAddMemberDialog(true)}
                    size={isMobile ? "small" : "medium"}
                  >
                    Add Member
                  </Button>
                </Box>
                
                {group.members && group.members.length > 0 ? (
                  <List>
                    {group.members.map((member) => (
                      <ListItem key={member.id} sx={{ px: 0 }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {member.username?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <ListItemText
                          primary={member.username}
                          secondary={member.email}
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
                              label={member.role}
                              size={isMobile ? "small" : "medium"}
                              color={member.role === 'admin' ? 'primary' : 'default'}
                              variant="outlined"
                            />
                            {isAdmin && member.id !== user?.id && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveMember(member.id)}
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
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No members yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Add members to start splitting bills together
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setOpenAddMemberDialog(true)}
                    >
                      Add First Member
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 1 && (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <ReceiptIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No expenses yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Start adding expenses to track group spending
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />}>
                  Add Expense
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 2 && (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <PaymentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No payments yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Record payments between group members
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />}>
                  Record Payment
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 3 && (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No activity yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Group activity will appear here
                </Typography>
              </CardContent>
            </Card>
          )}
        </Container>
      </Box>

      {/* Edit Group Dialog */}
      <Dialog 
        open={openEditDialog} 
        onClose={() => setOpenEditDialog(false)}
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
                onClick={() => setOpenEditDialog(false)}
                aria-label="close"
                sx={{ mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
              Edit Group
            </Box>
          )}
          {!isMobile && "Edit Group"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Group Name"
            fullWidth
            variant="outlined"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            sx={{ mb: 2, mt: isMobile ? 0 : 1 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={isMobile ? 3 : 4}
            variant="outlined"
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ p: isMobile ? 2 : 3 }}>
          <Button onClick={() => setOpenEditDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateGroup} 
            variant="contained"
            disabled={!editForm.name.trim()}
          >
            Update Group
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog 
        open={openAddMemberDialog} 
        onClose={() => setOpenAddMemberDialog(false)}
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
                onClick={() => setOpenAddMemberDialog(false)}
                aria-label="close"
                sx={{ mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
              Add Member
            </Box>
          )}
          {!isMobile && "Add Member"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
            sx={{ mb: 2, mt: isMobile ? 0 : 1 }}
            placeholder="Enter member's email address"
          />
          <Typography variant="body2" color="text.secondary">
            The user will receive an invitation to join this group.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: isMobile ? 2 : 3 }}>
          <Button onClick={() => setOpenAddMemberDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddMember} 
            variant="contained"
            disabled={!newMemberEmail.trim()}
          >
            Send Invitation
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