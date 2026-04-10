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
import axios from 'axios';
import { generateJSWrapper } from './jsExecutor.js';
import { generatePythonWrapper } from './pythonExecutor.js';
import { generateJavaWrapper } from './javaExecutor.js';
import { compareOutputs, normalizeOutput } from './outputComparator.js';
import { parseInputToArgs } from './inputParser.js';

const JUDGE0_API_HOST = 'judge0-ce.p.rapidapi.com';
const JUDGE0_BASE_URL = `https://${JUDGE0_API_HOST}`;

// Map our internal language strings to Judge0 language IDs
const LANGUAGE_ID_MAP = {
  javascript: 63,
  python: 71,
  java: 62,
};

// Simple async delay helper (used to throttle Judge0 calls)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
 * Build wrapper source code for Judge0 based execution.
 * Reuses existing wrapper generators but no longer executes code locally.
 */
function buildWrapperCode(language, userCode, functionName, inputs, returnType) {
  switch (language) {
    case 'javascript':
      return generateJSWrapper(userCode, functionName, inputs);
    case 'python':
      return generatePythonWrapper(userCode, functionName, inputs);
    case 'java':
      return generateJavaWrapper(userCode, functionName, inputs, returnType);
    default:
      return null;
  }
}

async function submitToJudge0(sourceCode, languageId) {
  const rapidApiKey = process.env.RAPID_API_KEY;
  // TEMP DEBUG: verify key and host (remove in production)
  console.log("🔥 KEY:", process.env.RAPID_API_KEY);
  console.log("🔥 HOST:", JUDGE0_API_HOST);

  if (!rapidApiKey) {
    throw new Error('RAPID_API_KEY is not configured on the backend');
  }

  const headers = {
    'X-RapidAPI-Key': rapidApiKey,
    'X-RapidAPI-Host': JUDGE0_API_HOST,
    'Content-Type': 'application/json',
  };

  // Always use wait=false + polling to avoid long-held HTTP connections
  const createRes = await axios.post(
    `${JUDGE0_BASE_URL}/submissions?base64_encoded=false&wait=false`,
    {
      source_code: sourceCode,
      language_id: languageId,
    },
    { headers }
  );

  const token = createRes.data?.token;
  if (!token) {
    throw new Error('Judge0 did not return a submission token');
  }

  const maxAttempts = 20; // ~10s with 500ms delay
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  let lastData = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await axios.get(
      `${JUDGE0_BASE_URL}/submissions/${encodeURIComponent(token)}?base64_encoded=false`,
      { headers }
    );

    lastData = res.data || {};
    const statusId = lastData.status?.id;

    // 1 = In Queue, 2 = Processing; anything else is terminal
    if (statusId && statusId !== 1 && statusId !== 2) {
      break;
    }

    await delay(500);
  }

  return { token, data: lastData };
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
    const normalizedLang = typeof language === 'string' ? language.toLowerCase() : '';
    const languageId = LANGUAGE_ID_MAP[normalizedLang];

    if (!languageId) {
      return {
        success: false,
        error: `Unsupported language: ${language}`,
        type: 'unsupported',
      };
    }

    const wrapperCode = buildWrapperCode(normalizedLang, code, functionName, inputs, returnType);

    if (!wrapperCode) {
      return {
        success: false,
        error: `Failed to build wrapper for language: ${language}`,
        type: 'execution',
      };
    }

    const { data } = await submitToJudge0(wrapperCode, languageId);

    const stdout = (data.stdout || '').trim();
    const stderr = (data.stderr || '').trim();
    const compileOutput = (data.compile_output || '').trim();
    const statusId = data.status?.id;

    // Map Judge0 result to our internal execution result shape
    if (compileOutput) {
      return {
        success: false,
        error: `Compilation Error: ${compileOutput.split('\n')[0]}`,
        type: 'compilation',
      };
    }

    if (statusId === 5) {
      // Time Limit Exceeded in Judge0
      return {
        success: false,
        error: 'Time Limit Exceeded',
        type: 'timeout',
      };
    }

    if (stderr && !stdout) {
      return {
        success: false,
        error: stderr,
        type: 'runtime',
      };
    }

    // Successful (or at least produced some stdout)
    return {
      success: true,
      output: stdout,
    };
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
      // Throttle Judge0 calls to reduce 429 rate-limit errors
      if (i > 0) {
        await sleep(1000);
      }
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
      // Throttle Judge0 calls to reduce 429 rate-limit errors
      if (i > 0) {
        await sleep(1000);
      }
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

    const normalizedLang = typeof language === 'string' ? language.toLowerCase() : '';
    const languageId = LANGUAGE_ID_MAP[normalizedLang];

    if (!languageId) {
      return res.status(400).json({
        success: false,
        error: `Unsupported language: ${language}. Supported: ${Object.keys(LANGUAGE_ID_MAP).join(', ')}`,
      });
    }

    try {
      const { data } = await submitToJudge0(code, languageId);

      const stdout = (data.stdout || '').trim();
      const stderr = (data.stderr || '').trim();
      const compileOutput = (data.compile_output || '').trim();
      const statusId = data.status?.id;

      if (compileOutput) {
        return res.json({
          success: false,
          output: '',
          error: `Compilation Error: ${compileOutput.split('\n')[0]}`,
        });
      }

      if (statusId === 5) {
        return res.json({
          success: false,
          output: '',
          error: 'Time Limit Exceeded',
        });
      }

      if (stderr && !stdout) {
        return res.json({
          success: false,
          output: '',
          error: stderr,
        });
      }

      return res.json({
        success: true,
        output: stdout || 'No output',
        error: stderr || null,
      });
    } catch (err) {
      console.error('Sandbox Judge0 error:', err.response?.data || err.message);

      const status = err.response?.status || 500;
      if (status === 429) {
        return res.status(429).json({
          success: false,
          error: 'API limit exceeded. Try later.',
        });
      }

      return res.status(500).json({
        success: false,
        error: err.response?.data?.message || err.message || 'Failed to execute code via Judge0',
      });
    }
  } catch (error) {
    console.error('Sandbox execute error:', error);
    return res.status(500).json({
      success: false,
      error: `Internal server error: ${error.message}`,
    });
  }
}

export default { runCode, submitCode, getSubmissions, sandboxExecute };
