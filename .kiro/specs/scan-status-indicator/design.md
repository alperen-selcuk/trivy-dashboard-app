# Design Document: Scan Status Indicator

## Overview

This design implements visual status indicators for scan results, distinguishing between active (latest) and inactive (older) scans. Users can click on images to view detailed scan information in a modal, with clear visual feedback about scan freshness and status.

## Architecture

### Status Determination Flow

```
Scan Data
    ↓
Group by Image + Version
    ↓
For Each Version: Find Latest Scan by scan_time
    ↓
Mark as Active (latest) or Inactive (older)
    ↓
Apply Visual Styling
    ↓
Display in UI
```

### Modal Detail View Flow

```
User Clicks Image
    ↓
Fetch All Scans for Image
    ↓
Group by Version
    ↓
Sort by scan_time (newest first)
    ↓
Display in Tabs (one per version)
    ↓
Show Active/Inactive Status
```

## Components and Interfaces

### Frontend Components

#### 1. StatusIndicator Component
```javascript
<StatusIndicator 
  status="active" | "inactive"
  scanTime={Date}
  onClick={handler}
/>
```

#### 2. ScanDetailModal Component
```javascript
<ScanDetailModal
  image={ImageData}
  scans={ScanData[]}
  onClose={handler}
/>
```

#### 3. VersionTab Component
```javascript
<VersionTab
  version={string}
  scanTime={Date}
  status="active" | "inactive"
  vulnerabilities={Vulnerability[]}
/>
```

### Backend Components

#### 1. Status Service
```python
class StatusService:
    def get_scan_status(scan: ScanResult) -> str
    def mark_latest_scans(image_name: str) -> None
    def get_scans_by_image(image_name: str) -> List[ScanResult]
```

#### 2. Enhanced API Endpoints
- `GET /api/images/{image_name}/scans` - Returns all scans with status
- `GET /api/images/{image_name}/latest-scan` - Returns only latest scan

## Data Models

### Scan with Status
```json
{
  "id": 1,
  "image_name": "nginx:1.19",
  "scan_time": "2024-01-15T10:30:00Z",
  "status": "active",
  "vulnerabilities": [...],
  "vulnerability_count": 15
}
```

### Image with Versions
```json
{
  "image_name": "nginx",
  "versions": [
    {
      "tag": "1.19",
      "scans": [
        {
          "scan_time": "2024-01-15T10:30:00Z",
          "status": "active",
          "vulnerability_count": 15
        },
        {
          "scan_time": "2024-01-14T10:30:00Z",
          "status": "inactive",
          "vulnerability_count": 15
        }
      ]
    }
  ]
}
```

## Visual Design

### Status Colors
- **Active**: Bright Green (#4CAF50) - Latest scan
- **Inactive**: Orange (#FF9800) - Older scans
- **Unknown**: Gray (#9E9E9E) - No status

### Status Indicator Styling
```css
.status-active {
  background-color: #4CAF50;
  border: 2px solid #45a049;
  opacity: 1;
}

.status-inactive {
  background-color: #FF9800;
  border: 2px solid #e68900;
  opacity: 0.7;
}

.scan-row-active {
  background-color: rgba(76, 175, 80, 0.1);
}

.scan-row-inactive {
  background-color: rgba(255, 152, 0, 0.05);
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do.

### Property 1: Single Active Scan per Version
**For any** image version, exactly one scan should be marked as active (the one with the most recent scan_time).

**Validates: Requirements 1.1, 1.3**

### Property 2: Inactive Scans are Older
**For any** scan marked as inactive, there should exist another scan for the same version with a more recent scan_time.

**Validates: Requirements 2.1, 2.2**

### Property 3: Status Update on New Scan
**For any** image version, when a new scan is added with a more recent scan_time, the previous active scan should become inactive and the new scan should become active.

**Validates: Requirements 1.4, 2.3**

### Property 4: Modal Shows All Versions
**For any** image, when the detail modal opens, it should display all versions that have scans, grouped by version tag.

**Validates: Requirements 3.1, 3.2**

### Property 5: Inactive Scans Remain Viewable
**For any** inactive scan, the detail modal should still display its vulnerability information with an inactive status indicator.

**Validates: Requirements 3.5**

## Error Handling

1. **No Scans for Image**: Display "No scans available" message
2. **Modal Open Failure**: Display error toast notification
3. **Status Determination Failure**: Default to "unknown" status
4. **Timestamp Parsing Error**: Log error and use current time

## Testing Strategy

### Unit Tests
- Test status determination logic with various timestamps
- Test single vs. multiple scans per version
- Test status update when new scan is added
- Test modal data grouping and sorting

### Property-Based Tests
- **Property 1**: Generate random scans, verify exactly one active per version
- **Property 2**: Generate inactive scans, verify older than active
- **Property 3**: Generate new scan, verify status transitions
- **Property 4**: Generate multi-version data, verify modal completeness
- **Property 5**: Generate inactive scans, verify viewability

### Integration Tests
- Test status display in main grid
- Test modal opening and closing
- Test status updates in real-time
- Test with multiple concurrent scans

