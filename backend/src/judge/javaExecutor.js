/**
 * Java Wrapper Generator
 *
 * Generates a wrapper that:
 * 1. Includes the user's Solution class
 * 2. Creates Main class that calls user's method
 * 3. Prints the RETURN value as JSON
 */

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

export default { generateJavaWrapper };
