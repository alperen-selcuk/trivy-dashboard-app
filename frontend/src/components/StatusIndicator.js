import React from 'react';
import { Chip, Tooltip, Box } from '@mui/material';

/**
 * StatusIndicator Component
 * Displays the status of a scan (active or inactive)
 * 
 * Props:
 *   status: 'active' | 'inactive' | 'unknown'
 *   scanTime: Date or string
 *   onClick: Optional click handler
 */
const StatusIndicator = ({ status = 'unknown', scanTime, onClick }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return '#4CAF50'; // Bright Green
      case 'inactive':
        return '#FF9800'; // Orange
      default:
        return '#9E9E9E'; // Gray
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'active':
        return 'Active (Latest)';
      case 'inactive':
        return 'Inactive (Older)';
      default:
        return 'Unknown';
    }
  };

  const getStatusBorderColor = () => {
    switch (status) {
      case 'active':
        return '#45a049';
      case 'inactive':
        return '#e68900';
      default:
        return '#757575';
    }
  };

  const formattedTime = scanTime 
    ? new Date(scanTime).toLocaleString()
    : 'Unknown';

  return (
    <Tooltip title={`${getStatusLabel()} - Scanned: ${formattedTime}`}>
      <Chip
        label={getStatusLabel()}
        onClick={onClick}
        sx={{
          backgroundColor: getStatusColor(),
          color: 'white',
          border: `2px solid ${getStatusBorderColor()}`,
          fontWeight: 'bold',
          cursor: onClick ? 'pointer' : 'default',
          opacity: status === 'inactive' ? 0.7 : 1,
          '&:hover': onClick ? {
            opacity: 1,
            transform: 'scale(1.05)',
          } : {},
        }}
      />
    </Tooltip>
  );
};

export default StatusIndicator;
