import React from 'react';
import { Chip } from '@mui/material';
import { severityColors } from '../theme';

/**
 * ColoredChip Component
 * Reusable chip component with severity-based colors
 * 
 * Props:
 *   severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN'
 *   label: string - The text to display
 *   variant: 'filled' | 'outlined' - Default: 'filled'
 *   onClick: Optional click handler
 *   size: 'small' | 'medium' - Default: 'medium'
 */
const ColoredChip = ({
  severity = 'UNKNOWN',
  label,
  variant = 'filled',
  onClick,
  size = 'medium',
  ...props
}) => {
  const color = severityColors[severity] || severityColors.UNKNOWN;

  const getContrastColor = (hexColor) => {
    // Convert hex to RGB
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return white or black based on luminance
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  const textColor = getContrastColor(color);

  if (variant === 'outlined') {
    return (
      <Chip
        label={label}
        onClick={onClick}
        size={size}
        sx={{
          borderColor: color,
          color: color,
          fontWeight: 600,
          border: `2px solid ${color}`,
          transition: 'all 0.2s ease',
          cursor: onClick ? 'pointer' : 'default',
          '&:hover': onClick ? {
            backgroundColor: color,
            color: textColor,
            transform: 'scale(1.05)',
          } : {},
        }}
        {...props}
      />
    );
  }

  // Filled variant (default)
  return (
    <Chip
      label={label}
      onClick={onClick}
      size={size}
      sx={{
        backgroundColor: color,
        color: textColor,
        fontWeight: 600,
        transition: 'all 0.2s ease',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          transform: 'scale(1.05)',
          boxShadow: `0 4px 12px ${color}40`,
        } : {},
      }}
      {...props}
    />
  );
};

export default ColoredChip;
