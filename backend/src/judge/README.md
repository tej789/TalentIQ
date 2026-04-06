# TalentIQ Judge System

A LeetCode-style online judge system that evaluates user code submissions against test cases.

## Overview

The judge system provides:
- **Run Code**: Execute code against visible examples
- **Submit Code**: Execute code against hidden test cases

## Architecture

```
judge/
├── inputParser.js       # Parses various input formats to function arguments
├── outputComparator.js  # Compares expected vs actual outputs
├── jsExecutor.js        # JavaScript execution wrapper
├── pythonExecutor.js    # Python execution wrapper
├── javaExecutor.js      # Java execution wrapper
├── judgeController.js   # Main controller for judge APIs
└── judgeRoutes.js       # Express routes
```

## API Endpoints

### POST /api/judge/run
Execute code against examples (visible test cases).

**Request Body:**
```json
{
  "problemId": "two-sum",
  "code": "function twoSum(nums, target) { ... }",
  "language": "javascript"
}
```

**Response:**
```json
{
  "success": true,
  "status": "passed",
  "results": [
    {
      "testCase": 1,
      "input": "nums = [2,7,11,15], target = 9",
      "expectedOutput": "[0,1]",
      "userOutput": "[0,1]",
      "passed": true
    }
  ],
  "summary": {
    "total": 2,
    "passed": 2,
    "failed": 0,
    "errors": 0
  }
}
```

### POST /api/judge/submit
Execute code against ALL hidden test cases.

**Request Body:**
```json
{
  "problemId": "two-sum",
  "code": "function twoSum(nums, target) { ... }",
  "language": "javascript"
}
```

**Response (Accepted):**
```json
{
  "success": true,
  "verdict": "Accepted",
  "passedCount": 10,
  "totalCount": 10,
  "failedTestCase": null,
  "submissionId": "..."
}
```

**Response (Failed):**
```json
{
  "success": true,
  "verdict": "Wrong Answer",
  "passedCount": 5,
  "totalCount": 10,
  "failedTestCase": {
    "testCaseNumber": 6,
    "input": "[3,2,4]\n6",
    "expectedOutput": "[1,2]",
    "userOutput": "[0,2]"
  },
  "submissionId": "..."
}
```

## Supported Verdicts

- **Accepted** - All test cases passed
- **Wrong Answer** - Output doesn't match expected
- **Time Limit Exceeded** - Execution took too long (>5s)
- **Runtime Error** - Code crashed during execution
- **Compilation Error** - Code failed to compile (Java)

## Language Support

### JavaScript
- User writes a function (e.g., `twoSum(nums, target)`)
- Judge wraps it with a caller that passes test inputs
- Executed with Node.js

### Python
- User writes a function (e.g., `def two_sum(nums, target):`)
- Judge wraps it with a caller
- Executed with Python 3

### Java
- User writes a `Solution` class with a method
- Judge creates a `Main` class wrapper
- Compiled with `javac`, executed with `java`

## Input Format

The system supports multiple input formats:

1. **JSON Object** (Recommended for new problems):
   ```json
   {"nums": [2,7,11,15], "target": 9}
   ```

2. **Human-readable** (Legacy format):
   ```
   nums = [2,7,11,15], target = 9
   ```

3. **Newline-separated**:
   ```
   [2,7,11,15]
   9
   ```

## How It Works

1. User submits code via frontend
2. Backend extracts function name from code
3. For each test case:
   - Parse input to function arguments
   - Generate wrapper code that calls user function
   - Execute wrapper in isolated environment
   - Capture stdout (return value)
   - Compare with expected output
4. Return results to frontend

## Security Notes

- Code runs in temp directories that are cleaned up after execution
- Execution has 5-second timeout to prevent infinite loops
- User code is sandboxed within wrapper functions
- No filesystem access from user code

## Database Schema

Problems should have:
- `examples` - Visible test cases for "Run Code"
- `testCases` - Hidden test cases for "Submit"
- `starterCode` - Template code per language

Example:
```javascript
{
  examples: [
    { input: "nums = [2,7,11,15], target = 9", output: "[0,1]" }
  ],
  testCases: [
    { input: '{"nums": [2,7,11,15], "target": 9}', expectedOutput: "[0,1]" },
    { input: '{"nums": [3,2,4], "target": 6}', expectedOutput: "[1,2]" }
  ],
  starterCode: {
    javascript: "function twoSum(nums, target) {\n  // Write code\n}",
    python: "def two_sum(nums, target):\n    pass",
    java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n    }\n}"
  }
}
```
