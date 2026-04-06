/**
 * Input Parser Utility
 * 
 * Parses various input formats into function arguments.
 * Supports:
 * - JSON format: {"nums": [1,2,3], "target": 9}
 * - Human-readable: "nums = [1,2,3], target = 9"
 * - Line-separated: "[1,2,3]\n9"
 * - Single values: "[1,2,3]" or "9"
 */

/**
 * Parse a single value to JSON string
 * 
 * @param {string} value - Raw value string
 * @returns {string} - JSON string representation
 */
function parseValue(value) {
  if (!value) return 'null';
  
  let trimmed = value.trim();
  
  // Remove trailing comma
  trimmed = trimmed.replace(/,\s*$/, '');
  
  // Try direct JSON parse
  try {
    JSON.parse(trimmed);
    return trimmed;
  } catch {}
  
  // Convert Python-style to JSON
  let converted = trimmed
    .replace(/'/g, '"')
    .replace(/True/g, 'true')
    .replace(/False/g, 'false')
    .replace(/None/g, 'null');
  
  try {
    JSON.parse(converted);
    return converted;
  } catch {}
  
  // Handle unquoted strings
  if (!trimmed.startsWith('"') && !trimmed.startsWith('[') && !trimmed.startsWith('{')) {
    // Check if it's a number
    if (!isNaN(Number(trimmed))) {
      return trimmed;
    }
    // Check if it's a boolean
    if (trimmed.toLowerCase() === 'true') return 'true';
    if (trimmed.toLowerCase() === 'false') return 'false';
    // It's a string
    return JSON.stringify(trimmed);
  }
  
  return converted;
}

/**
 * Parse input string to array of function arguments (as JSON strings)
 * 
 * @param {string} input - Raw input string
 * @returns {string[]} - Array of JSON-stringified arguments
 */
export function parseInputToArgs(input) {
  if (!input || typeof input !== 'string') {
    return [];
  }
  
  const trimmed = input.trim();
  
  // 1. Try JSON object format: {"nums": [1,2,3], "target": 9}
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null) {
      return Object.values(parsed).map(v => JSON.stringify(v));
    }
    // Single JSON value
    return [trimmed];
  } catch {}
  
  // 2. Try variable assignment format: "nums = [1,2,3], target = 9"
  //    This regex handles arrays and nested structures
  const assignmentRegex = /(\w+)\s*=\s*/g;
  const assignments = [];
  let match;
  const positions = [];
  
  while ((match = assignmentRegex.exec(trimmed)) !== null) {
    positions.push({
      varName: match[1],
      valueStart: match.index + match[0].length
    });
  }
  
  if (positions.length > 0) {
    for (let i = 0; i < positions.length; i++) {
      const start = positions[i].valueStart;
      const end = positions[i + 1]?.valueStart 
        ? findValueEnd(trimmed, start, positions[i + 1].valueStart - positions[i + 1].varName.length - 1)
        : trimmed.length;
      
      let value = trimmed.slice(start, end).trim();
      // Remove trailing comma
      value = value.replace(/,\s*$/, '');
      
      assignments.push(parseValue(value));
    }
    
    if (assignments.length > 0) {
      return assignments;
    }
  }
  
  // 3. Try newline-separated format
  if (trimmed.includes('\n')) {
    return trimmed
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(parseValue);
  }
  
  // 4. Single value
  return [parseValue(trimmed)];
}

/**
 * Find the end of a value in an assignment
 * Handles nested arrays and objects
 */
function findValueEnd(str, start, maxEnd) {
  let depth = 0;
  let inString = false;
  let stringChar = null;
  
  for (let i = start; i < maxEnd; i++) {
    const char = str[i];
    const prevChar = i > 0 ? str[i - 1] : '';
    
    if (inString) {
      if (char === stringChar && prevChar !== '\\') {
        inString = false;
      }
    } else {
      if (char === '"' || char === "'") {
        inString = true;
        stringChar = char;
      } else if (char === '[' || char === '{') {
        depth++;
      } else if (char === ']' || char === '}') {
        depth--;
      } else if (char === ',' && depth === 0) {
        return i;
      }
    }
  }
  
  return maxEnd;
}

/**
 * Validate that input can be parsed
 * 
 * @param {string} input - Input string
 * @returns {{valid: boolean, args?: string[], error?: string}}
 */
export function validateInput(input) {
  try {
    const args = parseInputToArgs(input);
    if (args.length === 0) {
      return { valid: false, error: 'No arguments found in input' };
    }
    
    // Validate each arg is valid JSON
    for (let i = 0; i < args.length; i++) {
      try {
        JSON.parse(args[i]);
      } catch (e) {
        return { valid: false, error: `Argument ${i + 1} is not valid JSON: ${args[i]}` };
      }
    }
    
    return { valid: true, args };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

export default { parseInputToArgs, validateInput };
