/**
 * JavaScript Wrapper Generator
 *
 * Generates a wrapper that:
 * 1. Defines the user's function
 * 2. Calls it with test case input
 * 3. Prints the RETURN value as JSON
 */

/**
 * Generate JavaScript wrapper code
 *
 * @param {string} userCode - User's function code
 * @param {string} functionName - Name of the function to call
 * @param {Array} inputs - Array of input values for the function
 * @returns {string} - Complete wrapper code
 */
export function generateJSWrapper(userCode, functionName, inputs) {
  // Parse inputs and create argument string
  const args = inputs
    .map((input) => {
      // Input is already a JSON string; parse and re-stringify for safety
      try {
        const parsed = JSON.parse(input);
        return JSON.stringify(parsed);
      } catch {
        // If not valid JSON, treat as string
        return JSON.stringify(input);
      }
    })
    .join(', ');

  return `
// ==================== USER CODE START ====================
${userCode}
// ==================== USER CODE END ====================

// ==================== JUDGE WRAPPER ====================
(function() {
  try {
    // Call user's function with test case inputs
    const result = ${functionName}(${args});
    
    // Print the return value as JSON for comparison
    console.log(JSON.stringify(result));
  } catch (error) {
    // Print error for debugging
    console.error('RUNTIME_ERROR:', error.message);
    process.exit(1);
  }
})();
`;
}

export default { generateJSWrapper };
