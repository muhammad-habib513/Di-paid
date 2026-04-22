import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, IconButton, Box } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
// Import your pages and components
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardMui from './pages/DashboardMui';
import Groups from './pages/Groups.jsx';
import GroupDetail from './pages/GroupDetail';
import Expenses from './pages/Expenses';
import Payments from './pages/Payments';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import Security from './pages/Security';
import Chat from './pages/Chat';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { SnackbarProvider } from './context/SnackbarContext';
import theme, { getTheme } from './theme/theme';
import { useEffect, useMemo, useState } from 'react';

export default function App() {
  const [mode, setMode] = useState(localStorage.getItem('themeMode') || 'light');
  const muiTheme = useMemo(() => getTheme(mode), [mode]);

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <AuthProvider>
        <SnackbarProvider>
          <BrowserRouter>
            <Box sx={{ position: 'fixed', right: 16, bottom: 16, zIndex: 2000, bgcolor: 'background.paper', borderRadius: 5, boxShadow: 3 }}>
              <IconButton color="primary" onClick={() => setMode(m => (m === 'light' ? 'dark' : 'light'))}>
                {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Box>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardMui /></ProtectedRoute>} />
              <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
              <Route path="/groups/:groupId" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
              <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
              <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/security" element={<ProtectedRoute><Security /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/chat/:roomId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="*" element={<Login />} />
            </Routes>
          </BrowserRouter>
        </SnackbarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
