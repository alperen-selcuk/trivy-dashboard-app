import { createTheme } from '@mui/material/styles';

/**
 * Custom Material-UI Theme Configuration
 * Implements vibrant colors, premium visual hierarchy, and modern design
 */

const theme = createTheme({
  palette: {
    primary: {
      main: '#6366f1', // Indigo
      light: '#818cf8',
      dark: '#4f46e5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ec4899', // Pink
      light: '#f472b6',
      dark: '#db2777',
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981', // Emerald
      light: '#34d399',
      dark: '#059669',
    },
    error: {
      main: '#ef4444', // Red
      light: '#f87171',
      dark: '#dc2626',
    },
    warning: {
      main: '#f59e0b', // Amber
      light: '#fbbf24',
      dark: '#d97706',
    },
    info: {
      main: '#3b82f6', // Blue
      light: '#60a5fa',
      dark: '#2563eb',
    },
    background: {
      default: '#f3f4f6', // Cool Gray
      paper: '#ffffff',
    },
    text: {
      primary: '#111827', // Gray 900
      secondary: '#6b7280', // Gray 500
    },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", "Roboto", sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.025em',
      background: 'linear-gradient(45deg, #4f46e5 30%, #ec4899 90%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    h2: {
      fontWeight: 800,
      letterSpacing: '-0.025em',
    },
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 700,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
            transform: 'translateY(-1px)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
        }
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
        elevation3: {
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        }
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          backgroundColor: '#ffffff',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#f9fafb',
            color: '#374151',
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid #f3f4f6',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: '#f9fafb',
          },
        },
      },
    },
  },
});

export const severityColors = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#f59e0b',
  LOW: '#10b981',
  UNKNOWN: '#6b7280',
};

export default theme;
