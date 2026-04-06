/**
 * Java Wrapper Generator & Executor
 * 
 * Generates a wrapper that:
 * 1. Includes the user's Solution class
 * 2. Creates Main class that calls user's method
 * 3. Compiles and runs the code
 * 4. Prints the RETURN value as JSON
 */

import { exec } from 'child_process';
import { writeFile, unlink, mkdir, rm } from 'fs/promises';
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

// Timeout for execution (10 seconds for Java - compile + run)
const EXECUTION_TIMEOUT = 10000;

/**
 * Convert JSON value to Java literal
 * 
 * @param {string} jsonInput - JSON string input
 * @param {string} type - Expected Java type (inferred or specified)
 * @returns {string} - Java literal representation
 */
function jsonToJavaLiteral(jsonInput) {
  try {
    const parsed = JSON.parse(jsonInput);
    return convertToJava(parsed);
  } catch {
    // If not valid JSON, treat as string
    return `"${jsonInput}"`;
  }
}

/**
 * Recursively convert JS value to Java literal
 */
function convertToJava(value) {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'string') return `"${value.replace(/"/g, '\\"')}"`;
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return String(value);
    return String(value); // Will be treated as double
  }
  if (Array.isArray(value)) {
    // Determine array type
    if (value.length === 0) return 'new int[]{}';
    
    const firstElement = value[0];
    if (typeof firstElement === 'number' && Number.isInteger(firstElement)) {
      // Integer array
      return `new int[]{${value.join(', ')}}`;
    } else if (typeof firstElement === 'number') {
      // Double array
      return `new double[]{${value.join(', ')}}`;
    } else if (typeof firstElement === 'string') {
      // String array
      const items = value.map(v => `"${String(v).replace(/"/g, '\\"')}"`).join(', ');
      return `new String[]{${items}}`;
    } else if (typeof firstElement === 'boolean') {
      // Boolean array
      return `new boolean[]{${value.join(', ')}}`;
    } else if (Array.isArray(firstElement)) {
      // 2D array
      if (typeof firstElement[0] === 'number' && Number.isInteger(firstElement[0])) {
        const rows = value.map(row => `{${row.join(', ')}}`).join(', ');
        return `new int[][]{${rows}}`;
      }
    }
    
    // Default: try as int array
    return `new int[]{${value.join(', ')}}`;
  }
  
  return String(value);
}

/**
 * Infer Java type from value
 */
function inferJavaType(value) {
  const parsed = JSON.parse(value);
  
  if (parsed === null) return 'Object';
  if (typeof parsed === 'boolean') return 'boolean';
  if (typeof parsed === 'string') return 'String';
  if (typeof parsed === 'number') {
    return Number.isInteger(parsed) ? 'int' : 'double';
  }
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) return 'int[]';
    const first = parsed[0];
    if (typeof first === 'number' && Number.isInteger(first)) return 'int[]';
    if (typeof first === 'number') return 'double[]';
    if (typeof first === 'string') return 'String[]';
    if (typeof first === 'boolean') return 'boolean[]';
    if (Array.isArray(first)) {
      if (typeof first[0] === 'number') return 'int[][]';
    }
    return 'int[]';
  }
  
  return 'Object';
}

/**
 * Generate Java result converter based on return type
 */
function getResultConverter(returnType) {
  if (returnType.endsWith('[][]')) {
    return 'Arrays.deepToString(result)';
  }
  if (returnType.endsWith('[]')) {
    return 'Arrays.toString(result)';
  }
  if (returnType === 'String') {
    return '"\\\"" + result + "\\\""';
  }
  if (returnType === 'boolean') {
    return 'String.valueOf(result)';
  }
  return 'String.valueOf(result)';
}

/**
 * Validate that user's Java code contains a Solution class
 * 
 * @param {string} code - User's Java code
 * @returns {{valid: boolean, error?: string}}
 */
function validateJavaCode(code) {
  // Check if code contains a Solution class
  const hasSolutionClass = /class\s+Solution\b/.test(code);
  
  // Check if code has a Main class (common mistake)
  const hasMainClass = /class\s+Main\b/.test(code);
  
  if (!hasSolutionClass) {
    if (hasMainClass) {
      return {
        valid: false,
        error: "Your code must define a 'class Solution', not 'class Main'. Please rename your class to 'Solution'."
      };
    }
    return {
      valid: false,
      error: "Your code must define a 'class Solution' containing the required method."
    };
  }
  
  return { valid: true };
}

/**
 * Sanitize user Java code to prevent conflicts
 * - Remove 'public' from class Solution declaration (only one public class allowed)
 * - Remove package declarations
 * - Remove main method from user code
 * 
 * @param {string} code - User's Java code
 * @returns {string} - Sanitized code
 */
function sanitizeJavaCode(code) {
  let sanitized = code;
  
  // Remove package declarations
  sanitized = sanitized.replace(/^\s*package\s+[\w.]+\s*;/gm, '');
  
  // Remove 'public' modifier from Solution class (keep just 'class Solution')
  // Because only one public class is allowed per file and we need Main to be public
  sanitized = sanitized.replace(/public\s+class\s+Solution/g, 'class Solution');
  
  // Remove any main method (public static void main)
  // This regex handles the main method with its entire body
  sanitized = sanitized.replace(
    /public\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\]\s*\w*\s*\)\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, 
    ''
  );
  
  // Also remove simpler main methods and testing comments
  sanitized = sanitized.replace(
    /\/\/\s*optional:?\s*for\s*local\s*testing[^\n]*/gi,
    ''
  );
  
  return sanitized.trim();
}

/**
 * Generate Java wrapper code
 * 
 * @param {string} userCode - User's Solution class code
 * @param {string} functionName - Name of the method to call
 * @param {Array} inputs - Array of input values for the method
 * @param {string} returnType - Return type of the method (optional, will be inferred)
 * @returns {string} - Complete wrapper code with Main class
 */
export function generateJavaWrapper(userCode, functionName, inputs, returnType = 'int') {
  // Sanitize user code first
  const sanitizedCode = sanitizeJavaCode(userCode);
  
  // Convert inputs to Java literals
  const args = inputs.map(jsonToJavaLiteral).join(', ');
  
  // Generate result converter based on return type
  const resultConverter = getResultConverter(returnType);

  return `
import java.util.*;

// ==================== USER CODE START ====================
${sanitizedCode}
// ==================== USER CODE END ====================

// ==================== JUDGE WRAPPER ====================
public class Main {
    public static void main(String[] args) {
        try {
            Solution solution = new Solution();
            ${returnType !== 'void' ? `var result = solution.${functionName}(${args});` : `solution.${functionName}(${args});`}
            ${returnType !== 'void' ? `System.out.println(${resultConverter});` : 'System.out.println("null");'}
        } catch (Exception e) {
            System.err.println("RUNTIME_ERROR: " + e.getMessage());
            System.exit(1);
        }
    }
}
`;
}

/**
 * Execute Java code and return the result
 * 
 * @param {string} userCode - User's Solution class code
 * @param {string} functionName - Name of the method to call
 * @param {Array} inputs - Array of input values
 * @param {string} returnType - Return type of the method
 * @returns {Promise<{success: boolean, output?: string, error?: string}>}
 */
export async function executeJava(userCode, functionName, inputs, returnType = 'int') {
  // First, validate that user code has a Solution class
  const validation = validateJavaCode(userCode);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
      type: 'compilation'
    };
  }
  
  const executionId = uuidv4();
  const execDir = join(TEMP_DIR, executionId);
  const mainFilePath = join(execDir, 'Main.java');
  
  try {
    // Ensure execution directory exists
    await mkdir(execDir, { recursive: true });
    
    // Generate wrapper code
    const wrapperCode = generateJavaWrapper(userCode, functionName, inputs, returnType);
    
    // Write Main.java
    await writeFile(mainFilePath, wrapperCode, 'utf8');
    
    // Compile Java code
    try {
      await execAsync(`javac "${mainFilePath}"`, {
        timeout: EXECUTION_TIMEOUT / 2,
        cwd: execDir,
      });
    } catch (compileError) {
      // Extract meaningful error message
      const errorMsg = compileError.stderr || compileError.message;
      const errorLines = errorMsg.split('\n');
      
      // Find the most relevant error line
      let relevantError = errorLines.find(line => 
        line.includes('error:') && !line.includes('Main.java')
      ) || errorLines.find(line => 
        line.includes('error:')
      ) || errorLines[0];
      
      // Clean up the error message - remove file paths for cleaner display
      relevantError = relevantError
        .replace(/^.*Main\.java:\d+:\s*/, '')  // Remove file path prefix
        .replace(/error:\s*/, '')              // Remove "error:" prefix
        .trim();
      
      // Check for specific errors and provide better messages
      if (errorMsg.includes('cannot find symbol') && errorMsg.includes('class Solution')) {
        return {
          success: false,
          error: "Your code must define a 'class Solution' containing the required method.",
          type: 'compilation'
        };
      }
      
      if (errorMsg.includes('duplicate class')) {
        return {
          success: false,
          error: "Your code contains a duplicate class definition. Make sure you only have 'class Solution'.",
          type: 'compilation'
        };
      }
      
      return {
        success: false,
        error: `Compilation Error: ${relevantError}`,
        type: 'compilation'
      };
    }
    
    // Run compiled Java code
    const { stdout, stderr } = await execAsync(`java -cp "${execDir}" Main`, {
      timeout: EXECUTION_TIMEOUT / 2,
      maxBuffer: 1024 * 1024,
    });
    
    // Check for runtime errors
    if (stderr && stderr.includes('RUNTIME_ERROR:')) {
      return {
        success: false,
        error: stderr.replace('RUNTIME_ERROR:', '').trim(),
        type: 'runtime'
      };
    }
    
    // Normalize Java array output to JSON format
    let output = stdout.trim();
    output = normalizeJavaOutput(output);
    
    return {
      success: true,
      output
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
    // Cleanup execution directory
    try {
      await rm(execDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Normalize Java output to JSON format for comparison
 */
function normalizeJavaOutput(output) {
  // Java arrays are printed as [1, 2, 3] which is valid JSON
  // 2D arrays are printed as [[1, 2], [3, 4]] which is also valid JSON
  // Just need to handle edge cases
  
  // Remove any trailing newlines or whitespace
  output = output.trim();
  
  // Java's Arrays.toString() format is already close to JSON
  // Just validate it's parseable, otherwise return as-is
  try {
    JSON.parse(output);
    return output;
  } catch {
    // Not valid JSON, return as-is
    return output;
  }
}

export default { generateJavaWrapper, executeJava };
