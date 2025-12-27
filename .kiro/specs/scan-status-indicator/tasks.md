# Implementation Plan: Scan Status Indicator

## Overview

This implementation plan breaks down the scan status indicator feature into discrete coding tasks. The approach focuses on backend status determination, then frontend visual indicators and modal implementation.

## Tasks

- [x] 1. Create status service in backend
  - Create `StatusService` class with status determination logic
  - Implement `get_scan_status()` to determine active/inactive status
  - Implement `mark_latest_scans()` to update status flags
  - _Requirements: 1.1, 1.3, 2.1_

- [x]* 1.1 Write property tests for status service
  - **Property 1: Single Active Scan per Version**
  - **Property 2: Inactive Scans are Older**
  - **Validates: Requirements 1.1, 2.1**

- [x] 2. Create new API endpoint for scans with status
  - Create `GET /api/images/{image_name}/scans` endpoint
  - Return all scans with status field
  - Sort by scan_time (newest first)
  - _Requirements: 1.1, 1.2, 3.1_

- [x] 3. Create StatusIndicator component
  - Create React component to display status badge
  - Implement active (green) and inactive (orange) styling
  - Add hover effects and tooltips
  - _Requirements: 1.1, 2.1, 2.2_

- [x] 4. Create ScanDetailModal component
  - Create modal component for detailed scan view
  - Implement tab-based layout (one tab per version)
  - Display scan_time and status for each version
  - _Requirements: 3.1, 3.2, 3.3_

- [x]* 4.1 Write property tests for modal component
  - **Property 4: Modal Shows All Versions**
  - **Property 5: Inactive Scans Remain Viewable**
  - **Validates: Requirements 3.1, 3.5**

- [x] 5. Update frontend to use status endpoint
  - Modify data fetching to use new status endpoint
  - Update data structure to include status field
  - Implement status-based styling in DataGrid
  - _Requirements: 1.1, 2.1, 2.2_

- [x] 6. Integrate StatusIndicator into DataGrid
  - Add status indicator to image name column
  - Display active/inactive status visually
  - Add click handler to open detail modal
  - _Requirements: 1.1, 2.1, 2.2_

- [x] 7. Implement modal opening on image click
  - Add click handler to image rows
  - Fetch detailed scan data
  - Open ScanDetailModal with data
  - _Requirements: 3.1, 3.2_

- [x] 8. Add vulnerability display in modal tabs
  - Display vulnerabilities for each version in tabs
  - Show vulnerability count per version
  - Include CVE codes and reference links
  - _Requirements: 3.3, 3.4, 4.1_

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all unit tests pass
  - Ensure all property tests pass
  - Verify status display and modal functionality

- [x] 10. Test status updates in real-time
  - Add new scan and verify status updates
  - Verify previous active scan becomes inactive
  - Verify modal reflects status changes
  - _Requirements: 1.4, 2.3_

- [x]* 10.1 Write integration tests
  - Test full status indicator flow
  - Test modal opening and closing
  - Test status updates on new scans

