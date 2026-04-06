/**
 * Judge Controller
 * 
 * Handles:
 * 1. POST /run - Execute against examples (visible test cases)
 * 2. POST /submit - Execute against hidden test cases
 * 
 * Supports: JavaScript, Python, Java
 */

import Problem from '../models/Problem.js';
import Submission from '../models/Submission.js';
import { executeJS } from './jsExecutor.js';
import { executePython } from './pythonExecutor.js';
import { executeJava } from './javaExecutor.js';
import { compareOutputs, normalizeOutput } from './outputComparator.js';
import { parseInputToArgs } from './inputParser.js';

/**
 * Extract function name from user code based on language
 * 
 * @param {string} code - User's code
 * @param {string} language - Programming language
 * @returns {string} - Function name
 */
function extractFunctionName(code, language) {
  let match;
  
  switch (language) {
    case 'javascript':
      // Match: function name() or const/let/var name = function or const/let/var name = () =>
      match = code.match(/function\s+(\w+)\s*\(/) ||
              code.match(/(?:const|let|var)\s+(\w+)\s*=\s*(?:function|\(|async)/) ||
              code.match(/(\w+)\s*=\s*\(.*\)\s*=>/);
      break;
      
    case 'python':
      // Match: def name(
      match = code.match(/def\s+(\w+)\s*\(/);
      break;
      
    case 'java':
      // Match: public returnType name( - skip main method
      const methods = code.matchAll(/public\s+(?:static\s+)?(\w+(?:\[\])?)\s+(\w+)\s*\(/g);
      for (const m of methods) {
        if (m[2] !== 'main') {
          return m[2];
        }
      }
      // Fallback: any method that's not main
      match = code.match(/(?:public|private|protected)?\s*(?:static\s+)?(?:\w+(?:\[\])?)\s+(\w+)\s*\([^)]*\)\s*{/);
      if (match && match[1] !== 'main') {
        return match[1];
      }
      break;
  }
  
  return match ? match[1] : 'solution';
}

/**
 * Infer return type from Java code
 * 
 * @param {string} code - Java code
 * @param {string} functionName - Function name
 * @returns {string} - Return type
 */
function inferJavaReturnType(code, functionName) {
  // Match: public returnType functionName(
  const regex = new RegExp(`public\\s+(?:static\\s+)?(\\w+(?:\\[\\])?(?:\\[\\])?)\\s+${functionName}\\s*\\(`);
  const match = code.match(regex);
  
  if (match) {
    return match[1];
  }
  
  return 'int'; // Default
}

/**
 * Execute code against a single test case
 * 
 * @param {string} code - User's code
 * @param {string} language - Programming language
 * @param {Array} inputs - Array of input strings
 * @param {string} functionName - Function to call
 * @param {string} returnType - Return type (for Java)
 * @returns {Promise<{success: boolean, output?: string, error?: string, type?: string}>}
 */
async function executeCode(code, language, inputs, functionName, returnType = 'int') {
  console.log(`🔧 Executing ${language} code, function: ${functionName}`);
  
  try {
    switch (language) {
      case 'javascript':
        console.log('📘 Calling JS executor...');
        const jsResult = await executeJS(code, functionName, inputs);
        console.log('📘 JS executor returned:', jsResult);
        return jsResult;
        
      case 'python':
        console.log('🐍 Calling Python executor...');
        return await executePython(code, functionName, inputs);
        
      case 'java':
        console.log('☕ Calling Java executor...');
        return await executeJava(code, functionName, inputs, returnType);
        
      default:
        return {
          success: false,
          error: `Unsupported language: ${language}`,
          type: 'unsupported'
        };
    }
  } catch (error) {
    console.error(`❌ Executor error for ${language}:`, error);
    return {
      success: false,
      error: `Executor crashed: ${error.message}`,
      type: 'execution'
    };
  }
}

/**
 * Parse input string to array of individual inputs
 * Uses the inputParser module for robust parsing
 * 
 * @param {string} inputStr - Input string from database
 * @returns {Array<string>} - Array of JSON input strings
 */
function parseInputs(inputStr) {
  return parseInputToArgs(inputStr);
}

/**
 * Find problem by ID or slug
 * 
 * @param {string} problemId - MongoDB ObjectId or slug
 * @returns {Promise<Problem|null>}
 */
async function findProblem(problemId) {
  // Check if it's a valid MongoDB ObjectId
  if (problemId.match(/^[0-9a-fA-F]{24}$/)) {
    return Problem.findById(problemId);
  }
  // Otherwise, search by slug
  return Problem.findOne({ slug: problemId });
}

/**
 * RUN CODE - Execute against examples only
 * 
 * @route POST /api/judge/run
 * @body { problemId, code, language }
 * @returns { results: [{ input, expectedOutput, userOutput, passed, error? }] }
 */
export async function runCode(req, res) {
  try {
    const { problemId, code, language } = req.body;
    
    // Validate inputs
    if (!problemId || !code || !language) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: problemId, code, language'
      });
    }
    
    // Find problem (by ID or slug)
    const problem = await findProblem(problemId);
    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }
    
    // Get examples (visible test cases)
    const examples = problem.examples || [];
    if (examples.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No examples found for this problem'
      });
    }
    
    // Extract function name from code
    const functionName = extractFunctionName(code, language);
    
    // For Java, infer return type
    const returnType = language === 'java' 
      ? inferJavaReturnType(code, functionName) 
      : 'int';
    
    // Execute against each example
    const results = [];
    
    for (let i = 0; i < examples.length; i++) {
      const example = examples[i];
      const inputs = parseInputs(example.input);
      
      const execResult = await executeCode(
        code, 
        language, 
        inputs, 
        functionName,
        returnType
      );
      
      if (!execResult.success) {
        results.push({
          testCase: i + 1,
          input: example.input,
          expectedOutput: example.output,
          userOutput: null,
          passed: false,
          error: execResult.error,
          errorType: execResult.type
        });
      } else {
        const passed = compareOutputs(example.output, execResult.output);
        results.push({
          testCase: i + 1,
          input: example.input,
          expectedOutput: example.output,
          userOutput: normalizeOutput(execResult.output),
          passed
        });
      }
    }
    
    // Calculate overall status
    const allPassed = results.every(r => r.passed);
    const hasError = results.some(r => r.error);
    
    return res.json({
      success: true,
      status: hasError ? 'error' : (allPassed ? 'passed' : 'failed'),
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed && !r.error).length,
        errors: results.filter(r => r.error).length
      }
    });
    
  } catch (error) {
    console.error('Run code error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: `Internal server error: ${error.message}`
    });
  }
}

/**
 * SUBMIT CODE - Execute against hidden test cases
 * 
 * @route POST /api/judge/submit
 * @body { problemId, code, language }
 * @returns { verdict, failedTestCase?, passedCount, totalCount }
 */
export async function submitCode(req, res) {
  try {
    const { problemId, code, language } = req.body;
    const userId = req.user._id;
    
    // Validate inputs
    if (!problemId || !code || !language) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: problemId, code, language'
      });
    }
    
    // Find problem with hidden test cases (by ID or slug)
    const problem = await findProblem(problemId);
    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }
    
    // Get hidden test cases
    const testCases = problem.testCases || [];
    if (testCases.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No test cases found for this problem'
      });
    }
    
    // Extract function name from code
    const functionName = extractFunctionName(code, language);
    
    // For Java, infer return type
    const returnType = language === 'java' 
      ? inferJavaReturnType(code, functionName) 
      : 'int';
    
    // Execute against each test case - stop on first failure
    let passedCount = 0;
    let failedTestCase = null;
    let verdict = 'Accepted';
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const inputs = parseInputs(testCase.input);
      
      const execResult = await executeCode(
        code, 
        language, 
        inputs, 
        functionName,
        returnType
      );
      
      if (!execResult.success) {
        // Execution error
        verdict = execResult.type === 'timeout' 
          ? 'Time Limit Exceeded' 
          : execResult.type === 'compilation'
            ? 'Compilation Error'
            : 'Runtime Error';
        
        failedTestCase = {
          testCaseNumber: i + 1,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          userOutput: null,
          error: execResult.error
        };
        break;
      }
      
      // Compare outputs
      const passed = compareOutputs(testCase.expectedOutput, execResult.output);
      
      if (!passed) {
        verdict = 'Wrong Answer';
        failedTestCase = {
          testCaseNumber: i + 1,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          userOutput: normalizeOutput(execResult.output)
        };
        break;
      }
      
      passedCount++;
    }
    
    // Save submission to database
    const submission = new Submission({
      user: userId,
      problem: problem._id,  // Use the actual ObjectId, not the slug
      code,
      language,
      verdict,
      passedTestCases: passedCount,
      totalTestCases: testCases.length,
      submittedAt: new Date()
    });
    
    await submission.save();
    
    // Return result
    return res.json({
      success: true,
      verdict,
      passedCount,
      totalCount: testCases.length,
      failedTestCase: verdict !== 'Accepted' ? failedTestCase : null,
      submissionId: submission._id
    });
    
  } catch (error) {
    console.error('Submit code error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during code submission'
    });
  }
}

/**
 * Get submission history for a user
 * 
 * @route GET /api/judge/submissions/:problemId
 */
export async function getSubmissions(req, res) {
  try {
    const { problemId } = req.params;
    const userId = req.user._id;
    
    const submissions = await Submission.find({
      user: userId,
      problem: problemId
    })
      .sort({ submittedAt: -1 })
      .limit(20)
      .select('code language verdict passedTestCases totalTestCases submittedAt');
    
    return res.json({
      success: true,
      submissions
    });
    
  } catch (error) {
    console.error('Get submissions error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch submissions'
    });
  }
}

/**
 * SANDBOX EXECUTE - Run arbitrary code without test cases (for sessions)
 * 
 * @route POST /api/judge/execute
 * @body { code, language }
 * @returns { success, output?, error? }
 */
export async function sandboxExecute(req, res) {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: code, language',
      });
    }

    const supported = ['javascript', 'python', 'java'];
    if (!supported.includes(language)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported language: ${language}. Supported: ${supported.join(', ')}`,
      });
    }

    const result = await executeSandbox(code, language);

    return res.json(result);
  } catch (error) {
    console.error('Sandbox execute error:', error);
    return res.status(500).json({
      success: false,
      error: `Internal server error: ${error.message}`,
    });
  }
}

/**
 * Run raw code in a sandbox (no function wrapping, no test cases)
 */
async function executeSandbox(code, language) {
  const { exec } = await import('child_process');
  const { writeFile, unlink, mkdir } = await import('fs/promises');
  const { join, dirname } = await import('path');
  const { fileURLToPath } = await import('url');
  const { v4: uuidv4 } = await import('uuid');
  const { promisify } = await import('util');

  const execAsync = promisify(exec);
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const TEMP_DIR = join(currentDir, '..', '..', 'temp', 'judge');
  const TIMEOUT = 10000;

  await mkdir(TEMP_DIR, { recursive: true });
  const id = uuidv4();

  if (language === 'javascript') {
    const filePath = join(TEMP_DIR, `${id}.js`);
    try {
      await writeFile(filePath, code, 'utf8');
      const { stdout, stderr } = await execAsync(`node "${filePath}"`, {
        timeout: TIMEOUT,
        maxBuffer: 1024 * 1024,
      });
      return {
        success: true,
        output: stdout || 'No output',
        error: stderr || null,
      };
    } catch (err) {
      if (err.killed) return { success: false, error: 'Time Limit Exceeded' };
      return {
        success: false,
        output: err.stdout || '',
        error: err.stderr || err.message,
      };
    } finally {
      try { await unlink(filePath); } catch {}
    }
  }

  if (language === 'python') {
    const filePath = join(TEMP_DIR, `${id}.py`);
    try {
      await writeFile(filePath, code, 'utf8');
      const { stdout, stderr } = await execAsync(`python "${filePath}"`, {
        timeout: TIMEOUT,
        maxBuffer: 1024 * 1024,
      });
      return {
        success: true,
        output: stdout || 'No output',
        error: stderr || null,
      };
    } catch (err) {
      if (err.killed) return { success: false, error: 'Time Limit Exceeded' };
      return {
        success: false,
        output: err.stdout || '',
        error: err.stderr || err.message,
      };
    } finally {
      try { await unlink(filePath); } catch {}
    }
  }

  if (language === 'java') {
    const dirPath = join(TEMP_DIR, id);
    const filePath = join(dirPath, 'Main.java');
    try {
      await mkdir(dirPath, { recursive: true });
      // Wrap user code: if it doesn't have a class, put it in a Main class
      let javaCode = code;
      if (!code.includes('class ')) {
        javaCode = `public class Main {\n  public static void main(String[] args) {\n${code}\n  }\n}`;
      } else {
        // Rename the public class to Main so filename matches
        javaCode = code.replace(/public\s+class\s+\w+/, 'public class Main');
      }
      await writeFile(filePath, javaCode, 'utf8');

      // Compile
      await execAsync(`javac "${filePath}"`, { timeout: TIMEOUT });

      // Run
      const { stdout, stderr } = await execAsync(`java -cp "${dirPath}" Main`, {
        timeout: TIMEOUT,
        maxBuffer: 1024 * 1024,
      });
      return {
        success: true,
        output: stdout || 'No output',
        error: stderr || null,
      };
    } catch (err) {
      if (err.killed) return { success: false, error: 'Time Limit Exceeded' };
      return {
        success: false,
        output: err.stdout || '',
        error: err.stderr || err.message,
      };
    } finally {
      try {
        const { rm } = await import('fs/promises');
        await rm(dirPath, { recursive: true, force: true });
      } catch {}
    }
  }

  return { success: false, error: `Unsupported language: ${language}` };
}

export default { runCode, submitCode, getSubmissions, sandboxExecute };
