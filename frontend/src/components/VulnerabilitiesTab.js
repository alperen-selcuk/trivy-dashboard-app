import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from '@mui/material';
import axios from 'axios';

const VulnerabilitiesTab = ({ getSeverityColor }) => {
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [selectedVuln, setSelectedVuln] = useState(null);
  const [affectedImages, setAffectedImages] = useState([]);

  useEffect(() => {
    fetchVulnerabilities();
  }, []);

  const fetchVulnerabilities = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/vulnerabilities');
      setVulnerabilities(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load vulnerabilities');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVulnerabilityClick = async (vuln) => {
    setSelectedVuln(vuln);
    try {
      const response = await axios.get(
        `/api/vulnerabilities/${vuln.VulnerabilityID}/affected-images`
      );
      setAffectedImages(response.data);
    } catch (err) {
      console.error('Failed to load affected images:', err);
    }
  };

  const filteredVulnerabilities = vulnerabilities.filter((vuln) => {
    const matchesSeverity = severityFilter === 'ALL' || vuln.Severity === severityFilter;
    const matchesSearch =
      searchQuery === '' ||
      vuln.VulnerabilityID?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vuln.Description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSeverity && matchesSearch;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          placeholder="Search by CVE or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          size="small"
        />
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Severity</InputLabel>
          <Select
            value={severityFilter}
            label="Severity"
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <MenuItem value="ALL">All</MenuItem>
            <MenuItem value="CRITICAL">CRITICAL</MenuItem>
            <MenuItem value="HIGH">HIGH</MenuItem>
            <MenuItem value="MEDIUM">MEDIUM</MenuItem>
            <MenuItem value="LOW">LOW</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>CVE Code</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Severity</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Affected Images</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredVulnerabilities.map((vuln, idx) => (
              <TableRow
                key={idx}
                onClick={() => handleVulnerabilityClick(vuln)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: '#f5f5f5' },
                }}
              >
                <TableCell>
                  {vuln.VulnerabilityID ? (
                    <a
                      href={`https://nvd.nist.gov/vuln/detail/${vuln.VulnerabilityID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: '#2196F3', textDecoration: 'none' }}
                    >
                      {vuln.VulnerabilityID}
                    </a>
                  ) : (
                    'N/A'
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={vuln.Severity}
                    sx={{
                      backgroundColor: getSeverityColor(vuln.Severity),
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                    size="small"
                  />
                </TableCell>
                <TableCell>{vuln.Description || 'No description'}</TableCell>
                <TableCell>{vuln.AffectedImageCount || 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedVuln && affectedImages.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Paper sx={{ p: 2 }}>
            <h3>Affected Images: {selectedVuln.VulnerabilityID}</h3>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Image</TableCell>
                    <TableCell>Version</TableCell>
                    <TableCell>Severity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {affectedImages.map((img, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{img.image_name}</TableCell>
                      <TableCell>{img.version}</TableCell>
                      <TableCell>
                        <Chip
                          label={img.severity}
                          sx={{
                            backgroundColor: getSeverityColor(img.severity),
                            color: 'white',
                          }}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default VulnerabilitiesTab;
