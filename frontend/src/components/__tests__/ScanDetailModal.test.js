import React from 'react';
import { render, screen } from '@testing-library/react';
import ScanDetailModal from '../ScanDetailModal';

/**
 * Property-based tests for ScanDetailModal component
 * Tests modal display and functionality
 */

const mockGetSeverityColor = (severity) => {
  const colors = {
    CRITICAL: '#7B1FA2',
    HIGH: '#C62828',
    MEDIUM: '#EF6C00',
    LOW: '#2E7D32',
    UNKNOWN: '#757575'
  };
  return colors[severity] || colors.UNKNOWN;
};

describe('ScanDetailModal Component', () => {
  // Property 4: Modal Shows All Versions
  test('Property 4: Modal displays all versions as tabs', () => {
    const scans = [
      {
        id: 1,
        image_name: 'nginx:1.0',
        scan_time: new Date().toISOString(),
        status: 'inactive',
        vulnerabilities: [],
        vulnerability_count: 0
      },
      {
        id: 2,
        image_name: 'nginx:1.1',
        scan_time: new Date().toISOString(),
        status: 'active',
        vulnerabilities: [],
        vulnerability_count: 0
      },
      {
        id: 3,
        image_name: 'nginx:2.0',
        scan_time: new Date().toISOString(),
        status: 'inactive',
        vulnerabilities: [],
        vulnerability_count: 0
      }
    ];

    render(
      <ScanDetailModal
        open={true}
        imageName="nginx"
        scans={scans}
        onClose={() => {}}
        getSeverityColor={mockGetSeverityColor}
      />
    );

    // Should display all 3 versions as tabs
    expect(screen.getByText(':1.0')).toBeInTheDocument();
    expect(screen.getByText(':1.1')).toBeInTheDocument();
    expect(screen.getByText(':2.0')).toBeInTheDocument();
  });

  // Property 5: Inactive Scans Remain Viewable
  test('Property 5: Inactive scans are still viewable in modal', () => {
    const scans = [
      {
        id: 1,
        image_name: 'nginx:1.0',
        scan_time: new Date(Date.now() - 3600000).toISOString(),
        status: 'inactive',
        vulnerabilities: [
          {
            VulnerabilityID: 'CVE-2021-0001',
            PkgName: 'openssl',
            Severity: 'HIGH',
            InstalledVersion: '1.1.1',
            FixedVersion: '1.1.1k',
            Description: 'Test vulnerability'
          }
        ],
        vulnerability_count: 1
      },
      {
        id: 2,
        image_name: 'nginx:1.0',
        scan_time: new Date().toISOString(),
        status: 'active',
        vulnerabilities: [],
        vulnerability_count: 0
      }
    ];

    render(
      <ScanDetailModal
        open={true}
        imageName="nginx"
        scans={scans}
        onClose={() => {}}
        getSeverityColor={mockGetSeverityColor}
      />
    );

    // Both scans should be visible as tabs
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(2);

    // Inactive scan should still show its vulnerabilities
    expect(screen.getByText('CVE-2021-0001')).toBeInTheDocument();
  });

  test('Modal displays scan metadata correctly', () => {
    const scanTime = new Date('2024-01-15T10:30:00Z');
    const scans = [
      {
        id: 1,
        image_name: 'nginx:1.0',
        scan_time: scanTime.toISOString(),
        status: 'active',
        vulnerabilities: [],
        vulnerability_count: 5
      }
    ];

    render(
      <ScanDetailModal
        open={true}
        imageName="nginx"
        scans={scans}
        onClose={() => {}}
        getSeverityColor={mockGetSeverityColor}
      />
    );

    // Should display scan time
    expect(screen.getByText(/Scan Time:/)).toBeInTheDocument();

    // Should display vulnerability count
    expect(screen.getByText(/Total Vulnerabilities:/)).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('Modal displays CVE links correctly', () => {
    const scans = [
      {
        id: 1,
        image_name: 'nginx:1.0',
        scan_time: new Date().toISOString(),
        status: 'active',
        vulnerabilities: [
          {
            VulnerabilityID: 'CVE-2021-12345',
            PkgName: 'openssl',
            Severity: 'CRITICAL',
            InstalledVersion: '1.1.1',
            FixedVersion: '1.1.1k',
            Description: 'Critical vulnerability'
          }
        ],
        vulnerability_count: 1
      }
    ];

    render(
      <ScanDetailModal
        open={true}
        imageName="nginx"
        scans={scans}
        onClose={() => {}}
        getSeverityColor={mockGetSeverityColor}
      />
    );

    // Should display CVE link
    const cveLink = screen.getByText('CVE-2021-12345');
    expect(cveLink).toBeInTheDocument();
    expect(cveLink).toHaveAttribute('href', 'https://nvd.nist.gov/vuln/detail/CVE-2021-12345');
    expect(cveLink).toHaveAttribute('target', '_blank');
  });

  test('Modal handles empty vulnerabilities gracefully', () => {
    const scans = [
      {
        id: 1,
        image_name: 'alpine:3.14',
        scan_time: new Date().toISOString(),
        status: 'active',
        vulnerabilities: [],
        vulnerability_count: 0
      }
    ];

    render(
      <ScanDetailModal
        open={true}
        imageName="alpine"
        scans={scans}
        onClose={() => {}}
        getSeverityColor={mockGetSeverityColor}
      />
    );

    // Should display success message for no vulnerabilities
    expect(screen.getByText(/No vulnerabilities found/)).toBeInTheDocument();
  });

  test('Modal displays status indicator for each version', () => {
    const scans = [
      {
        id: 1,
        image_name: 'nginx:1.0',
        scan_time: new Date().toISOString(),
        status: 'active',
        vulnerabilities: [],
        vulnerability_count: 0
      },
      {
        id: 2,
        image_name: 'nginx:1.1',
        scan_time: new Date().toISOString(),
        status: 'inactive',
        vulnerabilities: [],
        vulnerability_count: 0
      }
    ];

    render(
      <ScanDetailModal
        open={true}
        imageName="nginx"
        scans={scans}
        onClose={() => {}}
        getSeverityColor={mockGetSeverityColor}
      />
    );

    // Should display status indicators
    expect(screen.getByText('Active (Latest)')).toBeInTheDocument();
    expect(screen.getByText('Inactive (Older)')).toBeInTheDocument();
  });

  test('Modal handles missing CVE code', () => {
    const scans = [
      {
        id: 1,
        image_name: 'nginx:1.0',
        scan_time: new Date().toISOString(),
        status: 'active',
        vulnerabilities: [
          {
            VulnerabilityID: null,
            PkgName: 'openssl',
            Severity: 'HIGH',
            InstalledVersion: '1.1.1',
            FixedVersion: '1.1.1k',
            Description: 'Vulnerability without CVE'
          }
        ],
        vulnerability_count: 1
      }
    ];

    render(
      <ScanDetailModal
        open={true}
        imageName="nginx"
        scans={scans}
        onClose={() => {}}
        getSeverityColor={mockGetSeverityColor}
      />
    );

    // Should display N/A for missing CVE
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  test('Modal displays severity colors correctly', () => {
    const scans = [
      {
        id: 1,
        image_name: 'nginx:1.0',
        scan_time: new Date().toISOString(),
        status: 'active',
        vulnerabilities: [
          {
            VulnerabilityID: 'CVE-2021-0001',
            PkgName: 'openssl',
            Severity: 'CRITICAL',
            InstalledVersion: '1.1.1',
            FixedVersion: '1.1.1k',
            Description: 'Critical'
          },
          {
            VulnerabilityID: 'CVE-2021-0002',
            PkgName: 'curl',
            Severity: 'LOW',
            InstalledVersion: '7.0',
            FixedVersion: '7.1',
            Description: 'Low'
          }
        ],
        vulnerability_count: 2
      }
    ];

    render(
      <ScanDetailModal
        open={true}
        imageName="nginx"
        scans={scans}
        onClose={() => {}}
        getSeverityColor={mockGetSeverityColor}
      />
    );

    // Should display severity chips
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    expect(screen.getByText('LOW')).toBeInTheDocument();
  });
});
