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
  Snackbar
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { register as registerApi } from "../api/auth";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await registerApi(name, email, password);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.msg || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      py: isMobile ? 2 : 4
    }}>
      <Card sx={{ 
        width: '100%', 
        maxWidth: isMobile ? '100%' : 400,
        boxShadow: theme.shadows[8],
        borderRadius: isMobile ? 2 : 3
      }}>
        <CardContent sx={{ p: isMobile ? 3 : 4 }}>
          <Box sx={{ textAlign: 'center', mb: isMobile ? 3 : 4 }}>
            <Typography 
              variant={isMobile ? "h5" : "h4"} 
              component="h1" 
              gutterBottom
              sx={{ fontWeight: 600, color: 'primary.main' }}
            >
              Join Di-Paid
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
            >
              Create your account to start splitting bills with friends
            </Typography>
          </Box>
          
          <form onSubmit={handleSubmit}>
            <TextField
              label="Full Name"
              type="text"
              fullWidth
              margin="normal"
              value={name}
              onChange={e => setName(e.target.value)}
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
              sx={{ 
                py: isMobile ? 1.5 : 2,
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2
              }}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
          
          <Box sx={{ textAlign: 'center', mt: isMobile ? 3 : 4 }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
            >
              Already have an account?{' '}
              <Button 
                variant="text" 
                color="primary"
                onClick={() => navigate("/login")}
                sx={{ 
                  textTransform: 'none',
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  fontWeight: 600
                }}
              >
                Sign in here
              </Button>
            </Typography>
          </Box>
        </CardContent>
      </Card>

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
    </Container>
  );
} 