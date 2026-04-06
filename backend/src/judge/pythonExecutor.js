/**
 * Python Wrapper Generator & Executor
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
 * Convert Python output back to JSON-comparable format
 * 
 * @param {string} pythonOutput - Raw Python output
 * @returns {string} - JSON string
 */
function pythonOutputToJSON(pythonOutput) {
  // Python outputs True/False/None, convert to JSON
  let normalized = pythonOutput
    .replace(/True/g, 'true')
    .replace(/False/g, 'false')
    .replace(/None/g, 'null')
    .replace(/'/g, '"'); // Python uses single quotes for strings
  
  return normalized;
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

/**
 * Execute Python code and return the result
 * 
 * @param {string} userCode - User's function code
 * @param {string} functionName - Name of the function to call
 * @param {Array} inputs - Array of input values
 * @returns {Promise<{success: boolean, output?: string, error?: string}>}
 */
export async function executePython(userCode, functionName, inputs) {
  const executionId = uuidv4();
  const filePath = join(TEMP_DIR, `${executionId}.py`);
  
  try {
    // Ensure temp directory exists
    await mkdir(TEMP_DIR, { recursive: true });
    
    // Generate wrapper code
    const wrapperCode = generatePythonWrapper(userCode, functionName, inputs);
    
    // Write to temp file
    await writeFile(filePath, wrapperCode, 'utf8');
    
    // Execute with Python (try python3 first, then python)
    let result;
    try {
      result = await execAsync(`python "${filePath}"`, {
        timeout: EXECUTION_TIMEOUT,
        maxBuffer: 1024 * 1024,
      });
    } catch (pythonError) {
      // If python command fails, try python3
      if (pythonError.code === 'ENOENT') {
        result = await execAsync(`python3 "${filePath}"`, {
          timeout: EXECUTION_TIMEOUT,
          maxBuffer: 1024 * 1024,
        });
      } else {
        throw pythonError;
      }
    }
    
    const { stdout, stderr } = result;
    
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
    // Handle different error types
    if (error.killed) {
      return {
        success: false,
        error: 'Time Limit Exceeded',
        type: 'timeout'
      };
    }
    
    // Python syntax errors
    if (error.stderr && error.stderr.includes('SyntaxError')) {
      const syntaxMatch = error.stderr.match(/SyntaxError: (.+)/);
      return {
        success: false,
        error: `Syntax Error: ${syntaxMatch ? syntaxMatch[1] : 'Invalid syntax'}`,
        type: 'compilation'
      };
    }
    
    if (error.stderr && error.stderr.includes('RUNTIME_ERROR:')) {
      return {
        success: false,
        error: error.stderr.replace('RUNTIME_ERROR:', '').trim(),
        type: 'runtime'
      };
    }
    
    return {
      success: false,
      error: error.stderr || error.message,
      type: 'execution'
    };
    
  } finally {
    // Cleanup temp file
    try {
      await unlink(filePath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

export default { generatePythonWrapper, executePython };
