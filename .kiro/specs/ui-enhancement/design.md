# Design Document: UI Enhancement

## Overview

This design implements visual improvements to the dashboard including a vibrant color scheme, improved visual hierarchy, column resizing functionality, and overall UI polish. The goal is to create a modern, engaging interface that is both functional and aesthetically pleasing.

## Architecture

### Color System

```
Primary Colors (Severity)
├── CRITICAL: #7B1FA2 (Purple)
├── HIGH: #C62828 (Red)
├── MEDIUM: #EF6C00 (Orange)
├── LOW: #2E7D32 (Green)
└── UNKNOWN: #757575 (Gray)

Status Colors
├── Active: #4CAF50 (Bright Green)
├── Inactive: #FF9800 (Orange)
└── Neutral: #2196F3 (Blue)

Background Colors
├── Primary Background: #F5F5F5 (Light Gray)
├── Card Background: #FFFFFF (White)
├── Hover: #EEEEEE (Lighter Gray)
└── Accent: #E3F2FD (Light Blue)
```

### Column Resizing Architecture

```
DataGrid Component
    ↓
Column Header with Resize Handle
    ↓
Mouse Down Event
    ↓
Track Mouse Movement
    ↓
Update Column Width
    ↓
Persist Width (localStorage)
    ↓
Mouse Up Event
```

## Components and Interfaces

### Frontend Components

#### 1. EnhancedDataGrid Component
```javascript
<EnhancedDataGrid
  columns={Column[]}
  rows={Row[]}
  onColumnResize={handler}
  resizableColumns={true}
/>
```

#### 2. ColoredChip Component
```javascript
<ColoredChip
  severity={string}
  label={string}
  variant="filled" | "outlined"
/>
```

#### 3. StatusBadge Component
```javascript
<StatusBadge
  status="active" | "inactive"
  label={string}
/>
```

#### 4. ResizableColumn Component
```javascript
<ResizableColumn
  width={number}
  onResize={handler}
  minWidth={number}
  maxWidth={number}
/>
```

### Styling System

#### 1. Theme Configuration
```javascript
const theme = createTheme({
  palette: {
    primary: { main: '#2196F3' },
    secondary: { main: '#FF9800' },
    success: { main: '#4CAF50' },
    error: { main: '#C62828' },
    warning: { main: '#EF6C00' },
    info: { main: '#2196F3' }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 600, fontSize: '2rem' },
    h6: { fontWeight: 600, fontSize: '1.25rem' },
    body1: { fontSize: '0.95rem' }
  }
});
```

#### 2. Spacing System
```css
/* Consistent spacing */
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px
```

## Data Models

### Column Configuration
```json
{
  "field": "image_name",
  "headerName": "Image Name",
  "width": 300,
  "minWidth": 150,
  "maxWidth": 600,
  "resizable": true,
  "sortable": true,
  "filterable": true
}
```

### Persisted Column Widths
```json
{
  "image_name": 350,
  "scan_time": 200,
  "total_vulns": 180,
  "vulnerabilities": 450
}
```

## Visual Design Specifications

### Typography Hierarchy
```
H4: Dashboard Title (2rem, bold)
H6: Section Headers (1.25rem, bold)
Body1: Content Text (0.95rem, regular)
Caption: Metadata (0.75rem, regular)
```

### Spacing Guidelines
- Card padding: 16px
- Row padding: 8px
- Column gap: 16px
- Section margin: 24px

### Shadow Depths
- Elevation 1: 0px 2px 4px rgba(0,0,0,0.1)
- Elevation 2: 0px 4px 8px rgba(0,0,0,0.15)
- Elevation 3: 0px 8px 16px rgba(0,0,0,0.2)

### Border Radius
- Small: 4px
- Medium: 8px
- Large: 12px

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do.

### Property 1: Severity Color Consistency
**For any** vulnerability displayed, the color used should match the severity level consistently across all UI components (chips, badges, rows).

**Validates: Requirements 1.2, 1.3**

### Property 2: Column Width Persistence
**For any** column resized by the user, the new width should be persisted to localStorage and restored on page reload.

**Validates: Requirements 3.1, 3.2**

### Property 3: Column Width Constraints
**For any** resized column, the width should remain within the specified minWidth and maxWidth bounds.

**Validates: Requirements 3.4, 3.5**

### Property 4: Visual Hierarchy Consistency
**For any** page view, the visual hierarchy should be maintained with image names prominent, vulnerability counts secondary, and metadata tertiary.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 5: Responsive Layout
**For any** screen size, the dashboard should maintain usability with proper spacing, alignment, and readability.

**Validates: Requirements 4.1, 4.2, 4.3**

## Error Handling

1. **Column Resize Failure**: Revert to previous width
2. **localStorage Unavailable**: Use session storage as fallback
3. **Invalid Width Value**: Apply default width
4. **Theme Loading Failure**: Use fallback theme

## Testing Strategy

### Unit Tests
- Test color mapping for severities
- Test column width persistence
- Test width constraint validation
- Test theme application

### Property-Based Tests
- **Property 1**: Generate random severities, verify color consistency
- **Property 2**: Generate column resizes, verify persistence
- **Property 3**: Generate resize attempts, verify constraints
- **Property 4**: Generate layouts, verify hierarchy
- **Property 5**: Generate screen sizes, verify responsiveness

### Integration Tests
- Test full UI rendering with new theme
- Test column resizing in DataGrid
- Test color display across all components
- Test responsive behavior on different devices
- Test localStorage persistence

### Visual Regression Tests
- Compare UI snapshots before/after changes
- Verify color accuracy
- Verify spacing consistency
- Verify typography hierarchy

