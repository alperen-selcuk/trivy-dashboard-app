import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { statusColors } from '../theme';

/**
 * StatusBadge Component
 * Displays scan status with visual distinction
 * 
 * Props:
 *   status: 'active' | 'inactive' | 'unknown'
 *   label: string - Optional custom label
 *   showDot: boolean - Show status dot indicator
 */
const StatusBadge = ({
  status = 'unknown',
  label,
  showDot = true,
  ...props
}) => {
  const color = statusColors[status] || statusColors.unknown;

  const getStatusLabel = () => {
    if (label) return label;
    
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      default:
        return 'Unknown';
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case 'active':
        return 'Latest scan - Currently active';
      case 'inactive':
        return 'Older scan - Superseded by newer scan';
      default:
        return 'Status unknown';
    }
  };

  return (
    <Tooltip title={getStatusDescription()}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          padding: '6px 12px',
          borderRadius: 6,
          backgroundColor: `${color}15`,
          border: `2px solid ${color}`,
          cursor: 'default',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: `${color}25`,
            transform: 'scale(1.02)',
          },
        }}
        {...props}
      >
        {showDot && (
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: color,
              animation: status === 'active' ? 'pulse 2s infinite' : 'none',
              '@keyframes pulse': {
                '0%': {
                  boxShadow: `0 0 0 0 ${color}80`,
                },
                '70%': {
                  boxShadow: `0 0 0 10px ${color}00`,
                },
                '100%': {
                  boxShadow: `0 0 0 0 ${color}00`,
                },
              },
            }}
          />
        )}
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: color,
            textTransform: 'capitalize',
          }}
        >
          {getStatusLabel()}
        </Typography>
      </Box>
    </Tooltip>
  );
};

export default StatusBadge;
