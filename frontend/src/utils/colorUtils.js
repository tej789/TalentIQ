/**
 * Color Utility Functions
 * 
 * Generate dynamic color shades from base color for heatmap intensity levels.
 * Matches LeetCode's color progression system exactly.
 */

/**
 * Convert hex color to RGB values
 * 
 * @param {string} hex - Hex color (#RRGGBB or RRGGBB)
 * @returns {object} { r, g, b }
 */
export function hexToRgb(hex) {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return { r, g, b };
}

/**
 * Convert RGB to hex
 * 
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} Hex color (#RRGGBB)
 */
export function rgbToHex(r, g, b) {
  const toHex = (n) => {
    const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generate 5 intensity levels from base color (LeetCode-style)
 * 
 * Level 0: Empty cell (dark gray - matches LeetCode's empty state)
 * Level 1: 25% intensity - lightest color
 * Level 2: 50% intensity
 * Level 3: 75% intensity
 * Level 4: 100% intensity (full base color)
 * 
 * @param {string} baseColor - Base hex color (e.g., "#22c55e" for green)
 * @returns {Array<string>} Array of 5 hex colors
 */
export function generateColorIntensities(baseColor) {
  const rgb = hexToRgb(baseColor);
  
  // Level 0: Dark gray for empty cells (LeetCode uses ~#161b22 style)
  const level0 = "#161b22";
  
  // Level 1: Very light version (blend heavily with dark background)
  const level1 = rgbToHex(
    rgb.r * 0.15 + 22,
    rgb.g * 0.15 + 27,
    rgb.b * 0.15 + 34
  );
  
  // Level 2: Light-medium version
  const level2 = rgbToHex(
    rgb.r * 0.4 + 10,
    rgb.g * 0.4 + 15,
    rgb.b * 0.4 + 20
  );
  
  // Level 3: Medium-dark version
  const level3 = rgbToHex(
    rgb.r * 0.7,
    rgb.g * 0.7,
    rgb.b * 0.7
  );
  
  // Level 4: Full intensity (base color)
  const level4 = baseColor;
  
  return [level0, level1, level2, level3, level4];
}

/**
 * Get color for specific submission count
 * 
 * @param {number} count - Submission count
 * @param {string} baseColor - Base hex color
 * @returns {string} Hex color for the level
 */
export function getColorForCount(count, baseColor) {
  const colors = generateColorIntensities(baseColor);
  
  if (count === 0) return colors[0];
  if (count === 1) return colors[1];
  if (count <= 3) return colors[2];
  if (count <= 6) return colors[3];
  return colors[4]; // 7+
}

/**
 * Determine heatmap level from submission count (LeetCode thresholds)
 * 
 * @param {number} count - Number of submissions
 * @returns {number} Level (0-4)
 */
export function getHeatmapLevel(count) {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4; // 7+
}
