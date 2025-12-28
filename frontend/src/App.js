import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import { ThemeProvider } from '@mui/material/styles';
import {
  Container,
  Typography,
  Paper,
  Box,
  Alert,
  Modal as MuiModal,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  TextField,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  Button,
  Menu,
  MenuItem as MenuItemComponent,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import axios from 'axios';
import { alpha } from '@mui/material/styles';
import theme from './theme';
import StatusIndicator from './components/StatusIndicator';
import ScanDetailModal from './components/ScanDetailModal';
import LoginPage from './pages/LoginPage';
import { AuthContext, AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DeleteButton from './components/DeleteButton';
import VulnerabilitiesTab from './components/VulnerabilitiesTab';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function DashboardContent() {
  const { user, logout, isAdmin } = useContext(AuthContext);
  const [scanResults, setScanResults] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  // const [selectedVulnerability, setSelectedVulnerability] = useState(null); // Removed, using DetailModal

  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [modalSeverityFilter, setModalSeverityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState(0);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalScans, setDetailModalScans] = useState([]);
  const [detailModalImageName, setDetailModalImageName] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/scan-results/deduplicated');

        const formattedData = response.data.map((item, index) => {
          return {
            id: index,
            image_name: item.image_name,
            current_version: item.current_version,
            scan_time: new Date(item.scan_time).toLocaleString(),
            tags: item.tags,
            vulnerabilities: item.vulnerabilities,
            total_vulns: item.total_vulns,
          };
        });

        setScanResults(formattedData);
        setError(null);
      } catch (error) {
        console.error('Error fetching scan results:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity) => {
    const colors = {
      CRITICAL: '#ef4444',
      HIGH: '#f97316',
      MEDIUM: '#f59e0b',
      LOW: '#10b981',
      UNKNOWN: '#6b7280'
    };
    return colors[severity] || colors.UNKNOWN;
  };

  const handleOpenDetailModal = async (imageName) => {
    // We already have the tags in the row data, which contains the history.
    // However, the backend logic for /api/images/{image_name}/scans might need to be used if we want *all* history, 
    // but the 'deduplicated' endpoint returns 'tags' which contains the latest scan per version.
    // The user wants "history" (active/inactive).
    // The /api/images/{name}/scans endpoint returns ALL scans (including inactive).
    // So we should keep fetching detailed history.
    try {
      // URL encode the image name to handle slashes in registry paths
      const encodedImageName = encodeURIComponent(imageName);
      const response = await axios.get(`/api/images/${encodedImageName}/scans`);
      setDetailModalScans(response.data);
      setDetailModalImageName(imageName);
      setDetailModalOpen(true);
    } catch (error) {
      console.error('Error fetching scan details:', error);
      setError('Failed to load scan details');
    }
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setDetailModalScans([]);
    setDetailModalImageName('');
  };

  const handleDeleteSuccess = () => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/scan-results/deduplicated');
        const formattedData = response.data.map((item, index) => {
          return {
            id: index,
            image_name: item.image_name,
            current_version: item.current_version,
            scan_time: new Date(item.scan_time).toLocaleString(),
            tags: item.tags,
            vulnerabilities: item.vulnerabilities,
            total_vulns: item.total_vulns,
          };
        });
        setScanResults(formattedData);
      } catch (error) {
        console.error('Error refreshing data:', error);
      }
    };
    fetchData();
  };

  const filteredResults = scanResults.map(result => {
    if (severityFilter === 'ALL') {
      return result;
    }

    return {
      ...result,
      vulnerabilities: result.vulnerabilities.filter(vuln => vuln.Severity === severityFilter),
      total_vulns: result.vulnerabilities.filter(vuln => vuln.Severity === severityFilter).length
    };
  }).filter(result => result.total_vulns > 0);

  const columns = [
    {
      field: 'image_name',
      headerName: 'Image Name',
      width: 250,
      flex: 1.5,
      resizable: true,
      renderCell: (params) => (
        <Box
          onClick={() => handleOpenDetailModal(params.value)}
          sx={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {params.value}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 0.5 }}>
            {params.row.tags.map((tag, idx) => (
              <Chip
                key={idx}
                label={`:${tag.tag}`}
                size="small"
                variant={tag.is_latest_global ? "filled" : "outlined"}
                color={tag.is_latest_global ? "primary" : "default"}
                sx={{ mr: 0.5, mb: 0.5, height: 20, fontSize: '0.7rem' }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDetailModal(params.value);
                }}
              />
            ))}
          </Box>
        </Box>
      )
    },
    {
      field: 'current_version',
      headerName: 'Version',
      width: 120,
      resizable: true,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'scan_time',
      headerName: 'Latest Scan',
      width: 200,
      flex: 1,
      resizable: true,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value}
        </Typography>
      )
    },
    {
      field: 'total_vulns',
      headerName: 'Vulns',
      width: 120,
      resizable: true,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value > 0 ? "error" : "success"}
          size="small"
          sx={{ fontWeight: 'bold' }}
        />
      )
    },
    {
      field: 'vulnerabilities',
      headerName: 'Severity Breakdown',
      width: 400,
      flex: 2,
      resizable: true,
      renderCell: (params) => {
        const vulns = params.value;
        if (!vulns || vulns.length === 0) {
          return <Chip label="Safe" color="success" size="small" variant="outlined" />;
        }

        const severityCounts = vulns.reduce((acc, vuln) => {
          const severity = vuln.Severity || 'UNKNOWN';
          acc[severity] = (acc[severity] || 0) + 1;
          return acc;
        }, {});

        // Order: CRITICAL, HIGH, MEDIUM, LOW
        const order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'];

        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {order.map(severity => {
              if (!severityCounts[severity]) return null;
              return (
                <Chip
                  key={severity}
                  label={`${severity.substring(0, 1)}: ${severityCounts[severity]}`}
                  size="small"
                  sx={{
                    backgroundColor: getSeverityColor(severity),
                    color: 'white',
                    fontWeight: 'bold',
                    minWidth: '40px'
                  }}
                />
              );
            })}
          </Box>
        );
      }
    },
    ...(isAdmin ? [{
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      resizable: true,
      renderCell: (params) => (
        <DeleteButton
          scanId={params.row.tags.find(t => t.is_latest_global)?.id || params.row.id} // Best guess for ID
          onDeleteSuccess={handleDeleteSuccess}
          onError={(err) => setError(err)}
        />
      )
    }] : [])
  ];



  return (
    <>
      <AppBar position="static" sx={{ mb: 3 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Trivy Scan Results Dashboard
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">
              {user?.username} {isAdmin && '(Admin)'}
            </Typography>
            <IconButton
              color="inherit"
              onClick={(e) => setAnchorEl(e.currentTarget)}
            >
              <AccountCircleIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItemComponent
                onClick={() => {
                  logout();
                  setAnchorEl(null);
                }}
              >
                <LogoutIcon sx={{ mr: 1 }} />
                Logout
              </MenuItemComponent>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl">
        <Box sx={{ mt: 2, mb: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Error: {error}
            </Alert>
          )}

          {loading && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Loading scan results...
            </Alert>
          )}

          <Tabs
            value={currentTab}
            onChange={(e, newValue) => setCurrentTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
          >
            <Tab label="Dashboard" />
            <Tab label="Vulnerabilities" />
          </Tabs>

          <TabPanel value={currentTab} index={0}>
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Severity Filter</InputLabel>
                <Select
                  value={severityFilter}
                  label="Severity Filter"
                  onChange={(e) => setSeverityFilter(e.target.value)}
                >
                  <MenuItem value="ALL">All Severities</MenuItem>
                  <MenuItem value="CRITICAL">
                    <Chip
                      label="CRITICAL"
                      sx={{
                        backgroundColor: getSeverityColor('CRITICAL'),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </MenuItem>
                  <MenuItem value="HIGH">
                    <Chip
                      label="HIGH"
                      sx={{
                        backgroundColor: getSeverityColor('HIGH'),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </MenuItem>
                  <MenuItem value="MEDIUM">
                    <Chip
                      label="MEDIUM"
                      sx={{
                        backgroundColor: getSeverityColor('MEDIUM'),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </MenuItem>
                  <MenuItem value="LOW">
                    <Chip
                      label="LOW"
                      sx={{
                        backgroundColor: getSeverityColor('LOW'),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Paper elevation={0} sx={{ height: 600, width: '100%', borderRadius: 3, overflow: 'hidden' }}>
              <DataGrid
                rows={filteredResults}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                disableSelectionOnClick
                loading={loading}
                getRowHeight={() => 'auto'}
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-row': {
                    cursor: 'pointer'
                  }
                }}
                onRowClick={(params) => handleOpenDetailModal(params.row.image_name)}
              />
            </Paper>

            <ScanDetailModal
              open={detailModalOpen}
              imageName={detailModalImageName}
              scans={detailModalScans}
              onClose={handleCloseDetailModal}
              getSeverityColor={getSeverityColor}
            />
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <VulnerabilitiesTab getSeverityColor={getSeverityColor} />
          </TabPanel>
        </Box>
      </Container>
    </>
  );
}

function AppContent() {
  const { loading, isAuthenticated } = useContext(AuthContext);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardContent />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
