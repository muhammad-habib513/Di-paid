import React from 'react';
import { Snackbar, Alert, Slide, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const SlideTransition = (props) => {
  return <Slide {...props} direction="up" />;
};

const NotificationToast = ({ 
  open, 
  onClose, 
  message, 
  severity = 'info', 
  duration = 6000,
  action 
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      TransitionComponent={SlideTransition}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      sx={{ mb: 2, mr: 2 }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{ 
          minWidth: 300,
          '& .MuiAlert-message': {
            width: '100%'
          }
        }}
        action={
          action || (
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={onClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )
        }
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default NotificationToast;
