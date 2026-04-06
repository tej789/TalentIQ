/**
 * JavaScript Wrapper Generator & Executor
 * 
 * Generates a wrapper that:
 * 1. Defines the user's function
 * 2. Calls it with test case input
 * 3. Prints the RETURN value as JSON
 */

import { exec } from 'child_process';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Get directory of this file for consistent temp path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Temp directory for execution files (relative to this file, not cwd)
const TEMP_DIR = join(__dirname, '..', '..', 'temp', 'judge');

// Timeout for execution (5 seconds)
const EXECUTION_TIMEOUT = 5000;

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
      return JSON.stringify(parsed);
    } catch {
      // If not valid JSON, treat as string
      return JSON.stringify(input);
    }
  }).join(', ');

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

/**
 * Execute JavaScript code and return the result
 * 
 * @param {string} userCode - User's function code
 * @param {string} functionName - Name of the function to call
 * @param {Array} inputs - Array of input values
 * @returns {Promise<{success: boolean, output?: string, error?: string}>}
 */
export async function executeJS(userCode, functionName, inputs) {
  console.log('🟢 JS Executor called with:', { functionName, inputCount: inputs?.length });
  
  const executionId = uuidv4();
  const filePath = join(TEMP_DIR, `${executionId}.js`);
  
  try {
    console.log('📁 Creating temp directory:', TEMP_DIR);
    // Ensure temp directory exists
    await mkdir(TEMP_DIR, { recursive: true });
    
    console.log('📝 Generating wrapper code...');
    // Generate wrapper code
    const wrapperCode = generateJSWrapper(userCode, functionName, inputs);
    
    console.log('💾 Writing to temp file:', filePath);
    // Write to temp file
    await writeFile(filePath, wrapperCode, 'utf8');
    
    console.log('▶️ Executing Node.js...');
    // Execute with Node.js
    const { stdout, stderr } = await execAsync(`node "${filePath}"`, {
      timeout: EXECUTION_TIMEOUT,
      maxBuffer: 1024 * 1024, // 1MB buffer
    });
    
    console.log('✅ Execution complete. stdout:', stdout, 'stderr:', stderr);
    
    // Check for runtime errors
    if (stderr && stderr.includes('RUNTIME_ERROR:')) {
      return {
        success: false,
        error: stderr.replace('RUNTIME_ERROR:', '').trim(),
        type: 'runtime'
      };
    }
    
    return {
      success: true,
      output: stdout.trim()
    };
    
  } catch (error) {
    console.error('❌ JS Executor error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      killed: error.killed,
      stderr: error.stderr,
      stdout: error.stdout
    });
    
    // Handle different error types
    if (error.killed) {
      return {
        success: false,
        error: 'Time Limit Exceeded',
        type: 'timeout'
      };
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
