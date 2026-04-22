import React from 'react';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';

const EmptyState = ({ 
  icon, 
  title, 
  description, 
  action, 
  actionText, 
  onAction 
}) => {
  return (
    <Card 
      sx={{ 
        textAlign: 'center', 
        p: 4,
        backgroundColor: 'background.paper',
        boxShadow: 'none',
        border: '1px dashed',
        borderColor: 'divider'
      }}
    >
      <CardContent>
        <Box sx={{ mb: 3 }}>
          {icon}
        </Box>
        <Typography variant="h6" gutterBottom color="text.secondary">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {description}
        </Typography>
        {action && (
          <Button
            variant="outlined"
            onClick={onAction}
            sx={{ borderRadius: 2 }}
          >
            {actionText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default EmptyState;
