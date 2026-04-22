import React, { useState } from "react";
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  Container,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Alert,
  Snackbar,
  Fade,
  Paper
} from "@mui/material";
import { AccountBalance, Login as LoginIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { login as loginApi } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const data = await loginApi(email, password);
      
      // Store token in localStorage
      localStorage.setItem("token", data.access_token);
      
      // Update auth context
      login(data.user, data.access_token);
      
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: isMobile ? 2 : 4,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }
      }}
    >
      <Container maxWidth="sm">
        <Fade in={true} timeout={800}>
          <Card sx={{ 
            width: '100%', 
            maxWidth: isMobile ? '100%' : 400,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            borderRadius: 3,
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <CardContent sx={{ p: isMobile ? 3 : 4 }}>
              <Box sx={{ textAlign: 'center', mb: isMobile ? 3 : 4 }}>
                <Box sx={{ mb: 2 }}>
                  <AccountBalance 
                    sx={{ 
                      fontSize: 48, 
                      color: 'primary.main',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                    }} 
                  />
                </Box>
                <Typography 
                  variant={isMobile ? "h5" : "h4"} 
                  component="h1" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 700, 
                    color: 'primary.main',
                    background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  Di-Paid
                </Typography>
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
                >
                  Welcome back! Sign in to manage your expenses
                </Typography>
              </Box>
          
          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              variant="outlined"
              size={isMobile ? "medium" : "large"}
              sx={{ mb: 2 }}
              InputProps={{
                style: { fontSize: isMobile ? '1rem' : '1.1rem' }
              }}
              InputLabelProps={{
                style: { fontSize: isMobile ? '1rem' : '1.1rem' }
              }}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              variant="outlined"
              size={isMobile ? "medium" : "large"}
              sx={{ mb: 3 }}
              InputProps={{
                style: { fontSize: isMobile ? '1rem' : '1.1rem' }
              }}
              InputLabelProps={{
                style: { fontSize: isMobile ? '1rem' : '1.1rem' }
              }}
            />
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              fullWidth 
              disabled={loading}
              size={isMobile ? "large" : "large"}
              startIcon={loading ? null : <LoginIcon />}
              sx={{ 
                py: isMobile ? 1.5 : 2,
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
                background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1565c0, #1976d2)',
                  boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                }
              }}
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
          
          <Box sx={{ textAlign: 'center', mt: isMobile ? 3 : 4 }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
            >
              Don't have an account?{' '}
              <Button 
                variant="text" 
                color="primary"
                onClick={() => navigate("/register")}
                sx={{ 
                  textTransform: 'none',
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  fontWeight: 600
                }}
              >
                Sign up here
              </Button>
            </Typography>
          </Box>
            </CardContent>
          </Card>
        </Fade>
      </Container>

      {/* Error Snackbar */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError("")}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setError("")} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
} 