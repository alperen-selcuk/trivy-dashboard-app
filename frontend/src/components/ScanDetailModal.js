import React, { useState } from 'react';
import {
  Modal as MuiModal,
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { alpha } from '@mui/material/styles';
import StatusIndicator from './StatusIndicator';

/**
 * TabPanel Component
 * Helper component for tab content
 */
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

/**
 * ScanDetailModal Component
 * Displays detailed scan information for all versions of an image
 * 
 * Props:
 *   open: boolean
 *   imageName: string
 *   scans: Array of scan objects with status
 *   onClose: Function to call when modal closes
 *   getSeverityColor: Function to get color for severity level
 */
const ScanDetailModal = ({ open, imageName, scans = [], onClose, getSeverityColor }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '1200px',
    maxHeight: '80vh',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    overflow: 'auto',
    borderRadius: 2
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (!scans || scans.length === 0) {
    return (
      <MuiModal open={open} onClose={onClose}>
        <Box sx={modalStyle}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Scan Details for {imageName}
            </Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Alert severity="info">No scans available for this image</Alert>
        </Box>
      </MuiModal>
    );
  }

  return (
    <MuiModal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Scan Details for {imageName}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {loading && <CircularProgress />}

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          {scans.map((scan, index) => {
            const version = scan.image_name.split(':')[1] || 'latest';
            return (
              <Tab
                key={index}
                label={`:${version}`}
                sx={{
                  backgroundColor: scan.status === 'active' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.05)',
                }}
              />
            );
          })}
        </Tabs>

        {scans.map((scan, index) => (
          <TabPanel value={activeTab} index={index} key={index}>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Status:
                </Typography>
                <StatusIndicator
                  status={scan.status}
                  scanTime={scan.scan_time}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    Scan Time:
                  </Typography>
                  <Typography variant="body2">
                    {new Date(scan.scan_time).toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    Total Vulnerabilities:
                  </Typography>
                  <Typography variant="body2">
                    {scan.vulnerability_count}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {scan.vulnerability_count === 0 ? (
              <Alert severity="success">No vulnerabilities found in this scan</Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Severity</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>CVE Code</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Package Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Installed Version</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Fixed Version</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scan.vulnerabilities.map((vuln, idx) => (
                      <TableRow
                        key={idx}
                        sx={{
                          backgroundColor: alpha(getSeverityColor(vuln.Severity), 0.1),
                          '&:hover': {
                            backgroundColor: alpha(getSeverityColor(vuln.Severity), 0.15),
                          }
                        }}
                      >
                        <TableCell>
                          <Chip
                            label={vuln.Severity || 'UNKNOWN'}
                            sx={{
                              backgroundColor: getSeverityColor(vuln.Severity),
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {vuln.VulnerabilityID ? (
                            <a
                              href={`https://nvd.nist.gov/vuln/detail/${vuln.VulnerabilityID}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: '#2196F3',
                                textDecoration: 'none',
                                fontWeight: 'bold'
                              }}
                            >
                              {vuln.VulnerabilityID}
                            </a>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>{vuln.PkgName || 'N/A'}</TableCell>
                        <TableCell>{vuln.InstalledVersion || 'N/A'}</TableCell>
                        <TableCell>{vuln.FixedVersion || 'N/A'}</TableCell>
                        <TableCell sx={{ maxWidth: '300px', wordWrap: 'break-word' }}>
                          {vuln.Description || 'No description available'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>
        ))}
      </Box>
    </MuiModal>
  );
};

export default ScanDetailModal;
