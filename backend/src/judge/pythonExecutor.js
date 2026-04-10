/**
 * Python Wrapper Generator
 *
 * Generates a wrapper that:
 * 1. Defines the user's function
 * 2. Calls it with test case input
 * 3. Prints the RETURN value as JSON
 */

/**
 * Convert JSON value to Python literal
 *
 * @param {string} jsonInput - JSON string input
 * @returns {string} - Python literal representation
 */
function jsonToPythonLiteral(jsonInput) {
  try {
    const parsed = JSON.parse(jsonInput);
    return convertToPython(parsed);
  } catch {
    // If not valid JSON, treat as string
    return `"${jsonInput}"`;
  }
}

/**
 * Recursively convert JS value to Python literal
 */
function convertToPython(value) {
  if (value === null) return 'None';
  if (value === true) return 'True';
  if (value === false) return 'False';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    const items = value.map(convertToPython).join(', ');
    return `[${items}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value)
      .map(([k, v]) => `${JSON.stringify(k)}: ${convertToPython(v)}`)
      .join(', ');
    return `{${entries}}`;
  }
  return String(value);
}

/**
 * Generate Python wrapper code
 * 
 * @param {string} userCode - User's function code
 * @param {string} functionName - Name of the function to call
 * @param {Array} inputs - Array of input values for the function
 * @returns {string} - Complete wrapper code
 */
export function generatePythonWrapper(userCode, functionName, inputs) {
  // Convert inputs to Python literals
  const args = inputs.map(jsonToPythonLiteral).join(', ');

  return `
import json
import sys

# ==================== USER CODE START ====================
${userCode}
# ==================== USER CODE END ====================

# ==================== JUDGE WRAPPER ====================
if __name__ == "__main__":
    try:
        # Call user's function with test case inputs
        result = ${functionName}(${args})
        
        # Print the return value as JSON for comparison
        print(json.dumps(result))
    except Exception as e:
        print(f"RUNTIME_ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)
`;
}
export default { generatePythonWrapper };
