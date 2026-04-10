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
  const args = inputs.map(input => {
    // Input is already JSON string, parse and re-stringify for safety
    try {
      const parsed = JSON.parse(input);
      export default { generateJSWrapper };
    }
    
    if (error.code === 1) {
      return {
        success: false,
        error: error.stderr || error.message,
        type: 'runtime'
      };
    }
    
    return {
      success: false,
      error: error.message,
      type: 'execution'
    };
    
  } finally {
    // Cleanup temp file
    try {
      await unlink(filePath);
      console.log('🗑️ Cleaned up temp file');
    } catch (cleanupError) {
      console.log('⚠️ Cleanup warning:', cleanupError.message);
    }
  }
}

export default { generateJSWrapper, executeJS };
