# Requirements Document: Scan Status Indicator

## Introduction

The dashboard needs to visually distinguish between active (latest) and inactive (older) scans for each image version. When an image has multiple scan results, the most recent scan should be marked as active (highlighted), while older scans should be marked as inactive (grayed out). Users should be able to click on an image to view detailed scan results for all versions.

## Glossary

- **Active Scan**: The most recent scan for an image version, determined by scan_time
- **Inactive Scan**: Older scans for an image version that have been superseded by newer scans
- **Scan Status**: The state of a scan (active or inactive)
- **Scan Time**: The timestamp when a scan was performed
- **Image Version**: A specific tagged version of a Docker image
- **Detail View**: A modal or panel showing detailed vulnerability information for a specific image

## Requirements

### Requirement 1: Mark Active Scans

**User Story:** As a security analyst, I want to quickly identify the most recent scan for each image version, so that I can focus on current vulnerability data.

#### Acceptance Criteria

1. WHEN displaying image versions, THE Dashboard SHALL highlight the latest scan with an active status indicator
2. WHEN a scan is the most recent for its image version, THE Dashboard SHALL apply active styling (bright color, e.g., green)
3. WHEN multiple scans exist for an image version, THE Dashboard SHALL mark only the most recent as active
4. WHEN a new scan is added for an image version, THE Dashboard SHALL update the active status accordingly

### Requirement 2: Mark Inactive Scans

**User Story:** As a security analyst, I want to distinguish old scans from current ones, so that I don't accidentally focus on outdated data.

#### Acceptance Criteria

1. WHEN displaying image versions with multiple scans, THE Dashboard SHALL mark older scans with an inactive status indicator
2. WHEN a scan is not the most recent for its image version, THE Dashboard SHALL apply inactive styling (orange/gray color)
3. WHEN displaying inactive scans, THE Dashboard SHALL make them visually less prominent than active scans
4. WHEN a new scan becomes active, THE Dashboard SHALL automatically update the previous active scan to inactive status

### Requirement 3: Display Scan Details in Modal

**User Story:** As a security analyst, I want to view detailed vulnerability information for all scans of an image, so that I can compare results across versions and time.

#### Acceptance Criteria

1. WHEN clicking on an image, THE Dashboard SHALL open a detail view showing all versions and their scans
2. WHEN the detail view opens, THE Dashboard SHALL display scan_time for each scan
3. WHEN the detail view opens, THE Dashboard SHALL display active/inactive status for each scan
4. WHEN viewing scan details, THE Dashboard SHALL show vulnerabilities grouped by version and scan time
5. WHEN a scan is marked inactive, THE Dashboard SHALL still allow viewing its details but indicate it is outdated

### Requirement 4: Display CVE Information in Detail View

**User Story:** As a security analyst, I want to see CVE codes and reference links in the detail view, so that I can research vulnerabilities directly from the dashboard.

#### Acceptance Criteria

1. WHEN displaying vulnerability details in the modal, THE Dashboard SHALL show the CVE code if available
2. WHEN a CVE code is available, THE Dashboard SHALL display it as a clickable link
3. WHEN clicking a CVE link, THE Dashboard SHALL open the CVE reference page in a new tab
4. WHEN displaying CVE information, THE Dashboard SHALL include the reference URL (e.g., https://nvd.nist.gov/vuln/detail/CVE-XXXX-XXXXX)
5. WHEN a vulnerability does not have a CVE code, THE Dashboard SHALL display "N/A"
6. WHEN displaying vulnerability rows, THE Dashboard SHALL include CVE code and reference link columns

