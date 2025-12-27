import { createTheme } from '@mui/material/styles';

/**
 * Custom Material-UI Theme Configuration
 * Implements vibrant colors, improved visual hierarchy, and modern design
 */

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196F3',
      light: '#64B5F6',
      dark: '#1976D2',
    },
    secondary: {
      main: '#FF9800',
      light: '#FFB74D',
      dark: '#F57C00',
    },
    success: {
      main: '#4CAF50',
      light: '#81C784',
      dark: '#388E3C',
    },
    error: {
      main: '#C62828',
      light: '#EF5350',
      dark: '#B71C1C',
    },
    warning: {
      main: '#EF6C00',
      light: '#FFB74D',
      dark: '#E65100',
    },
    info: {
      main: '#2196F3',
      light: '#64B5F6',
      dark: '#1976D2',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.015625em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.0083333333em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 700,
      letterSpacing: '0em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 700,
      letterSpacing: '0.0125em',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 700,
      letterSpacing: '0em',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 700,
      letterSpacing: '0.0125em',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      letterSpacing: '0.009375em',
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      letterSpacing: '0.0071428571em',
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      letterSpacing: '0.03125em',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      letterSpacing: '0.0178571429em',
      lineHeight: 1.5,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      letterSpacing: '0.0892857143em',
      textTransform: 'uppercase',
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      letterSpacing: '0.0333333333em',
    },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          padding: '10px 24px',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
          },
        },
        contained: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 12,
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 6,
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
        elevation2: {
          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
        },
        elevation3: {
          boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          backgroundColor: '#F5F5F5',
          borderBottom: '2px solid #E0E0E0',
        },
        body: {
          padding: '12px 16px',
          borderBottom: '1px solid #E0E0E0',
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: '1px solid #E0E0E0',
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid #E0E0E0',
            padding: '12px 16px',
          },
          '& .MuiDataGrid-columnHeader': {
            backgroundColor: '#F5F5F5',
            fontWeight: 700,
            borderBottom: '2px solid #E0E0E0',
          },
          '& .MuiDataGrid-row': {
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: '#FAFAFA',
            },
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

/**
 * Severity Color Mapping
 * Consistent colors for vulnerability severity levels
 */
export const severityColors = {
  CRITICAL: '#7B1FA2',  // Purple
  HIGH: '#C62828',      // Red
  MEDIUM: '#EF6C00',    // Orange
  LOW: '#2E7D32',       // Green
  UNKNOWN: '#757575',   // Gray
};

/**
 * Status Color Mapping
 * Colors for scan status indicators
 */
export const statusColors = {
  active: '#4CAF50',    // Bright Green
  inactive: '#FF9800',  // Orange
  unknown: '#9E9E9E',   // Gray
};

/**
 * Spacing Constants
 * Consistent spacing throughout the application
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export default theme;
