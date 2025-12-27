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
  const [selectedVulnerability, setSelectedVulnerability] = useState(null);
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
      CRITICAL: '#7B1FA2',
      HIGH: '#C62828',
      MEDIUM: '#EF6C00',
      LOW: '#2E7D32',
      UNKNOWN: '#757575'
    };
    return colors[severity] || colors.UNKNOWN;
  };

  const handleOpenDetailModal = async (imageName) => {
    try {
      const response = await axios.get(`/api/images/${imageName}/scans`);
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
      width: 300,
      flex: 1,
      renderCell: (params) => (
        <Box
          onClick={() => handleOpenDetailModal(params.value)}
          sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
        >
          <Typography>{params.value}</Typography>
          <Box sx={{ pl: 2 }}>
            {params.row.tags.map((tag, idx) => (
              <Chip
                key={idx}
                label={`:${tag.tag} (${tag.total_vulns})`}
                size="small"
                sx={{ m: 0.5 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedVulnerability({...params.row, initialTag: idx});
                }}
              />
            ))}
          </Box>
        </Box>
      )
    },
    { 
      field: 'scan_time', 
      headerName: 'Scan Time', 
      width: 200,
      flex: 1 
    },
    {
      field: 'total_vulns',
      headerName: 'Total Vulnerabilities',
      width: 180,
      flex: 1
    },
    {
      field: 'vulnerabilities',
      headerName: 'Vulnerability Details',
      width: 400,
      flex: 2,
      renderCell: (params) => {
        const vulns = params.value;
        if (!vulns || vulns.length === 0) {
          return <div>No vulnerabilities found</div>;
        }
        
        const severityCounts = vulns.reduce((acc, vuln) => {
          const severity = vuln.Severity || 'UNKNOWN';
          acc[severity] = (acc[severity] || 0) + 1;
          return acc;
        }, {});

        return (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {Object.entries(severityCounts).map(([severity, count]) => (
              <Chip
                key={severity}
                label={`${severity}: ${count}`}
                sx={{
                  backgroundColor: getSeverityColor(severity),
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            ))}
          </Box>
        );
      }
    },
    ...(isAdmin ? [{
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <DeleteButton
          scanId={params.row.id}
          onDeleteSuccess={handleDeleteSuccess}
          onError={(err) => setError(err)}
        />
      )
    }] : [])
  ];

  const Modal = ({ selectedVulnerability, onClose }) => {
    const [activeTag, setActiveTag] = useState(0);

    const modalStyle = {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '80%',
      maxHeight: '80vh',
      bgcolor: 'background.paper',
      boxShadow: 24,
      p: 4,
      overflow: 'auto',
      borderRadius: 2
    };

    return (
      <MuiModal
        open={selectedVulnerability !== null}
        onClose={onClose}
      >
        <Box sx={modalStyle}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Vulnerability Details for {selectedVulnerability?.image_name}
            </Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Tabs 
            value={activeTag}
            onChange={(e, newValue) => setActiveTag(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            {selectedVulnerability?.tags.map((tagInfo, index) => (
              <Tab 
                key={index} 
                label={`:${tagInfo.tag}`} 
              />
            ))}
          </Tabs>

          {selectedVulnerability?.tags.map((tagInfo, index) => (
            <TabPanel value={activeTag} index={index} key={index}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">
                  Scan Time: {tagInfo.scan_time}
                </Typography>
                <Typography variant="subtitle1">
                  Total Vulnerabilities: {tagInfo.total_vulns}
                </Typography>
              </Box>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Severity</TableCell>
                      <TableCell>CVE Code</TableCell>
                      <TableCell>Package Name</TableCell>
                      <TableCell>Installed Version</TableCell>
                      <TableCell>Fixed Version</TableCell>
                      <TableCell>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tagInfo.vulnerabilities.map((vuln, idx) => (
                      <TableRow 
                        key={idx}
                        sx={{ 
                          backgroundColor: alpha(getSeverityColor(vuln.Severity), 0.1)
                        }}
                      >
                        <TableCell>
                          <Chip 
                            label={vuln.Severity} 
                            sx={{
                              backgroundColor: getSeverityColor(vuln.Severity),
                              color: 'white'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {vuln.VulnerabilityID ? (
                            <a 
                              href={`https://nvd.nist.gov/vuln/detail/${vuln.VulnerabilityID}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#2196F3', textDecoration: 'none' }}
                            >
                              {vuln.VulnerabilityID}
                            </a>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>{vuln.PkgName}</TableCell>
                        <TableCell>{vuln.InstalledVersion}</TableCell>
                        <TableCell>{vuln.FixedVersion}</TableCell>
                        <TableCell>{vuln.Description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
          ))}
        </Box>
      </MuiModal>
    );
  };

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

            <Paper elevation={3} sx={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={filteredResults}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10]}
                disableSelectionOnClick
                loading={loading}
                getRowHeight={() => 'auto'}
                sx={{
                  '& .MuiDataGrid-cell': {
                    fontSize: '14px',
                    cursor: 'pointer',
                    padding: '8px',
                  },
                  '& .MuiDataGrid-row': {
                    alignItems: 'flex-start',
                  }
                }}
                onRowClick={(params) => setSelectedVulnerability(params.row)}
              />
            </Paper>

            <Modal
              selectedVulnerability={selectedVulnerability}
              onClose={() => setSelectedVulnerability(null)}
            />

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
