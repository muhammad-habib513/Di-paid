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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Fab,
  CircularProgress,
  Alert,
  Snackbar,
  useTheme,
  useMediaQuery,
  Container,
  AppBar,
  Toolbar,
  Drawer,
  ListItemIcon,
  ListItemButton,
  Divider
} from "@mui/material";
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon,
  Group as GroupIcon,
  People as PeopleIcon,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  Chat as ChatIcon,
  BarChart as BarChartIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  ArrowBack as ArrowBackIcon
} from "@mui/icons-material";
import Autocomplete from "@mui/material/Autocomplete";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { getGroups, createGroup, deleteGroup, getUsers, addMember } from "../api/groups";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openMembersDialog, setOpenMembersDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newGroup, setNewGroup] = useState({ name: "", description: "" });
  const [selectedMembers, setSelectedMembers] = useState([]); // array of user objects
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

  // Load groups only when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadGroups();
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await getGroups();
      setGroups(data);
    } catch (err) {
      console.error("Failed to load groups:", err);
      if (err.response?.status === 400) {
        navigate("/login");
        return;
      }
      setError("Failed to load groups: " + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  const handleCreateGroup = async () => {
    if (newGroup.name.trim()) {
      try {
        const createdGroup = await createGroup(newGroup);
        // Add selected members (excluding self if selected)
        const membersToAdd = selectedMembers
          .filter(u => u?.id && u.id !== user?.id)
          .map(u => u.id);
        if (membersToAdd.length > 0) {
          await Promise.all(membersToAdd.map(uid => addMember(createdGroup.id, uid)));
        }
        // Refresh groups to reflect new members
        await loadGroups();
        // Reset form
        setNewGroup({ name: "", description: "" });
        setSelectedMembers([]);
        setOpenCreateDialog(false);
        setSuccess("Group created successfully!");
      } catch (err) {
        setError("Failed to create group: " + (err.response?.data?.msg || err.message));
      }
    }
  };

  const handleViewGroup = (group) => {
    navigate(`/groups/${group.id}`);
  };

  const handleViewMembers = (group) => {
    setSelectedGroup(group);
    setOpenMembersDialog(true);
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await deleteGroup(groupId);
      setGroups(groups.filter(g => g.id !== groupId));
      setSuccess("Group deleted successfully!");
    } catch (err) {
      setError("Failed to delete group: " + (err.response?.data?.msg || err.message));
    }
  };

  const handleEditGroup = (group) => {
    // TODO: Implement edit group functionality
    console.log("Edit group:", group);
    // You can add a dialog for editing group details here
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
        width: 279,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 279,
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
          sx={{ mr: 1 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h5" noWrap component="div" sx={{ flexGrow: 1 }}>
          Groups
        </Typography>
        <Button
          color="inherit"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDialog(true)}
          sx={{ fontSize: '0.875rem' }}
        >
          Create
        </Button>
      </Toolbar>
    </AppBar>
  );

  const renderDesktopAppBar = () => (
    <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <GroupIcon sx={{ mr: 1 }} />
        <Typography variant="h5" noWrap component="div" sx={{ flexGrow: 1 }}>
          My Groups
        </Typography>
        <Button
          color="inherit"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDialog(true)}
        >
          Create Group
        </Button>
      </Toolbar>
    </AppBar>
  );

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
      <Box sx={{ p: 2 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              Please log in to view your groups
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/login")}
              sx={{ mt: 1 }}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '99vh' }}>
      {isMobile ? renderMobileAppBar() : renderDesktopAppBar()}
      {renderNavigationDrawer()}
      
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 0, 
          width: isMobile ? '99%' : 'calc(100% - 280px)',
          ml: isMobile ? -1 : '280px'
        }}
      >
        <Container maxWidth="xl" sx={{ mt: isMobile ? 7 : 9, mb: 3 }}>
          {!isMobile && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
                My Groups
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage your bill splitting groups and invite friends
              </Typography>
            </Box>
          )}

          {groups.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: isMobile ? 5 : 8 }}>
                <GroupIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant={isMobile ? "h5" : "h5"} color="text.secondary" gutterBottom>
                  No groups yet
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, px: isMobile ? 2 : 0 }}>
                  Create your first group to start splitting bills with friends and family.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCreateDialog(true)}
                  size={isMobile ? "large" : "medium"}
                >
                  Create Your First Group
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
              gap: isMobile ? 1 : 3
            }}>
              {groups.map((group) => (
                <Box key={group.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: theme.shadows[7],
                      }
                    }}
                    onClick={() => handleViewGroup(group)}
                  >
                    <CardContent sx={{ p: isMobile ? 1 : 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography 
                          variant={isMobile ? "h5" : "h5"} 
                          component="h1"
                          sx={{ fontWeight: 600, flex: 1, mr: 1 }}
                        >
                          {group.name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(group.id);
                          }}
                          color="error"
                          sx={{ flexShrink: 0 }}
                        >
                          <DeleteIcon fontSize={isMobile ? "small" : "medium"} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditGroup(group);
                          }}
                          color="primary"
                          sx={{ flexShrink: 0 }}
                        >
                          <EditIcon fontSize={isMobile ? "small" : "medium"} />
                        </IconButton>
                      </Box>
                      
                      <Typography 
                        variant="body1" 
                        color="text.secondary" 
                        sx={{ 
                          mb: 1, 
                          flex: 0,
                          lineHeight: 1.4,
                          fontSize: isMobile ? '0.875rem' : '1rem'
                        }}
                      >
                        {group.description || "No description"}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                        <Chip
                          label={`${group.member_count || (group.members?.length || 0)} members`}
                          size={isMobile ? "small" : "medium"}
                          icon={<PeopleIcon />}
                          variant="outlined"
                        />
                        <Button
                          variant="outlined"
                          size={isMobile ? "small" : "medium"}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewMembers(group);
                          }}
                          sx={{ ml: 1 }}
                        >
                          Members
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          )}

          {/* Floating Action Button for Mobile */}
          {isMobile && groups.length > 0 && (
            <Fab
              color="primary"
              aria-label="add group"
              onClick={() => setOpenCreateDialog(true)}
              sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                zIndex: 999
              }}
            >
              <AddIcon />
            </Fab>
          )}
        </Container>
      </Box>

      {/* Create Group Dialog */}
      <Dialog 
        open={openCreateDialog} 
        onClose={() => setOpenCreateDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          {isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0 }}>
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => setOpenCreateDialog(false)}
                aria-label="close"
                sx={{ mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
              Create New Group
            </Box>
          )}
          {!isMobile && "Create New Group"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Group Name"
            fullWidth
            variant="outlined"
            value={newGroup.name}
            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
            sx={{ mb: 1, mt: isMobile ? 0 : 1 }}
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            multiline
            rows={isMobile ? 2 : 4}
            variant="outlined"
            value={newGroup.description}
            onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Autocomplete
            multiple
            options={(users || []).filter(u => u.id !== user?.id)}
            getOptionLabel={(option) => option?.username ? `${option.username} (${option.email})` : ''}
            value={selectedMembers}
            onChange={(event, value) => setSelectedMembers(value)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip label={option.username} {...getTagProps({ index })} key={option.id} />
              ))
            }
            renderInput={(params) => (
              <TextField {...params} label="Add members (optional)" placeholder="Search users" />
            )}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: isMobile ? 1 : 3 }}>
          <Button onClick={() => setOpenCreateDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateGroup} 
            variant="contained"
            disabled={!newGroup.name.trim()}
          >
            Create Group
          </Button>
        </DialogActions>
      </Dialog>

      {/* Members Dialog */}
      <Dialog 
        open={openMembersDialog} 
        onClose={() => setOpenMembersDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          {isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0 }}>
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => setOpenMembersDialog(false)}
                aria-label="close"
                sx={{ mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
              {selectedGroup?.name} - Members
            </Box>
          )}
          {!isMobile && `${selectedGroup?.name} - Members`}
        </DialogTitle>
        <DialogContent>
          {selectedGroup?.members && selectedGroup.members.length > 0 ? (
            <List>
              {selectedGroup.members.map((member) => (
                <ListItem key={member.id}>
                  <ListItemText
                    primary={member.username}
                    secondary={member.role}
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      label={member.role}
                      size="small"
                      color={member.role === 'admin' ? 'primary' : 'default'}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No members found
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: isMobile ? 1 : 3 }}>
          <Button onClick={() => setOpenMembersDialog(false)}>
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