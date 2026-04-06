/**
 * Output Comparator Utility
 * 
 * Compares expected output with user's output using:
 * 1. Whitespace normalization
 * 2. Number normalization
 * 3. JSON deep comparison for arrays/objects
 */

/**
 * Normalize output for comparison
 * 
 * @param {string} output - Raw output string
 * @returns {string} - Normalized output
 */
export function normalizeOutput(output) {
  if (output === undefined || output === null) {
    return 'null';
  }
  
  // Trim whitespace
  let normalized = String(output).trim();
  
  // Try to parse as JSON and re-stringify for consistent formatting
  try {
    const parsed = JSON.parse(normalized);
    normalized = JSON.stringify(parsed);
  } catch {
    // Not JSON, keep as-is
  }
  
  return normalized;
}

/**
 * Parse output to a comparable value
 * 
 * @param {string} output - Output string
 * @returns {any} - Parsed value
 */
function parseOutput(output) {
  const normalized = normalizeOutput(output);
  
  try {
    return JSON.parse(normalized);
  } catch {
    // Return as string if not valid JSON
    return normalized;
  }
}

/**
 * Deep compare two values
 * 
 * @param {any} expected - Expected value
 * @param {any} actual - Actual value
 * @returns {boolean} - True if equal
 */
function deepCompare(expected, actual) {
  // Handle null/undefined
  if (expected === null && actual === null) return true;
  if (expected === undefined && actual === undefined) return true;
  if (expected === null || actual === null) return false;
  if (expected === undefined || actual === undefined) return false;
  
  // Handle primitives
  if (typeof expected !== typeof actual) {
    // Allow number comparison with string representation
    if (typeof expected === 'number' && typeof actual === 'string') {
      return expected === parseFloat(actual);
    }
    if (typeof expected === 'string' && typeof actual === 'number') {
      return parseFloat(expected) === actual;
    }
    return false;
  }
  
  // Numbers - handle floating point comparison
  if (typeof expected === 'number') {
    // Allow small epsilon for floating point
    if (Math.abs(expected - actual) < 1e-9) return true;
    return expected === actual;
  }
  
  // Strings
  if (typeof expected === 'string') {
    return expected === actual;
  }
  
  // Booleans
  if (typeof expected === 'boolean') {
    return expected === actual;
  }
  
  // Arrays
  if (Array.isArray(expected) && Array.isArray(actual)) {
    if (expected.length !== actual.length) return false;
    for (let i = 0; i < expected.length; i++) {
      if (!deepCompare(expected[i], actual[i])) return false;
    }
    return true;
  }
  
  // Objects
  if (typeof expected === 'object' && typeof actual === 'object') {
    const expectedKeys = Object.keys(expected);
    const actualKeys = Object.keys(actual);
    
    if (expectedKeys.length !== actualKeys.length) return false;
    
    for (const key of expectedKeys) {
      if (!actualKeys.includes(key)) return false;
      if (!deepCompare(expected[key], actual[key])) return false;
    }
    return true;
  }
  
  return false;
}

/**
 * Compare expected output with user's output
 * 
 * @param {string} expected - Expected output string
 * @param {string} actual - User's output string
 * @returns {boolean} - True if outputs match
 */
export function compareOutputs(expected, actual) {
  // Normalize both outputs
  const normalizedExpected = normalizeOutput(expected);
  const normalizedActual = normalizeOutput(actual);
  
  // Direct string comparison first
  if (normalizedExpected === normalizedActual) {
    return true;
  }
  
  // Parse and deep compare
  const parsedExpected = parseOutput(expected);
  const parsedActual = parseOutput(actual);
  
  return deepCompare(parsedExpected, parsedActual);
}

/**
 * Format output for display
 * 
 * @param {string} output - Raw output
 * @returns {string} - Formatted output for display
 */
export function formatOutputForDisplay(output) {
  if (output === undefined || output === null) {
    return 'null';
  }
  
  try {
    const parsed = JSON.parse(output);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return String(output);
  }
}

export default { normalizeOutput, compareOutputs, formatOutputForDisplay };
