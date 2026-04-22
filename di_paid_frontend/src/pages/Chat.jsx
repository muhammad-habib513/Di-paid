import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Divider,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
  Fab,
  Drawer,
  AppBar,
  Toolbar,
  InputAdornment,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Container,
  ListItemIcon,
  ListItemButton
} from "@mui/material";
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Reply as ReplyIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon,
  Chat as ChatIcon,
  Group as GroupIcon,
  ArrowBack as ArrowBackIcon,
  EmojiEmotions as EmojiIcon,
  Videocam as VideoIcon,
  Mic as MicIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  BarChart as BarChartIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  getChatRooms,
  getChatRoom,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  uploadFile,
  getFileUrl,
  formatFileSize,
  formatMessageTime,
  isImageFile,
  isVideoFile,
  ChatWebSocket
} from "../api/chat";

export default function Chat() {
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [messageMenuAnchor, setMessageMenuAnchor] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [fileUpload, setFileUpload] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatWebSocket = useRef(null);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { roomId } = useParams();
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
      loadChatRooms();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (roomId) {
      loadChatRoom(parseInt(roomId));
    }
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatRooms = async () => {
    try {
      setLoading(true);
      const rooms = await getChatRooms();
      setChatRooms(rooms);
      
      // Auto-select first room if none selected
      if (rooms.length > 0 && !selectedRoom) {
        setSelectedRoom(rooms[0]);
        navigate(`/chat/${rooms[0].id}`);
      }
    } catch (err) {
      console.error("Failed to load chat rooms:", err);
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      setError("Failed to load chat rooms: " + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadChatRoom = async (roomId) => {
    try {
      const room = await getChatRoom(roomId);
      setSelectedRoom(room);
      await loadMessages(roomId);
      setupWebSocket(roomId);
    } catch (err) {
      setError("Failed to load chat room: " + (err.response?.data?.msg || err.message));
    }
  };

  const loadMessages = async (roomId, page = 1) => {
    try {
      const data = await getMessages(roomId, page);
      if (page === 1) {
        setMessages(data.messages.reverse()); // Reverse to show newest at bottom
      } else {
        setMessages(prev => [...data.messages.reverse(), ...prev]);
      }
    } catch (err) {
      setError("Failed to load messages: " + (err.response?.data?.msg || err.message));
    }
  };

  const setupWebSocket = (roomId) => {
    if (chatWebSocket.current) {
      chatWebSocket.current.disconnect();
    }

    chatWebSocket.current = new ChatWebSocket(
      roomId,
      (newMessage) => {
        setMessages(prev => [...prev, newMessage]);
      },
      (error) => {
        console.error("WebSocket error:", error);
      }
    );

    chatWebSocket.current.connect();
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !fileUpload) return;

    try {
      let messageData;
      
      if (fileUpload) {
        messageData = await uploadFile(selectedRoom.id, fileUpload);
        setFileUpload(null);
      } else {
        messageData = await sendMessage(
          selectedRoom.id,
          newMessage,
          "text",
          replyTo?.id
        );
      }

      setMessages(prev => [...prev, messageData]);
      setNewMessage("");
      setReplyTo(null);
    } catch (err) {
      setError("Failed to send message: " + (err.response?.data?.msg || err.message));
    }
  };

  const handleEditMessage = async () => {
    if (!editContent.trim()) return;

    try {
      const updatedMessage = await editMessage(selectedMessage.id, editContent);
      setMessages(prev =>
        prev.map(msg => msg.id === selectedMessage.id ? updatedMessage : msg)
      );
      setEditMode(false);
      setEditContent("");
      setSelectedMessage(null);
      setMessageMenuAnchor(null);
    } catch (err) {
      setError("Failed to edit message: " + (err.response?.data?.msg || err.message));
    }
  };

  const handleDeleteMessage = async () => {
    try {
      await deleteMessage(selectedMessage.id);
      setMessages(prev => prev.filter(msg => msg.id !== selectedMessage.id));
      setSelectedMessage(null);
      setMessageMenuAnchor(null);
      setSuccess("Message deleted successfully");
    } catch (err) {
      setError("Failed to delete message: " + (err.response?.data?.msg || err.message));
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileUpload(file);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const openMessageMenu = (event, message) => {
    setSelectedMessage(message);
    setMessageMenuAnchor(event.currentTarget);
  };

  const closeMessageMenu = () => {
    setMessageMenuAnchor(null);
    setSelectedMessage(null);
  };

  const startEdit = () => {
    setEditContent(selectedMessage.content);
    setEditMode(true);
    closeMessageMenu();
  };

  const startReply = () => {
    setReplyTo(selectedMessage);
    closeMessageMenu();
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

  const renderMessage = (message) => {
    const isOwnMessage = message.sender_id === user?.id;
    const isImage = message.message_type === "image";
    const isFile = message.message_type === "file";

    return (
      <ListItem
        key={message.id}
        sx={{
          flexDirection: "column",
          alignItems: isOwnMessage ? "flex-end" : "flex-start",
          mb: 1,
          px: isMobile ? 1 : 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1,
            maxWidth: isMobile ? "85%" : "70%",
            flexDirection: isOwnMessage ? "row-reverse" : "row",
          }}
        >
          <Avatar sx={{ width: isMobile ? 28 : 32, height: isMobile ? 28 : 32 }}>
            {message.sender_name?.charAt(0)?.toUpperCase()}
          </Avatar>
          
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: isOwnMessage ? "flex-end" : "flex-start",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 0.5,
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                {message.sender_name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                {formatMessageTime(message.created_at)}
              </Typography>
              {message.is_edited && (
                <Chip label="edited" size="small" variant="outlined" sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }} />
              )}
            </Box>

            {replyTo && replyTo.id === message.id && (
              <Box
                sx={{
                  bgcolor: "action.hover",
                  p: 1,
                  borderRadius: 1,
                  mb: 1,
                  maxWidth: isMobile ? 150 : 200,
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
                  Replying to: {replyTo.content.substring(0, isMobile ? 30 : 50)}...
                </Typography>
              </Box>
            )}

            <Paper
              elevation={1}
              sx={{
                p: isMobile ? 1 : 1.5,
                bgcolor: isOwnMessage ? "primary.main" : "background.paper",
                color: isOwnMessage ? "primary.contrastText" : "text.primary",
                borderRadius: 2,
                maxWidth: "100%",
              }}
            >
              {isImage ? (
                <img
                  src={getFileUrl(message.file_url.split("/").pop())}
                  alt="Shared image"
                  style={{ 
                    maxWidth: "100%", 
                    maxHeight: isMobile ? 200 : 300, 
                    borderRadius: 4 
                  }}
                />
              ) : isFile ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FileIcon sx={{ fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
                      {message.file_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
                      {formatFileSize(message.file_size)}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
                  {message.content}
                </Typography>
              )}
            </Paper>

            <Box sx={{ display: "flex", gap: 0.5, mt: 0.5 }}>
              <IconButton
                size="small"
                onClick={(e) => startReply()}
                sx={{ color: "text.secondary", p: isMobile ? 0.5 : 1 }}
              >
                <ReplyIcon fontSize={isMobile ? "small" : "medium"} />
              </IconButton>
              {isOwnMessage && (
                <IconButton
                  size="small"
                  onClick={(e) => openMessageMenu(e, message)}
                  sx={{ color: "text.secondary", p: isMobile ? 0.5 : 1 }}
                >
                  <MoreVertIcon fontSize={isMobile ? "small" : "medium"} />
                </IconButton>
              )}
            </Box>
          </Box>
        </Box>
      </ListItem>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 3 }}>
        <Card>
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Please log in to access chat
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
      {renderNavigationDrawer()}
      
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          width: isMobile ? '100%' : 'calc(100% - 280px)',
          ml: isMobile ? 0 : '280px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Mobile App Bar */}
        {isMobile && (
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
                {selectedRoom?.name || 'Chat'}
              </Typography>
              {selectedRoom && (
                <Chip
                  label={`${selectedRoom.member_count} members`}
                  size="small"
                  sx={{ fontSize: '0.75rem' }}
                />
              )}
            </Toolbar>
          </AppBar>
        )}

        {/* Desktop App Bar */}
        {!isMobile && (
          <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
            <Toolbar>
              <ChatIcon sx={{ mr: 2 }} />
              <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                Chat Rooms
              </Typography>
            </Toolbar>
          </AppBar>
        )}

        <Box sx={{ 
          display: 'flex', 
          height: '100vh',
          mt: isMobile ? 8 : 9
        }}>
          {/* Chat Rooms Sidebar - Desktop Only */}
          {!isMobile && (
            <Drawer
              variant="permanent"
              sx={{
                width: 320,
                flexShrink: 0,
                "& .MuiDrawer-paper": {
                  width: 320,
                  boxSizing: "border-box",
                  top: 64,
                  height: 'calc(100% - 64px)',
                },
              }}
            >
              <Box sx={{ p: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Search rooms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
                
                <List>
                  {chatRooms
                    .filter(room => 
                      room.name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((room) => (
                      <ListItemButton
                        key={room.id}
                        selected={selectedRoom?.id === room.id}
                        onClick={() => {
                          setSelectedRoom(room);
                          navigate(`/chat/${room.id}`);
                        }}
                      >
                        <ListItemAvatar>
                          <Badge badgeContent={room.unread_count} color="error">
                            <Avatar>
                              <GroupIcon />
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={room.name}
                          secondary={
                            room.last_message
                              ? `${room.last_message.sender_name}: ${room.last_message.content.substring(0, 30)}...`
                              : "No messages yet"
                          }
                        />
                      </ListItemButton>
                    ))}
                </List>
              </Box>
            </Drawer>
          )}

          {/* Chat Area */}
          <Box sx={{ 
            flex: 1, 
            display: "flex", 
            flexDirection: "column",
            width: isMobile ? '100%' : 'calc(100% - 320px)'
          }}>
            {selectedRoom ? (
              <>
                {/* Desktop Chat Header */}
                {!isMobile && (
                  <AppBar position="static" elevation={1}>
                    <Toolbar>
                      <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
                        <Typography variant="h6">{selectedRoom.name}</Typography>
                        <Chip
                          label={`${selectedRoom.member_count} members`}
                          size="small"
                          sx={{ ml: 2 }}
                        />
                      </Box>
                    </Toolbar>
                  </AppBar>
                )}

                {/* Messages Area */}
                <Box
                  sx={{
                    flex: 1,
                    overflow: "auto",
                    p: isMobile ? 1 : 2,
                    bgcolor: "grey.50",
                  }}
                >
                  {messages.length === 0 ? (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        color: "text.secondary",
                      }}
                    >
                      <ChatIcon sx={{ fontSize: isMobile ? 48 : 64, mb: 2 }} />
                      <Typography variant={isMobile ? "h6" : "h5"}>No messages yet</Typography>
                      <Typography variant="body2" sx={{ textAlign: 'center', px: isMobile ? 2 : 0 }}>
                        Start the conversation by sending a message!
                      </Typography>
                    </Box>
                  ) : (
                    <List sx={{ pb: 2 }}>
                      {messages.map(renderMessage)}
                      <div ref={messagesEndRef} />
                    </List>
                  )}
                </Box>

                {/* Message Input */}
                <Box sx={{ p: isMobile ? 1 : 2, bgcolor: "background.paper" }}>
                  {replyTo && (
                    <Box
                      sx={{
                        bgcolor: "action.hover",
                        p: 1,
                        borderRadius: 1,
                        mb: 1,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
                        Replying to: {replyTo.content.substring(0, isMobile ? 30 : 50)}...
                      </Typography>
                      <IconButton size="small" onClick={() => setReplyTo(null)}>
                        <ClearIcon fontSize={isMobile ? "small" : "medium"} />
                      </IconButton>
                    </Box>
                  )}

                  {fileUpload && (
                    <Box
                      sx={{
                        bgcolor: "action.hover",
                        p: 1,
                        borderRadius: 1,
                        mb: 1,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <FileIcon sx={{ fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
                        <Typography variant="body2" sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
                          {fileUpload.name}
                        </Typography>
                      </Box>
                      <IconButton size="small" onClick={() => setFileUpload(null)}>
                        <ClearIcon fontSize={isMobile ? "small" : "medium"} />
                      </IconButton>
                    </Box>
                  )}

                  <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
                    <TextField
                      fullWidth
                      multiline
                      maxRows={isMobile ? 3 : 4}
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={uploading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploading}
                              size={isMobile ? "small" : "medium"}
                            >
                              <AttachFileIcon fontSize={isMobile ? "small" : "medium"} />
                            </IconButton>
                            <IconButton disabled={uploading} size={isMobile ? "small" : "medium"}>
                              <EmojiIcon fontSize={isMobile ? "small" : "medium"} />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <IconButton
                      color="primary"
                      onClick={handleSendMessage}
                      disabled={(!newMessage.trim() && !fileUpload) || uploading}
                      size={isMobile ? "large" : "medium"}
                    >
                      <SendIcon fontSize={isMobile ? "medium" : "large"} />
                    </IconButton>
                  </Box>

                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "text.secondary",
                  px: isMobile ? 2 : 0,
                }}
              >
                <ChatIcon sx={{ fontSize: isMobile ? 48 : 64, mb: 2 }} />
                <Typography variant={isMobile ? "h6" : "h5"}>Select a chat room</Typography>
                <Typography variant="body2" sx={{ textAlign: 'center', px: isMobile ? 2 : 0 }}>
                  Choose a room from the sidebar to start chatting
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Message Menu */}
      <Menu
        anchorEl={messageMenuAnchor}
        open={Boolean(messageMenuAnchor)}
        onClose={closeMessageMenu}
      >
        <MenuItem onClick={startReply}>
          <ReplyIcon sx={{ mr: 1 }} />
          Reply
        </MenuItem>
        <MenuItem onClick={startEdit}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteMessage} sx={{ color: "error.main" }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Edit Message Dialog */}
      <Dialog 
        open={editMode} 
        onClose={() => setEditMode(false)} 
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
                onClick={() => setEditMode(false)}
                aria-label="close"
                sx={{ mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
              Edit Message
            </Box>
          )}
          {!isMobile && "Edit Message"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={isMobile ? 4 : 6}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            sx={{ mt: isMobile ? 0 : 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: isMobile ? 2 : 3 }}>
          <Button onClick={() => setEditMode(false)}>
            Cancel
          </Button>
          <Button onClick={handleEditMessage} variant="contained">
            Save
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