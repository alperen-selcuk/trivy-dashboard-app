import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Alert,
  Modal,
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
  Tab
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';

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

function App() {
  const [scanResults, setScanResults] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVulnerability, setSelectedVulnerability] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [modalSeverityFilter, setModalSeverityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/scan-results');
        console.log('API Response:', response.data);
        
        const formattedData = response.data.map((result, index) => ({
          id: index,
          image_name: result.image_name,
          scan_time: new Date(result.scan_time).toLocaleString(),
          vulnerabilities: result.vulnerabilities || [],
          total_vulns: result.vulnerabilities ? result.vulnerabilities.length : 0
        }));
        
        console.log('Formatted Data:', formattedData);
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
      flex: 1 
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
    }
  ];

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

  const getFilteredVulnerabilities = () => {
    if (!selectedVulnerability) return [];
    
    return selectedVulnerability.vulnerabilities.filter(vuln => {
      const matchesSeverity = modalSeverityFilter === 'ALL' || vuln.Severity === modalSeverityFilter;
      const matchesSearch = searchQuery === '' || 
        vuln.PkgName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vuln.Description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSeverity && matchesSearch;
    });
  };

  const groupVulnerabilitiesBySeverity = () => {
    if (!selectedVulnerability) return {};

    const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'];
    const grouped = selectedVulnerability.vulnerabilities.reduce((acc, vuln) => {
      const severity = vuln.Severity || 'UNKNOWN';
      if (!acc[severity]) {
        acc[severity] = [];
      }
      acc[severity].push(vuln);
      return acc;
    }, {});

    // Sıralı severity'leri döndür
    return severityOrder.reduce((acc, severity) => {
      if (grouped[severity]) {
        acc[severity] = grouped[severity];
      }
      return acc;
    }, {});
  };

  const renderVulnerabilityTable = (vulnerabilities) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Package Name</TableCell>
            <TableCell>Installed Version</TableCell>
            <TableCell>Fixed Version</TableCell>
            <TableCell>Description</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {vulnerabilities.map((vuln, index) => (
            <TableRow key={index}>
              <TableCell>{vuln.PkgName}</TableCell>
              <TableCell>{vuln.InstalledVersion || 'N/A'}</TableCell>
              <TableCell>{vuln.FixedVersion || 'N/A'}</TableCell>
              <TableCell>{vuln.Description || 'No description available'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Trivy Scan Results Dashboard
        </Typography>
        
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
            sx={{
              '& .MuiDataGrid-cell': {
                fontSize: '14px',
                cursor: 'pointer'
              },
            }}
            onRowClick={(params) => setSelectedVulnerability(params.row)}
          />
        </Paper>

        <Modal
          open={selectedVulnerability !== null}
          onClose={() => setSelectedVulnerability(null)}
        >
          <Box sx={modalStyle}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Vulnerability Details for {selectedVulnerability?.image_name}
              </Typography>
              <IconButton onClick={() => setSelectedVulnerability(null)}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs 
                value={currentTab} 
                onChange={(e, newValue) => setCurrentTab(newValue)}
                variant="scrollable"
                scrollButtons="auto"
              >
                {Object.entries(groupVulnerabilitiesBySeverity()).map(([severity, vulns], index) => (
                  <Tab 
                    key={severity}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={`${severity} (${vulns.length})`}
                          sx={{
                            backgroundColor: getSeverityColor(severity),
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        />
                      </Box>
                    }
                  />
                ))}
              </Tabs>
            </Box>

            {Object.entries(groupVulnerabilitiesBySeverity()).map(([severity, vulns], index) => (
              <TabPanel key={severity} value={currentTab} index={index}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {vulns.length} {severity.toLowerCase()} severity vulnerabilities found
                  </Typography>
                </Box>
                {renderVulnerabilityTable(vulns)}
              </TabPanel>
            ))}
          </Box>
        </Modal>
      </Box>
    </Container>
  );
}

export default App; 