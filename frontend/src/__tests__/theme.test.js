import theme, { severityColors, statusColors, spacing } from '../theme';

/**
 * Property-based tests for theme configuration
 * Tests color consistency and theme structure
 */

describe('Theme Configuration', () => {
  // Property 1: Severity Color Consistency
  test('Property 1: All severity levels have consistent color definitions', () => {
    const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'];
    
    severities.forEach(severity => {
      // Each severity should have a color defined
      expect(severityColors[severity]).toBeDefined();
      
      // Color should be a valid hex color
      expect(severityColors[severity]).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });

  test('Property 1: Severity colors are unique', () => {
    const colors = Object.values(severityColors);
    const uniqueColors = new Set(colors);
    
    // All colors should be unique
    expect(uniqueColors.size).toBe(colors.length);
  });

  test('Property 1: Severity colors are used consistently in theme', () => {
    // Theme should reference severity colors
    expect(theme.palette.error.main).toBeDefined();
    expect(theme.palette.warning.main).toBeDefined();
    expect(theme.palette.success.main).toBeDefined();
  });

  describe('Status Colors', () => {
    test('Status colors are defined for all states', () => {
      const statuses = ['active', 'inactive', 'unknown'];
      
      statuses.forEach(status => {
        expect(statusColors[status]).toBeDefined();
        expect(statusColors[status]).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    test('Status colors are visually distinct', () => {
      const colors = Object.values(statusColors);
      const uniqueColors = new Set(colors);
      
      expect(uniqueColors.size).toBe(colors.length);
    });
  });

  describe('Typography Hierarchy', () => {
    test('Typography hierarchy is properly defined', () => {
      const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
      
      headings.forEach(heading => {
        expect(theme.typography[heading]).toBeDefined();
        expect(theme.typography[heading].fontSize).toBeDefined();
        expect(theme.typography[heading].fontWeight).toBeDefined();
      });
    });

    test('Heading font sizes decrease from h1 to h6', () => {
      const h1Size = parseInt(theme.typography.h1.fontSize);
      const h2Size = parseInt(theme.typography.h2.fontSize);
      const h3Size = parseInt(theme.typography.h3.fontSize);
      const h4Size = parseInt(theme.typography.h4.fontSize);
      const h5Size = parseInt(theme.typography.h5.fontSize);
      const h6Size = parseInt(theme.typography.h6.fontSize);
      
      expect(h1Size).toBeGreaterThan(h2Size);
      expect(h2Size).toBeGreaterThan(h3Size);
      expect(h3Size).toBeGreaterThan(h4Size);
      expect(h4Size).toBeGreaterThan(h5Size);
      expect(h5Size).toBeGreaterThan(h6Size);
    });

    test('Body text sizes are consistent', () => {
      expect(theme.typography.body1).toBeDefined();
      expect(theme.typography.body2).toBeDefined();
      
      const body1Size = parseInt(theme.typography.body1.fontSize);
      const body2Size = parseInt(theme.typography.body2.fontSize);
      
      expect(body1Size).toBeGreaterThan(body2Size);
    });
  });

  describe('Spacing System', () => {
    test('Spacing constants are defined', () => {
      expect(spacing.xs).toBe(4);
      expect(spacing.sm).toBe(8);
      expect(spacing.md).toBe(16);
      expect(spacing.lg).toBe(24);
      expect(spacing.xl).toBe(32);
    });

    test('Spacing values increase progressively', () => {
      expect(spacing.xs).toBeLessThan(spacing.sm);
      expect(spacing.sm).toBeLessThan(spacing.md);
      expect(spacing.md).toBeLessThan(spacing.lg);
      expect(spacing.lg).toBeLessThan(spacing.xl);
    });
  });

  describe('Theme Palette', () => {
    test('Primary palette is defined', () => {
      expect(theme.palette.primary.main).toBeDefined();
      expect(theme.palette.primary.light).toBeDefined();
      expect(theme.palette.primary.dark).toBeDefined();
    });

    test('Secondary palette is defined', () => {
      expect(theme.palette.secondary.main).toBeDefined();
      expect(theme.palette.secondary.light).toBeDefined();
      expect(theme.palette.secondary.dark).toBeDefined();
    });

    test('Background colors are defined', () => {
      expect(theme.palette.background.default).toBeDefined();
      expect(theme.palette.background.paper).toBeDefined();
    });

    test('All palette colors are valid hex colors', () => {
      const colorFields = ['primary', 'secondary', 'success', 'error', 'warning', 'info'];
      
      colorFields.forEach(field => {
        expect(theme.palette[field].main).toMatch(/^#[0-9A-F]{6}$/i);
        expect(theme.palette[field].light).toMatch(/^#[0-9A-F]{6}$/i);
        expect(theme.palette[field].dark).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });

  describe('Component Overrides', () => {
    test('Button component has custom styles', () => {
      expect(theme.components.MuiButton).toBeDefined();
      expect(theme.components.MuiButton.styleOverrides).toBeDefined();
    });

    test('Card component has custom styles', () => {
      expect(theme.components.MuiCard).toBeDefined();
      expect(theme.components.MuiCard.styleOverrides).toBeDefined();
    });

    test('Chip component has custom styles', () => {
      expect(theme.components.MuiChip).toBeDefined();
      expect(theme.components.MuiChip.styleOverrides).toBeDefined();
    });

    test('DataGrid component has custom styles', () => {
      expect(theme.components.MuiDataGrid).toBeDefined();
      expect(theme.components.MuiDataGrid.styleOverrides).toBeDefined();
    });
  });

  describe('Shape and Spacing', () => {
    test('Border radius is defined', () => {
      expect(theme.shape.borderRadius).toBe(8);
    });

    test('Default spacing is defined', () => {
      expect(theme.spacing).toBe(8);
    });
  });
});
